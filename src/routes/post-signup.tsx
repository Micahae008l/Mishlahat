import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Mail, Shield, User, X } from "lucide-react";
import { toast } from "sonner";
import {
  completeScoreOnboarding,
  requestOtp,
  verifyOtp,
  type DashboardResponse,
  type YomHameah,
} from "@/lib/api";
import { getToken, setAuthSession } from "@/lib/auth";
import { dashboardQueryOptions, prefetchAuthedData } from "@/lib/queries";
import { PreferenceOptionGrid } from "@/components/PreferenceOptionGrid";
import {
  COMBAT_PREFERENCE_OPTIONS,
  FOCUS_PREFERENCE_OPTIONS,
  FITNESS_PREFERENCE_OPTIONS,
  type CombatPreferenceValue,
  type FocusPreferenceValue,
  type FitnessPreferenceValue,
} from "@/lib/profile-preference-data";
import { IdfPhotoPanel } from "@/components/IdfPhotoPanel";
import { KachKivunLogo } from "@/components/KachKivunLogo";
import { SITE_NAME_HE } from "@/lib/brand";
import { idfPhotoAt } from "@/lib/idf-images";
import { defaultYomHameah12Scores, YOM_HAMEAH_12_KEYS, YOM_HAMEAH_12_LABELS_HE } from "@/lib/yom-hameah-12";
import { ARIA } from "@/lib/a11y";
import {
  PostSignupBootstrapSkeleton,
  PostSignupFormSkeleton,
} from "@/components/skeletons/PageSkeletons";
import { OtpInput } from "@/components/OtpInput";
import {
  coerceCombat,
  coerceFitness,
  coerceFocus,
  computePostSignupResumeStep,
  draftDateToYmd,
  yomFromDashboard,
} from "@/lib/profile-resume";

export const Route = createFileRoute("/post-signup")({
  component: PostSignupPage,
});

const DAPAR_SCORES = [10, 20, 30, 40, 50, 60, 70, 80, 90] as const;
const MEDICAL_SCORES = [21, 45, 64, 72, 82, 97] as const;
const TOTAL_STEPS = 9;

const ease = [0.16, 1, 0.3, 1] as const;

function PostSignupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [dapar, setDapar] = useState<number | "">("");
  const [medical, setMedical] = useState<number | "">("");
  const [yomScores, setYomScores] = useState(() => defaultYomHameah12Scores());
  const [combatPreference, setCombatPreference] = useState<CombatPreferenceValue | "">("");
  const [focusPref, setFocusPref] = useState<FocusPreferenceValue | "">("");
  const [fitnessPref, setFitnessPref] = useState<FitnessPreferenceValue | "">("");
  const [draftDate, setDraftDate] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  function applyServerProfile(d: DashboardResponse) {
    setEmail(d.user.email ?? "");
    setUsername(d.user.preferredName?.trim() ?? "");
    if (d.stats?.daparScore != null) setDapar(d.stats.daparScore);
    if (d.stats?.medicalProfile != null) setMedical(d.stats.medicalProfile);
    setYomScores(yomFromDashboard(d.stats));
    const p = d.preferences;
    setCombatPreference(coerceCombat(p?.combatPreference));
    setFocusPref(coerceFocus(p?.focus));
    setFitnessPref(coerceFitness(p?.physicalActivityLevel));
    setDraftDate(draftDateToYmd(d.stats?.draftDate));
    setStep(computePostSignupResumeStep(d));
  }

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    (async () => {
      if (!getToken()) {
        if (!cancelled) setBootstrapped(true);
        return;
      }
      try {
        const d = await queryClient.fetchQuery(dashboardQueryOptions(getToken()));
        if (cancelled) return;
        if (d.aiReady) {
          navigate({ to: "/dashboard", replace: true });
          return;
        }
        applyServerProfile(d);
      } catch {
        if (!cancelled && getToken()) setStep(3);
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, navigate, queryClient]);

  async function sendCode() {
    if (!email.trim() || !email.includes("@")) {
      toast.error("נא להזין אימייל תקין");
      return;
    }
    setLoading(true);
    try {
      const res = await requestOtp(email.trim());
      if (res.delivery === "console") {
        if (res.devCode) {
          toast.success(`ללא SMTP — לא נשלח מייל. קוד לפיתוח: ${res.devCode}`, { duration: 12_000 });
        } else {
          toast.error("השרת לא שלח אימייל ולא החזיר קוד בדיקה. בדקו הגדרת SMTP ב־server/.env.");
        }
      } else {
        toast.success("שלחנו קוד באימייל (בדקו גם בספאם)");
      }
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה בשליחת קוד");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    const clean = code.replace(/\D/g, "");
    if (clean.length !== 6) {
      toast.error("נא להזין קוד בן 6 ספרות");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp(email.trim(), clean);
      setAuthSession(res.token, res.role);
      prefetchAuthedData(queryClient, res.token);
      try {
        const d = await queryClient.fetchQuery(dashboardQueryOptions(res.token));
        if (d.aiReady) {
          toast.success("התחברתם בהצלחה");
          navigate({ to: "/dashboard", replace: true });
          return;
        }
        toast.success("ממשיכים להשלמת הפרופיל האישי");
        applyServerProfile(d);
        setStep(Math.max(3, computePostSignupResumeStep(d)));
      } catch {
        toast.success("בואו נשלים את הפרופיל");
        setStep(3);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "קוד לא תקין");
    } finally {
      setLoading(false);
    }
  }

  function nextFromUsername() {
    if (!username.trim()) {
      toast.error("נא לבחור שם משתמש");
      return;
    }
    setStep(4);
  }

  function nextFromCoreScores() {
    if (dapar === "" || medical === "") {
      toast.error("נא לבחור דפ״ר ופרופיל רפואי");
      return;
    }
    setStep(5);
  }

  function nextFromPrefs() {
    if (step === 6 && !combatPreference) {
      toast.error("נא לבחור כיוון שירות");
      return;
    }
    if (step === 7 && !focusPref) {
      toast.error("נא לבחור מיקוד");
      return;
    }
    if (step === 8 && !fitnessPref) {
      toast.error("נא לבחור רמת כושר");
      return;
    }
    setStep((s) => s + 1);
  }

  async function finish() {
    if (!username.trim() || dapar === "" || medical === "") {
      toast.error("חסרים שם משתמש, דפ״ר או פרופיל רפואי");
      return;
    }
    if (!combatPreference || !focusPref || !fitnessPref || !draftDate.trim()) {
      toast.error("חסרים העדפות או תאריך גיוס");
      return;
    }
    if (Number.isNaN(Date.parse(draftDate))) {
      toast.error("תאריך גיוס לא תקין");
      return;
    }

    const yomHameah: YomHameah = { ...yomScores };

    setLoading(true);
    try {
      await completeScoreOnboarding({
        username: username.trim(),
        serviceLifeCycle: "pre",
        daparScore: dapar,
        medicalProfile: medical,
        yomHameah,
        yomHameahSource: "self",
        draftDate,
        preferences: {
          combatPreference: combatPreference,
          focus: focusPref,
          physicalActivityLevel: fitnessPref,
          schedule: "Any",
          location: "Anywhere",
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("הפרופיל נשמר — אפשר להשתמש ביועץ AI");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה בשמירה");
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    if (step <= 1) {
      navigate({ to: "/" });
      return;
    }
    if (step === 3 && getToken()) {
      navigate({ to: "/dashboard" });
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  }

  if (!mounted) {
    return (
      <div dir="rtl" className="flex min-h-dvh items-center justify-center bg-background px-6">
        <PostSignupFormSkeleton />
      </div>
    );
  }

  if (getToken() && !bootstrapped) {
    return <PostSignupBootstrapSkeleton />;
  }

  const progress = Math.round((step / TOTAL_STEPS) * 100);
  const meta = getStepMeta(step);
  const isAuthStep = step <= 2;

  return (
    <div dir="rtl" className="relative flex min-h-dvh">
      {/* Background image */}
      <div className="fixed inset-0 transition-opacity duration-500 opacity-30">
        <IdfPhotoPanel
          photo={idfPhotoAt(step)}
          aspectClassName="absolute inset-0 min-h-0"
          className="absolute inset-0"
          overlayClassName="from-background/80 via-background/90 to-background"
          imgClassName="object-[center_35%]"
        />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10">
        {/* Top bar */}
        <div className="mx-auto mb-8 flex w-full max-w-2xl items-center justify-between gap-4">
          <KachKivunLogo size="md" linked />
          {step === 1 ? (
            <Link to="/" className="flex items-center gap-1.5 text-sm text-dust transition hover:text-foreground">
              <X className="h-4 w-4" />
              חזרה לאתר
            </Link>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm text-dust transition hover:text-foreground disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
              חזרה
            </button>
          )}
          {isAuthStep ? (
            <span className="font-mono text-[10px] tracking-widest text-dust/40 uppercase">חיבור מאובטח</span>
          ) : (
            <span className="w-px shrink-0" aria-hidden />
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="w-full max-w-2xl border border-iron/30 bg-background/90 backdrop-blur-sm shadow-[0_4px_40px_-12px_oklch(0_0_0/0.6)]"
        >
          {/* Progress bar */}
          <div className="flex items-center justify-between border-b border-iron/20 px-6 py-4">
            <span className="font-mono text-[10px] tracking-widest text-dust uppercase">
              {isAuthStep ? "התחברות" : "הרשמה"}
            </span>
            <div className="mx-4 h-1 flex-1 overflow-hidden bg-iron/20">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease }}
              />
            </div>
            <span className="font-mono text-[10px] tabular-nums text-dust">
              {step}/{TOTAL_STEPS}
            </span>
          </div>

          <div className="px-4 py-6 sm:px-10 sm:py-10">
            {/* Step header */}
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="mb-8 text-center"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center border border-primary/30 text-primary mb-3">
                {meta.icon}
              </div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">{meta.title}</h1>
              <p className="mt-1 text-sm text-dust">{meta.subtitle}</p>
            </motion.div>

            <div className="space-y-5">
              {step === 1 && (
                <Field label="אימייל">
                  <div className="relative">
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      className="input-field pl-10 pr-4"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dust/40">
                      <Mail className="h-4 w-4" />
                    </span>
                  </div>
                </Field>
              )}

              {step === 2 && (
                <div className="space-y-4 text-right">
                  <p className="text-sm text-dust">
                    שלחנו קוד ל־<span className="font-medium text-foreground" dir="ltr">{email}</span>
                  </p>
                  <Field label="קוד אימות">
                    <OtpInput value={code} onChange={setCode} disabled={loading} />
                  </Field>
                  <button type="button" disabled={loading} onClick={sendCode} className="text-sm text-primary hover:underline disabled:opacity-50">
                    לא קיבלתם? שלחו קוד חדש
                  </button>
                </div>
              )}

              {step === 3 && (
                <Field label="שם משתמש">
                  <div className="relative">
                    <input
                      type="text"
                      autoComplete="nickname"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="איך לקרוא לכם?"
                      className="input-field pl-10 pr-4"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dust/40">
                      <User className="h-4 w-4" />
                    </span>
                  </div>
                </Field>
              )}

              {step === 4 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label='דפ"ר'>
                    <select value={dapar} onChange={(e) => setDapar(e.target.value === "" ? "" : Number(e.target.value))} className="input-field">
                      <option value="">בחרו</option>
                      {DAPAR_SCORES.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>
                  <Field label="פרופיל רפואי">
                    <select value={medical} onChange={(e) => setMedical(e.target.value === "" ? "" : Number(e.target.value))} className="input-field">
                      <option value="">בחרו</option>
                      {MEDICAL_SCORES.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>
                </div>
              )}

              {step === 5 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {YOM_HAMEAH_12_KEYS.map((key) => (
                    <YomSliderCard
                      key={key}
                      title={YOM_HAMEAH_12_LABELS_HE[key]}
                      value={yomScores[key]}
                      onChange={(value) => setYomScores((prev) => ({ ...prev, [key]: value }))}
                    />
                  ))}
                </div>
              )}

              {step === 6 && (
                <PreferenceOptionGrid
                  options={COMBAT_PREFERENCE_OPTIONS}
                  selected={combatPreference}
                  onSelect={setCombatPreference}
                  columnsClass="grid-cols-1 sm:grid-cols-2"
                />
              )}

              {step === 7 && (
                <PreferenceOptionGrid
                  options={FOCUS_PREFERENCE_OPTIONS}
                  selected={focusPref}
                  onSelect={setFocusPref}
                  columnsClass="grid-cols-1 sm:grid-cols-2"
                />
              )}

              {step === 8 && (
                <PreferenceOptionGrid
                  options={FITNESS_PREFERENCE_OPTIONS}
                  selected={fitnessPref}
                  onSelect={setFitnessPref}
                  columnsClass="grid-cols-1 sm:grid-cols-3"
                />
              )}

              {step === 9 && (
                <div className="space-y-3 text-right">
                  <Field label="תאריך גיוס משוער">
                    <div className="relative">
                      <input
                        type="date"
                        value={draftDate}
                        onChange={(e) => setDraftDate(e.target.value)}
                        className="input-field w-full max-w-xs pl-10 text-left"
                        min="2000-01-01"
                        max="2038-12-31"
                      />
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dust/40">
                        <Calendar className="h-4 w-4" />
                      </span>
                    </div>
                  </Field>
                  <p className="text-xs text-dust">אפשר לעדכן מאוחר יותר בפרופיל.</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-start border-t border-iron/20 pt-6">
              {step === 1 && <PrimaryButton loading={loading} onClick={sendCode}>שלחו לי קוד</PrimaryButton>}
              {step === 2 && <PrimaryButton loading={loading} onClick={verifyCode}>המשיכו</PrimaryButton>}
              {step === 3 && <PrimaryButton loading={loading} onClick={nextFromUsername}>הבא</PrimaryButton>}
              {step === 4 && <PrimaryButton loading={loading} onClick={nextFromCoreScores}>הבא</PrimaryButton>}
              {step === 5 && <PrimaryButton loading={loading} onClick={() => setStep(6)}>הבא</PrimaryButton>}
              {step >= 6 && step <= 8 && <PrimaryButton loading={loading} onClick={nextFromPrefs}>הבא</PrimaryButton>}
              {step === 9 && <PrimaryButton loading={loading} onClick={finish}>סיום ודשבורד</PrimaryButton>}
            </div>
          </div>
        </motion.div>

        <p className="mt-6 text-center font-mono text-[9px] text-dust/50">
          {idfPhotoAt(step).creditShort}
        </p>
      </div>
    </div>
  );
}

function getStepMeta(step: number) {
  const icon = <Shield className="h-5 w-5 text-primary" />;
  if (step === 1)
    return {
      icon: <Mail className="h-5 w-5 text-primary" />,
      title: `התחברות ל${SITE_NAME_HE}`,
      subtitle: "הזינו אימייל. אם כבר יש חשבון — נשלח קוד ותיכנסו לדשבורד. אם לא — נמשיך להשלמת פרופיל.",
    };
  if (step === 2) return { icon, title: "הזינו את הקוד", subtitle: "שלחנו קוד לאימייל שלכם." };
  if (step === 3) return { icon: <User className="h-5 w-5 text-primary" />, title: "שם משתמש", subtitle: "זה השם שיופיע בדשבורד וביועץ." };
  if (step === 4) return { icon, title: "ציונים בסיסיים", subtitle: "דפ״ר ופרופיל רפואי נדרשים לפני שימוש ביועץ AI." };
  if (step === 5) return { icon, title: "ציוני מא״ה", subtitle: "12 מדדים. דירוג 1 עד 5 לכל אחד." };
  if (step === 6) return { icon, title: "איך אתם רואים את השירות?", subtitle: "בחרו כיוון שמתאים לכם." };
  if (step === 7) return { icon, title: "מה הכי חשוב לכם?", subtitle: "מיקוד אחד עוזר ליועץ AI." };
  if (step === 8) return { icon, title: "רמת כושר", subtitle: "הערכה עצמית." };
  return { icon: <Calendar className="h-5 w-5 text-primary" />, title: "מתי הגיוס?", subtitle: "בחרו תאריך משוער. אפשר לעדכן בהדרכה." };
}

function PrimaryButton({ children, loading, onClick }: { children: React.ReactNode; loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      aria-busy={loading}
      className="inline-flex min-w-[8rem] items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.97] disabled:opacity-70"
    >
      {loading ? (
        <span className="h-4 w-24 animate-pulse rounded-sm bg-primary-foreground/30" aria-hidden />
      ) : (
        <>
          {children}
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </>
      )}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 text-right">
      <label className="block text-sm font-medium text-foreground">
        <span className="mb-2 block">{label}</span>
        {children}
      </label>
    </div>
  );
}

function YomSliderCard({ title, value, onChange }: { title: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="border border-iron/20 bg-card p-4">
      <label className="block">
        <div className="flex justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="font-mono text-sm font-bold tabular-nums text-primary" aria-hidden>
            {value}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mt-3 w-full accent-primary"
          aria-valuetext={ARIA.rangeValue(title, value, 5)}
        />
      </label>
    </div>
  );
}
