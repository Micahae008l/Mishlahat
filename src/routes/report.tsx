import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ReportHistoryPanel } from "@/components/ReportHistoryPanel";
import { ReportResultView } from "@/components/ReportResultView";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Target,
  MapPin,
  Dumbbell,
  Heart,
  Brain,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import {
  downloadReportPdf,
  generateFullReport,
  type FitnessData,
  type FullReportResponse,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import { openReportPrintWindow } from "@/lib/reportPrintHtml";
import { ARIA, progressBarProps } from "@/lib/a11y";
import { LabeledField } from "@/components/LabeledField";
import { ReportGeneratingSkeleton } from "@/components/skeletons/PageSkeletons";
import { dashboardQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/report")({
  component: ReportPage,
});

const ease = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
};

type Phase = "questions" | "loading" | "result";

type StepId = "roles" | "exits" | "style" | "combat" | "tech" | "finish";

const COMBAT_INTERESTS = new Set(["לוחם / קרבי", "מודיעין", "חיל אוויר"]);
const TECH_INTERESTS = new Set(["8200 / סייבר", "טכנולוגיה / הנדסה"]);

function deriveTracks(interested: string[]) {
  const picks = interested.filter((x) => x !== "עדיין לא יודע/ת");
  return {
    wantsCombat: picks.some((r) => COMBAT_INTERESTS.has(r)),
    wantsTech: picks.some((r) => TECH_INTERESTS.has(r)),
  };
}

function buildStepFlow(interested: string[]): StepId[] {
  const { wantsCombat, wantsTech } = deriveTracks(interested);
  const flow: StepId[] = ["roles", "exits", "style"];
  if (wantsCombat) flow.push("combat");
  if (wantsTech) flow.push("tech");
  flow.push("finish");
  return flow;
}

const STEP_META: Record<StepId, { icon: typeof Target; title: string; subtitle: string }> = {
  roles: { icon: Target, title: "תפקידים", subtitle: "לחיצה בלבד" },
  exits: { icon: MapPin, title: "יציאות וסביבה", subtitle: "חמשושים, שושים, 12, 21, שבוע-שבוע" },
  style: { icon: Brain, title: "סגנון", subtitle: "2 שאלות קצרות" },
  combat: { icon: Dumbbell, title: "כושר וקרביות", subtitle: "כי בחרתם כיוון קרבי / שטח" },
  tech: { icon: Monitor, title: "טכנולוגיה", subtitle: "כי בחרתם כיוון מחשבים / סייבר" },
  finish: { icon: Heart, title: "סיום", subtitle: "מוטיבציה — כמעט נגמר" },
};

const ROLE_INTEREST_CHIPS = [
  "8200 / סייבר",
  "לוחם / קרבי",
  "מודיעין",
  "טכנולוגיה / הנדסה",
  "רפואה / פרמדיק",
  "חיל אוויר",
  "חיל הים",
  "הדרכה / חינוך",
  "לוגיסטיקה",
  "עדיין לא יודע/ת",
];

const ROLE_AVOID_CHIPS = [
  "טבחות / שירותים",
  "שמירות / לילות",
  "רחוק מהבית",
  "רק משרד",
  "פיזי מדי",
  "מונוטוני / משעמם",
];

/** יציאות הביתה — מערכות לפי תפקיד (לא חמ"ש) */
const EXITS_OPTIONS = [
  { value: "week_on_off", label: "שבוע בסיס / שבוע בית" },
  { value: "hamshushim", label: "חמשושים — 4 ימים בבסיס, 3 בבית" },
  { value: "shushim", label: "שושים — 5 ימים בבסיס, 2 בבית" },
  { value: "12", label: "12 — 12 ימים בבסיס, 2 בבית" },
  { value: "21", label: "21 — 19 ימים בבסיס, 2 בבית" },
  { value: "rare", label: "יציאות נדירות (לרוב קרבי / מיוחד)" },
  { value: "no_pref", label: "לא משנה לי" },
];

const ENVIRONMENT_OPTIONS = [
  { value: "office", label: "משרד / מסך" },
  { value: "field", label: "שטח / חוץ" },
  { value: "mixed", label: "שילוב" },
  { value: "no_pref", label: "לא משנה" },
];

const STRESS_OPTIONS = [
  { value: "high", label: "משגשג/ת תחת לחץ" },
  { value: "moderate", label: "סבבה, לא מחפש/ת לחץ" },
  { value: "low", label: "מעדיף/ה רגוע" },
];

const LEADERSHIP_OPTIONS = [
  { value: "want_lead", label: "רוצה לפקד" },
  { value: "open", label: "פתוח/ה אם יציעו" },
  { value: "prefer_not", label: "עדיף בצוות" },
];

const RUN3KM_CHIPS = ["לא יודע/ת", "מעל 15 דק׳", "13–15 דק׳", "מתחת ל-13 דק׳"];
const PULLUPS_CHIPS = ["לא יודע/ת", "0–5", "6–15", "16+"];
const PUSHUPS_CHIPS = ["לא יודע/ת", "0–30", "31–60", "61+"];
const COMBAT_READY_CHIPS = ["מוכן/ה פיזית", "בינוני — צריך שיפור", "חלש/ה — רוצה להשתפר", "לא בטוח/ה"];
const TECH_LEVEL_CHIPS = ["כמעט לא", "בסיסי", "בינוני — קצת קוד", "גבוה — פרויקטים", "מומחה / CTF"];
const TECH_AREA_CHIPS = [
  "תכנות",
  "סייבר / אבטחה",
  "רשתות",
  "דאטה / AI",
  "חומרה / אלקטרוניקה",
  "עדיין לא",
];
const MOTIVATION_CHIPS = ["תרומה למדינה", "אתגר", "מקצוע אחרי צבא", "חברים / חוויה", "לגדול", "לא בטוח/ה"];

function ReportPage() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("questions");
  const [step, setStep] = useState(0);
  const [rolesInterested, setRolesInterested] = useState<string[]>([]);
  const [rolesAvoid, setRolesAvoid] = useState<string[]>([]);
  const [exitsPreference, setExitsPreference] = useState("");
  const [environment, setEnvironment] = useState("");
  const [stressLevel, setStressLevel] = useState("");
  const [leadership, setLeadership] = useState("");
  const [run3kmBand, setRun3kmBand] = useState("");
  const [pullUpsBand, setPullUpsBand] = useState("");
  const [pushUpsBand, setPushUpsBand] = useState("");
  const [combatReady, setCombatReady] = useState("");
  const [techLevel, setTechLevel] = useState("");
  const [techAreas, setTechAreas] = useState<string[]>([]);
  const [motivationPicks, setMotivationPicks] = useState<string[]>([]);
  const [extraNote, setExtraNote] = useState("");

  const steps = useMemo(() => buildStepFlow(rolesInterested), [rolesInterested]);
  const { wantsCombat, wantsTech } = deriveTracks(rolesInterested);
  const stepId = steps[step] ?? "finish";
  const totalSteps = steps.length;

  useEffect(() => {
    if (step >= steps.length) setStep(Math.max(0, steps.length - 1));
  }, [steps.length, step]);

  const [result, setResult] = useState<FullReportResponse | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const queryClient = useQueryClient();
  const token = mounted ? getToken() : null;

  const { data: dash, isPending: dashPending } = useQuery({
    ...dashboardQueryOptions(token),
    enabled: mounted && !!token,
  });
  const aiReady = Boolean(dash?.aiReady);
  const tokenCapped = Boolean(dash?.aiTokens?.capped);
  const dashBooting = mounted && !!token && dashPending && !dash;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!token) {
      navigate({ to: "/post-signup" });
      return;
    }
    if (dash && !dash.aiReady) {
      toast.error("יש להשלים את הפרופיל לפני יצירת דוח");
      navigate({ to: "/post-signup" });
    }
  }, [mounted, token, dash, navigate]);

  async function submitReport() {
    if (tokenCapped) {
      toast.error("הגעתם למכסת הטוקנים ליצירת דוח AI");
      return;
    }
    setPhase("loading");
    const fitness: FitnessData = {
      run3km: run3kmBand && run3kmBand !== "לא יודע/ת" ? run3kmBand : undefined,
      pullUps: null,
      pushUps: null,
      sitUps: null,
      motivation: motivationPicks.length ? motivationPicks.join(", ") : undefined,
      interests: rolesInterested.length ? rolesInterested.join(", ") : undefined,
      languages: undefined,
      notes: buildExtendedNotes(),
    };

    try {
      const data = await generateFullReport(fitness);
      setResult(data);
      setJustSaved(true);
      setPhase("result");
      void queryClient.invalidateQueries({ queryKey: ["report-history"] });
      toast.success("הדוח מוכן ונשמר בהיסטוריה");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה ביצירת הדוח");
      setPhase("questions");
    }
  }

  function buildExtendedNotes(): string {
    const lines: string[] = [];
    if (rolesInterested.length) lines.push(`תפקידים שמעניינים: ${rolesInterested.join(", ")}`);
    if (rolesAvoid.length) lines.push(`לא רוצה / חושש מ: ${rolesAvoid.join(", ")}`);
    if (exitsPreference) {
      const label = EXITS_OPTIONS.find((o) => o.value === exitsPreference)?.label || exitsPreference;
      lines.push(`העדפת יציאות הביתה (לפי מערכת התפקיד): ${label}`);
    }
    if (environment) {
      lines.push(`סביבת עבודה: ${ENVIRONMENT_OPTIONS.find((o) => o.value === environment)?.label || environment}`);
    }
    if (stressLevel) lines.push(`לחץ: ${STRESS_OPTIONS.find((o) => o.value === stressLevel)?.label || stressLevel}`);
    if (leadership) lines.push(`מנהיגות: ${LEADERSHIP_OPTIONS.find((o) => o.value === leadership)?.label || leadership}`);
    if (pullUpsBand && pullUpsBand !== "לא יודע/ת") lines.push(`מתח (טווח): ${pullUpsBand}`);
    if (pushUpsBand && pushUpsBand !== "לא יודע/ת") lines.push(`שכיבות סמיכה (טווח): ${pushUpsBand}`);
    if (combatReady) lines.push(`מוכנות לכיוון קרבי: ${combatReady}`);
    if (techLevel) lines.push(`רמת טכנולוגיה: ${techLevel}`);
    if (techAreas.length) lines.push(`תחומי טכנולוגיה: ${techAreas.join(", ")}`);
    if (extraNote.trim()) lines.push(`הערה חופשית: ${extraNote.trim()}`);
    return lines.join("\n");
  }

  function handlePrintPdf() {
    if (!result) return;
    try {
      openReportPrintWindow(result.report, result.userName);
      toast.success("נפתח חלון הדפסה — בחרו «שמור כ-PDF»");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "לא ניתן לפתוח חלון הדפסה");
    }
  }

  async function handleServerPdfDownload() {
    if (!result) return;
    setPdfLoading(true);
    try {
      const blob = await downloadReportPdf(result.report, result.userName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kachkivun-report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF הורד");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה בהורדת PDF");
    } finally {
      setPdfLoading(false);
    }
  }

  if (!mounted || dashBooting || (token && !aiReady)) {
    return <ReportGeneratingSkeleton />;
  }

  if (phase === "loading") {
    return <ReportGeneratingSkeleton />;
  }

  if (phase === "result" && result) {
    return (
      <ReportResultView
        data={result}
        onPrint={handlePrintPdf}
        onServerDownload={handleServerPdfDownload}
        pdfLoading={pdfLoading}
        savedBadge={justSaved}
      />
    );
  }

  const currentMeta = STEP_META[stepId];
  const CurrentIcon = currentMeta.icon;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 topo-lines">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeUp} className="border-b border-iron/30 pb-5 text-right">
          <Link
            to="/dashboard"
            className="mb-3 inline-flex items-center gap-1 text-sm text-dust transition hover:text-primary"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
            חזרה לדשבורד
          </Link>
          <p className="mb-2 font-mono text-xs tracking-widest text-primary uppercase">דוח כיוון אישי</p>
          <h1 className="text-2xl font-black sm:text-3xl">בואו נכיר אתכם</h1>
          <p className="mt-2 max-w-lg text-sm text-dust">
            רוב התשובות בלחיצה — בלי הקלדה. אפשר לדלג בכל שלב.
          </p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <ReportHistoryPanel />
        </motion.div>

        {tokenCapped ? (
          <motion.div
            variants={fadeUp}
            className="border border-destructive/30 bg-destructive/5 p-5 text-right text-sm"
          >
            <p className="font-semibold text-foreground">מכסת הטוקנים נוצלה</p>
            <p className="mt-1 text-dust">
              לא ניתן ליצור דוח חדש עד שמנהל המערכת יגדיל את המכסה (
              {dash?.aiTokens?.used?.toLocaleString("he-IL")} / {dash?.aiTokens?.cap?.toLocaleString("he-IL")}{" "}
              טוקנים).
            </p>
          </motion.div>
        ) : null}

        {/* Progress */}
        <motion.div variants={fadeUp} className="space-y-2">
          <div className="flex items-center justify-between text-xs text-dust">
            <span aria-hidden>
              {step + 1} / {totalSteps}
            </span>
            <span className="flex items-center gap-1.5">
              <CurrentIcon className="h-3.5 w-3.5 text-primary" aria-hidden />
              {currentMeta.title}
            </span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-iron/25"
            {...progressBarProps(
              Math.round(((step + 1) / totalSteps) * 100),
              ARIA.reportWizardProgress(step + 1, totalSteps, currentMeta.title),
            )}
          >
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              aria-hidden
            />
          </div>
        </motion.div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stepId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease }}
          >
            {stepId === "roles" && (
              <div className="border border-iron/30 bg-card p-6 space-y-6">
                <SectionHeader icon={Target} title="תפקידים" subtitle="אפשר לבחור כמה — בלי הקלדה" />
                <Field label="מה נשמע לכם מעניין? (בחירה מרובה)" group>
                  <MultiChip options={ROLE_INTEREST_CHIPS} values={rolesInterested} onChange={setRolesInterested} />
                </Field>
                <Field label="מה פחות מתאים לכם? (בחירה מרובה)" group>
                  <MultiChip options={ROLE_AVOID_CHIPS} values={rolesAvoid} onChange={setRolesAvoid} />
                </Field>
                {(wantsCombat || wantsTech) && (
                  <p className="rounded-sm border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-dust">
                    {wantsCombat && wantsTech
                      ? "בהמשך: שאלות כושר (קרבי) ושאלות טכנולוגיה — לפי מה שבחרתם."
                      : wantsCombat
                        ? "בהמשך: נשאל על כושר ומוכנות פיזית — כי בחרתם כיוון קרבי."
                        : "בהמשך: נשאל על ידע וטכנולוגיה — כי בחרתם כיוון מחשבים."}
                  </p>
                )}
              </div>
            )}

            {stepId === "exits" && (
              <div className="border border-iron/30 bg-card p-6 space-y-6">
                <SectionHeader
                  icon={MapPin}
                  title="יציאות וסביבה"
                  subtitle="מערכת יציאות לפי תפקיד — לא אורך שירות"
                />
                <Field label="איזו מערכת יציאות הכי מתאימה לכם?" group>
                  <p className="text-xs text-dust/80 -mt-1 mb-2">
                    כל תפקיד עם מערכת משלו (חמשושים, שושים, 12, 21, שבוע-שבוע). חמ&quot;ש דומה לכולם — זה רק כמה יוצאים הביתה.
                  </p>
                  <ChoiceGroup options={EXITS_OPTIONS} value={exitsPreference} onChange={setExitsPreference} />
                </Field>
                <Field label="איפה אתם מעדיפים לעבוד?" group>
                  <div className="flex flex-wrap gap-2">
                    {ENVIRONMENT_OPTIONS.map((opt) => (
                      <ChipButton
                        key={opt.value}
                        selected={environment === opt.value}
                        onClick={() => setEnvironment(opt.value)}
                      >
                        {opt.label}
                      </ChipButton>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {stepId === "style" && (
              <div className="border border-iron/30 bg-card p-6 space-y-6">
                <SectionHeader icon={Brain} title="סגנון אישי" subtitle="שתי שאלות — לחיצה" />
                <Field label="מנהיגות ופיקוד" group>
                  <div className="flex flex-wrap gap-2">
                    {LEADERSHIP_OPTIONS.map((opt) => (
                      <ChipButton
                        key={opt.value}
                        selected={leadership === opt.value}
                        onClick={() => setLeadership(opt.value)}
                      >
                        {opt.label}
                      </ChipButton>
                    ))}
                  </div>
                </Field>
                <Field label="לחץ ועומס" group>
                  <div className="flex flex-wrap gap-2">
                    {STRESS_OPTIONS.map((opt) => (
                      <ChipButton
                        key={opt.value}
                        selected={stressLevel === opt.value}
                        onClick={() => setStressLevel(opt.value)}
                      >
                        {opt.label}
                      </ChipButton>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {stepId === "combat" && (
              <div className="border border-iron/30 bg-card p-6 space-y-6">
                <SectionHeader
                  icon={Dumbbell}
                  title="כושר ומוכנות"
                  subtitle="רק כי בחרתם לוחם / מודיעין / חיל אוויר"
                />
                <Field label="כושר בערך (בחירה)" group>
                  <p className="text-xs text-dust/80 mb-2">ריצת 3 ק&quot;מ</p>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {RUN3KM_CHIPS.map((opt) => (
                      <ChipButton key={opt} selected={run3kmBand === opt} onClick={() => setRun3kmBand(opt)}>
                        {opt}
                      </ChipButton>
                    ))}
                  </div>
                  <p className="text-xs text-dust/80 mb-2">מתח</p>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {PULLUPS_CHIPS.map((opt) => (
                      <ChipButton key={opt} selected={pullUpsBand === opt} onClick={() => setPullUpsBand(opt)}>
                        {opt}
                      </ChipButton>
                    ))}
                  </div>
                  <p className="text-xs text-dust/80 mb-2">שכיבות סמיכה (2 דק׳)</p>
                  <div className="flex flex-wrap gap-2">
                    {PUSHUPS_CHIPS.map((opt) => (
                      <ChipButton key={opt} selected={pushUpsBand === opt} onClick={() => setPushUpsBand(opt)}>
                        {opt}
                      </ChipButton>
                    ))}
                  </div>
                </Field>
                <Field label="איך אתם מרגישים לגבי כיוון קרבי?" group>
                  <div className="flex flex-wrap gap-2">
                    {COMBAT_READY_CHIPS.map((opt) => (
                      <ChipButton key={opt} selected={combatReady === opt} onClick={() => setCombatReady(opt)}>
                        {opt}
                      </ChipButton>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {stepId === "tech" && (
              <div className="border border-iron/30 bg-card p-6 space-y-6">
                <SectionHeader
                  icon={Monitor}
                  title="ידע טכנולוגי"
                  subtitle="רק כי בחרתם 8200 / סייבר / הנדסה"
                />
                <Field label="רמת ידע במחשבים" group>
                  <div className="flex flex-wrap gap-2">
                    {TECH_LEVEL_CHIPS.map((opt) => (
                      <ChipButton key={opt} selected={techLevel === opt} onClick={() => setTechLevel(opt)}>
                        {opt}
                      </ChipButton>
                    ))}
                  </div>
                </Field>
                <Field label="מה מעניין אתכם? (אפשר כמה)" group>
                  <MultiChip options={TECH_AREA_CHIPS} values={techAreas} onChange={setTechAreas} />
                </Field>
              </div>
            )}

            {stepId === "finish" && (
              <div className="border border-iron/30 bg-card p-6 space-y-6">
                <SectionHeader icon={Heart} title="כמעט סיימנו" subtitle="שאלה אחרונה" />
                <Field label="מה הכי חשוב לכם מהשירות? (אפשר כמה)" group>
                  <MultiChip options={MOTIVATION_CHIPS} values={motivationPicks} onChange={setMotivationPicks} />
                </Field>
                <Field label="משהו אחד שחשוב שנדע? (אופציונלי)">
                  <input
                    type="text"
                    value={extraNote}
                    onChange={(e) => setExtraNote(e.target.value)}
                    placeholder="שורה אחת — רק אם בא לכם"
                    className="input-field"
                    maxLength={120}
                  />
                </Field>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <motion.div variants={fadeUp} className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            {step === totalSteps - 1 ? (
              <button
                type="button"
                onClick={submitReport}
                disabled={tokenCapped}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.97] disabled:opacity-40"
              >
                <FileText className="h-4 w-4" aria-hidden />
                צרו לי את הדוח
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.97]"
              >
                הבא
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
            )}
            {step < totalSteps - 1 && (
              <button
                type="button"
                onClick={submitReport}
                disabled={tokenCapped}
                className="text-sm text-dust transition hover:text-foreground disabled:opacity-40"
              >
                דלגו ליצירת הדוח
              </button>
            )}
          </div>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center gap-1 text-sm text-dust transition hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
              הקודם
            </button>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="text-center text-xs text-dust/60">
          הכל אופציונלי. אפשר ללחוץ «דלגו ליצירת הדוח» בכל שלב.
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── UI Components ────────────────────────────────────────────────────────────

function Field({ label, children, group = false }: { label: string; children: React.ReactNode; group?: boolean }) {
  return (
    <LabeledField label={label} asGroup={group} labelClassName="text-sm font-medium text-dust">
      {children}
    </LabeledField>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-iron/20 pb-4 mb-1">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-primary/30 bg-primary/10" aria-hidden>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-dust">{subtitle}</p>
      </div>
    </div>
  );
}

function ChoiceGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={selected}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-sm border px-4 py-2.5 text-right text-sm transition ${
              selected
                ? "border-primary/50 bg-primary/10 text-foreground"
                : "border-iron/30 bg-transparent text-dust hover:border-iron/50 hover:text-foreground"
            }`}
          >
            <span
              className={`h-4 w-4 shrink-0 rounded-full border-2 transition ${
                selected ? "border-primary bg-primary" : "border-iron/50"
              }`}
              aria-hidden
            >
              {selected && <span className="mx-auto mt-[3px] block h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
            </span>
            <span className="flex-1">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function MultiChip({
  options,
  values,
  onChange,
}: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(opt: string) {
    onChange(values.includes(opt) ? values.filter((x) => x !== opt) : [...values, opt]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <ChipButton key={opt} selected={values.includes(opt)} onClick={() => toggle(opt)}>
          {opt}
        </ChipButton>
      ))}
    </div>
  );
}

function ChipButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition ${
        selected
          ? "border-primary/50 bg-primary/15 text-primary"
          : "border-iron/30 text-dust hover:border-iron/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
