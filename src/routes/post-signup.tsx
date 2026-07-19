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
import { DraftDateField } from "@/components/DraftDateField";
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
import { FormField, FieldError } from "@/components/FormField";
import { authErrorField, getErrorMessage } from "@/lib/api-errors";
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

type FieldKey = "email" | "code" | "username" | "dapar" | "medical" | "combat" | "focus" | "fitness" | "draftDate";
type FieldErrors = Partial<Record<FieldKey, string>>;

const ease = [0.16, 1, 0.3, 1] as const;

function normalizeEmailInput(value: string) {
  return value.trim().toLowerCase();
}

function normalizeOtpInput(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 6);
}

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  function clearFieldErrors(...keys: FieldKey[]) {
    if (keys.length === 0) {
      setFieldErrors({});
      return;
    }
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const key of keys) delete next[key];
      return next;
    });
  }

  function setFieldError(key: FieldKey, message: string) {
    setFieldErrors((prev) => ({ ...prev, [key]: message }));
  }

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
    clearFieldErrors("email");
    const normalizedEmail = normalizeEmailInput(email);
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setFieldError("email", "נא להזין כתובת אימייל תקינה (למשל name@gmail.com)");
      return;
    }
    setLoading(true);
    try {
      const res = await requestOtp(normalizedEmail);
      setEmail(normalizedEmail);
      if (res.devCode) {
        setDevOtpHint(res.devCode);
        setCode(res.devCode);
        toast.success("קוד פיתוח, מוצג למטה (ללא SMTP)", { duration: 12_000 });
      } else if (res.delivery === "console") {
        setDevOtpHint(null);
        toast.success("ללא SMTP, הקוד מודפס בלוג השרת בלבד.", { duration: 12_000 });
      } else {
        setDevOtpHint(null);
        toast.success("שלחנו קוד באימייל (בדקו גם בספאם)");
      }
      clearFieldErrors("code");
      setStep(2);
    } catch (err) {
      const msg = getErrorMessage(err, "שגיאה בשליחת קוד");
      const field = authErrorField(err) ?? "email";
      setFieldError(field, msg);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    clearFieldErrors("code");
    const normalizedEmail = normalizeEmailInput(email);
    const clean = normalizeOtpInput(code);
    if (clean.length !== 6) {
      setFieldError("code", "נא להזין קוד בן 6 ספרות");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp(normalizedEmail, clean);
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
      const msg = getErrorMessage(err, "קוד לא תקין");
      setFieldError(authErrorField(err) ?? "code", msg);
    } finally {
      setLoading(false);
    }
  }

  function nextFromUsername() {
    clearFieldErrors("username");
    if (!username.trim()) {
      setFieldError("username", "נא לבחור שם משתמש, איך לקרוא לכם בדשבורד");
      return;
    }
    setStep(4);
  }

  function nextFromCoreScores() {
    clearFieldErrors("dapar", "medical");
    let hasError = false;
    if (dapar === "") {
      setFieldError("dapar", 'נא לבחור ציון דפ"ר');
      hasError = true;
    }
    if (medical === "") {
      setFieldError("medical", "נא לבחור פרופיל רפואי");
      hasError = true;
    }
    if (hasError) return;
    setStep(5);
  }

  function nextFromPrefs() {
    if (step === 6) {
      clearFieldErrors("combat");
      if (!combatPreference) {
        setFieldError("combat", "נא לבחור כיוון שירות לפני המשך");
        return;
      }
    }
    if (step === 7) {
      clearFieldErrors("focus");
      if (!focusPref) {
        setFieldError("focus", "נא לבחור מיקוד אחד לפני המשך");
        return;
      }
    }
    if (step === 8) {
      clearFieldErrors("fitness");
      if (!fitnessPref) {
        setFieldError("fitness", "נא לבחור רמת כושר לפני המשך");
        return;
      }
    }
    setStep((s) => s + 1);
  }

  async function finish() {
    clearFieldErrors();
    let hasError = false;
    if (!username.trim()) {
      setFieldError("username", "חסר שם משתמש");
      hasError = true;
    }
    if (dapar === "") {
      setFieldError("dapar", 'חסר ציון דפ"ר');
      hasError = true;
    }
    if (medical === "") {
      setFieldError("medical", "חסר פרופיל רפואי");
      hasError = true;
    }
    if (!combatPreference) {
      setFieldError("combat", "חסר כיוון שירות");
      hasError = true;
    }
    if (!focusPref) {
      setFieldError("focus", "חסר מיקוד");
      hasError = true;
    }
    if (!fitnessPref) {
      setFieldError("fitness", "חסרה רמת כושר");
      hasError = true;
    }
    if (!draftDate.trim()) {
      setFieldError("draftDate", "נא לבחור תאריך גיוס משוער");
      hasError = true;
    } else if (Number.isNaN(Date.parse(draftDate))) {
      setFieldError("draftDate", "תאריך הגיוס לא תקין, בחרו תאריך מהלוח");
      hasError = true;
    }
    if (hasError) return;

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
      toast.success("הפרופיל נשמר, אפשר להשתמש ביועץ AI");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(getErrorMessage(err, "שגיאה בשמירת הפרופיל"));
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
                <FormField label="אימייל" error={fieldErrors.email}>
                  <div className="relative">
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldErrors("email");
                      }}
                      placeholder="name@gmail.com"
                      className={`input-field pl-10 pr-4${fieldErrors.email ? " input-field--invalid" : ""}`}
                      aria-invalid={fieldErrors.email ? true : undefined}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dust/40">
                      <Mail className="h-4 w-4" />
                    </span>
                  </div>
                </FormField>
              )}

              {step === 2 && (
                <div className="mx-auto max-w-md space-y-5">
                  <p className="text-center text-sm text-dust">
                    שלחנו קוד ל־<span className="font-medium text-foreground" dir="ltr">{email}</span>
                  </p>
                  {devOtpHint ? (
                    <p className="rounded-sm border border-primary/30 bg-primary/10 px-3 py-2 text-center text-sm text-primary" dir="ltr">
                      קוד פיתוח (ללא SMTP): <span className="font-mono font-bold tracking-widest">{devOtpHint}</span>
                    </p>
                  ) : null}
                  <FormField label="קוד אימות (6 ספרות)" error={fieldErrors.code}>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(e) => {
                        setCode(normalizeOtpInput(e.target.value));
                        clearFieldErrors("code");
                      }}
                      placeholder="000000"
                      disabled={loading}
                      dir="ltr"
                      className={`input-field text-center font-mono text-2xl font-bold tracking-[0.35em]${fieldErrors.code ? " input-field--invalid" : ""}`}
                      aria-invalid={fieldErrors.code ? true : undefined}
                    />
                  </FormField>
                  <p className="text-center text-xs text-dust">
                    אם שלחתם קוד חדש, השתמשו רק בקוד האחרון.
                  </p>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setCode("");
                      void sendCode();
                    }}
                    className="block w-full text-center text-sm text-primary hover:underline disabled:opacity-50"
                  >
                    לא קיבלתם? שלחו קוד חדש
                  </button>
                </div>
              )}

              {step === 3 && (
                <FormField label="שם משתמש" error={fieldErrors.username}>
                  <div className="relative">
                    <input
                      type="text"
                      autoComplete="nickname"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        clearFieldErrors("username");
                      }}
                      placeholder="איך לקרוא לכם?"
                      className={`input-field pl-10 pr-4${fieldErrors.username ? " input-field--invalid" : ""}`}
                      aria-invalid={fieldErrors.username ? true : undefined}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dust/40">
                      <User className="h-4 w-4" />
                    </span>
                  </div>
                </FormField>
              )}

              {step === 4 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label='דפ"ר' error={fieldErrors.dapar}>
                    <select
                      value={dapar}
                      onChange={(e) => {
                        setDapar(e.target.value === "" ? "" : Number(e.target.value));
                        clearFieldErrors("dapar");
                      }}
                      className="input-field"
                    >
                      <option value="">בחרו</option>
                      {DAPAR_SCORES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="פרופיל רפואי" error={fieldErrors.medical}>
                    <select
                      value={medical}
                      onChange={(e) => {
                        setMedical(e.target.value === "" ? "" : Number(e.target.value));
                        clearFieldErrors("medical");
                      }}
                      className="input-field"
                    >
                      <option value="">בחרו</option>
                      {MEDICAL_SCORES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </FormField>
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
                <div className="space-y-3">
                  <PreferenceOptionGrid
                    options={COMBAT_PREFERENCE_OPTIONS}
                    selected={combatPreference}
                    onSelect={(v) => {
                      setCombatPreference(v);
                      clearFieldErrors("combat");
                    }}
                    columnsClass="grid-cols-1 sm:grid-cols-2"
                  />
                  {fieldErrors.combat ? <FieldError message={fieldErrors.combat} /> : null}
                </div>
              )}

              {step === 7 && (
                <div className="space-y-3">
                  <PreferenceOptionGrid
                    options={FOCUS_PREFERENCE_OPTIONS}
                    selected={focusPref}
                    onSelect={(v) => {
                      setFocusPref(v);
                      clearFieldErrors("focus");
                    }}
                    columnsClass="grid-cols-1 sm:grid-cols-2"
                  />
                  {fieldErrors.focus ? <FieldError message={fieldErrors.focus} /> : null}
                </div>
              )}

              {step === 8 && (
                <div className="space-y-3">
                  <PreferenceOptionGrid
                    options={FITNESS_PREFERENCE_OPTIONS}
                    selected={fitnessPref}
                    onSelect={(v) => {
                      setFitnessPref(v);
                      clearFieldErrors("fitness");
                    }}
                    columnsClass="grid-cols-1 sm:grid-cols-3"
                  />
                  {fieldErrors.fitness ? <FieldError message={fieldErrors.fitness} /> : null}
                </div>
              )}

              {step === 9 && (
                <div className="space-y-3 text-right">
                  <FormField label="תאריך גיוס משוער" error={fieldErrors.draftDate}>
                    <DraftDateField
                      value={draftDate}
                      onChange={(v) => {
                        setDraftDate(v);
                        clearFieldErrors("draftDate");
                      }}
                      invalid={Boolean(fieldErrors.draftDate)}
                    />
                  </FormField>
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
      subtitle: "הזינו אימייל. אם כבר יש חשבון, נשלח קוד ותיכנסו לדשבורד. אם לא, נמשיך להשלמת פרופיל.",
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
