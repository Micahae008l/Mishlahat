import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Target, Calendar, FileText, Compass, CheckCircle2, CircleDot, Circle } from "lucide-react";
import { DashboardAccountPreferences } from "@/components/DashboardAccountPreferences";
import { DashboardActionCard } from "@/components/DashboardActionCard";
import { OfficialScoresNudge } from "@/components/OfficialScoresNudge";
import { computeMatchAccuracy } from "@/lib/match-accuracy";
import { computePrepTimeline } from "@/lib/prep-timeline";
import { migrateLegacyYomHameahTo12, YOM_HAMEAH_12_KEYS } from "@/lib/yom-hameah-12";
import { progressBarProps } from "@/lib/a11y";
import { DashboardSkeleton } from "@/components/skeletons/PageSkeletons";
import { dashboardQueryOptions } from "@/lib/queries";
import { getToken } from "@/lib/auth";
import { AI_PROFILE_MISSING_LABELS } from "@/lib/profile-preference-data";
import { IdfPhotoPanel } from "@/components/IdfPhotoPanel";
import { getIdfPhoto } from "@/lib/idf-images";
import { MATCH_TOOL_DESC, MATCH_TOOL_NAME, SECRETARY_COMING } from "@/lib/voice";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "דשבורד | קח כיוון" },
      { name: "description", content: "דשבורד אישי: דפ״ר, פרופיל רפואי, ספירה לאחור ליום הגיוס, והתאמת תפקידים." },
    ],
  }),
});

const ease = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

function useCountdown(target: Date | null, windowStart: Date | null) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!target || Number.isNaN(target.getTime())) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, towardPct: 0 };
  }
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  const fallbackStart = new Date(now.getTime() - 365 * 86_400_000);
  const start =
    windowStart && !Number.isNaN(windowStart.getTime()) ? windowStart : fallbackStart;
  const total = target.getTime() - start.getTime();
  const towardPct =
    total <= 0
      ? 100
      : Math.min(100, Math.max(0, Math.round(((now.getTime() - start.getTime()) / total) * 100)));

  return { days, hours, minutes, seconds, towardPct };
}

function statusHebrew(status: string) {
  if (status === "Active Duty") return "בשירות פעיל";
  if (status === "Discharged") return "אחרי שירות";
  return "לפני גיוס";
}

function yomSummary(yom: unknown) {
  const m = migrateLegacyYomHameahTo12(yom);
  if (!m) return { label: "—", pct: 0 };
  const sum = YOM_HAMEAH_12_KEYS.reduce((acc, k) => acc + m[k], 0);
  const avg = sum / 12;
  return { label: `${avg.toFixed(1)}/5`, pct: Math.min(100, Math.round((avg / 5) * 100)) };
}

function displayName(email: string) {
  const local = email.split("@")[0] ?? "Soldier";
  return local.length > 16 ? `${local.slice(0, 14)}…` : local;
}

function DashboardPage() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const token = mounted ? getToken() : null;

  useEffect(() => {
    if (mounted && !getToken()) {
      navigate({ to: "/post-signup" });
    }
  }, [mounted, navigate]);

  const { data, isPending, isError, error, refetch } = useQuery({
    ...dashboardQueryOptions(token),
    enabled: mounted && !!token,
  });
  const showSkeleton = isPending && !data;

  const countdownTarget = useMemo(() => {
    const status = data?.user?.status;
    const raw =
      status === "Active Duty"
        ? data?.stats?.dischargeDate
        : status === "Pre-Draft"
          ? data?.stats?.draftDate
          : null;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [data?.user?.status, data?.stats?.draftDate, data?.stats?.dischargeDate]);

  const profileStart = useMemo(() => {
    const raw = data?.user?.createdAt;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [data?.user?.createdAt]);

  const { days, hours, minutes, seconds, towardPct } = useCountdown(countdownTarget, profileStart);

  const yom = yomSummary(data?.stats?.yomHameah ?? undefined);
  const dapar = data?.stats?.daparScore;
  const medical = data?.stats?.medicalProfile;
  const aiReady = Boolean(data?.aiReady);
  const missingLabels =
    data?.aiProfileMissing?.map((k) => AI_PROFILE_MISSING_LABELS[k] ?? k).filter(Boolean) ?? [];

  const accuracy = computeMatchAccuracy(data);
  const isPreDraft = data?.user?.status === "Pre-Draft";
  const prepTimeline = isPreDraft && countdownTarget ? computePrepTimeline(days) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 topo-lines">
      {!mounted ? (
        <p className="text-center text-dust">…</p>
      ) : !token ? (
        <p className="text-center text-dust">מעבירים להתחברות…</p>
      ) : showSkeleton ? (
        <DashboardSkeleton />
      ) : isError ? (
        <div className="mx-auto max-w-md border border-iron/30 bg-card p-8 text-center">
          <p className="text-destructive">{error instanceof Error ? error.message : "שגיאה"}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
          >
            נסו שוב
          </button>
          <Link to="/post-signup" className="mt-3 block text-sm text-primary hover:underline">
            התחברות מחדש
          </Link>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8" dir="rtl">
          <motion.div variants={fadeUp} className="overflow-hidden rounded-sm border border-iron/30">
            <IdfPhotoPanel
              photo={getIdfPhoto("s1")}
              aspectClassName="aspect-[24/7] sm:aspect-[32/7]"
              overlayClassName="from-background/60 via-background/75 to-background"
            />
          </motion.div>

          {/* Header bar */}
          <motion.div variants={fadeUp} className="flex flex-col-reverse gap-3 border-b border-iron/30 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-right">
              <p className="eyebrow mb-2">הדשבורד שלך</p>
              <h1 className="text-2xl font-black sm:text-4xl">
                היי,{" "}
                <span className="text-primary">
                  {data.user.preferredName?.trim()
                    ? data.user.preferredName.trim()
                    : data.user.email
                      ? displayName(data.user.email)
                      : "שם טרם הוגדר"}
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2 self-end rounded-sm border border-olive/30 bg-olive/10 px-3 py-1.5 sm:self-auto">
              <span className="h-2 w-2 rounded-full bg-olive" />
              <span className="text-xs font-semibold text-olive-foreground">{statusHebrew(data.user.status)}</span>
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <OfficialScoresNudge dash={data} />
          </motion.div>

          {/* Main grid: countdown + metrics */}
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            {/* Countdown */}
            <motion.div variants={fadeUp} className="border border-iron/30 bg-card p-5 sm:p-8">
              <div className="flex items-center gap-2 text-xs text-dust mb-6">
                <Calendar className="h-3.5 w-3.5" />
                {data.user.status === "Active Duty" ? "עד השחרור" : data.user.status === "Discharged" ? "סטטוס" : "עד הגיוס"}
              </div>

              {data.user.status === "Discharged" ? (
                <div className="text-right">
                  <p className="text-xl font-bold text-foreground">תודה על השירות</p>
                  <p className="mt-2 text-sm text-dust">עדיין אפשר לעדכן פרופיל ולקבל תובנות.</p>
                </div>
              ) : countdownTarget ? (
                <div className="text-right">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-5xl font-black tabular-nums text-foreground leading-none sm:text-6xl">
                      {days}
                    </span>
                    <span className="text-lg font-medium text-dust">ימים</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 font-mono text-sm tabular-nums text-dust sm:gap-6">
                    <span>
                      <span className="font-bold text-foreground/80">{String(hours).padStart(2, "0")}</span> שעות
                    </span>
                    <span>
                      <span className="font-bold text-foreground/80">{String(minutes).padStart(2, "0")}</span> דקות
                    </span>
                    <span>
                      <span className="font-bold text-foreground/80">{String(seconds).padStart(2, "0")}</span> שניות
                    </span>
                  </div>
                  <div className="mt-8 space-y-2.5">
                    <div className="flex flex-row items-center justify-between gap-4 text-xs text-dust">
                      <span>התקדמות לקראת הגיוס</span>
                      <span className="font-mono tabular-nums text-primary">{towardPct}%</span>
                    </div>
                    <DashboardProgress value={towardPct} size="lg" />
                    <p className="font-mono text-[11px] text-dust/60">
                      מועד גיוס: {countdownTarget.toLocaleDateString("he-IL")}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-dust">
                  {data.user.status === "Active Duty"
                    ? "הוסיפו תאריך שחרור משוער בפרופיל"
                    : "הגדירו תאריך גיוס בהדרכה"}
                </p>
              )}
            </motion.div>

            {/* Metrics */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col border border-iron/30 bg-card divide-y divide-iron/20"
            >
              <MetricRow label="ממדי מאה (ממוצע)" value={yom.label} pct={yom.pct} />
              <MetricRow
                label="פרופיל רפואי"
                value={medical != null ? String(medical) : "—"}
                pct={medical != null ? Math.min(100, Math.round(((medical - 21) / (97 - 21)) * 100)) : 0}
              />
              <MetricRow
                label='דפ"ר'
                value={dapar != null ? String(dapar) : "—"}
                pct={dapar != null ? Math.min(100, Math.round(((dapar - 10) / 80) * 100)) : 0}
              />
              <MetricRow
                label="דיוק התאמה (שלמות הפרופיל)"
                value={`${accuracy.pct}%`}
                pct={accuracy.pct}
              />
            </motion.div>
          </div>

          {accuracy.level !== "high" && accuracy.notes.length > 0 ? (
            <motion.div variants={fadeUp} className="border border-iron/30 bg-card p-5 text-right" dir="rtl">
              <p className="eyebrow mb-2">איך משפרים את דיוק ההתאמה</p>
              <ul className="space-y-1 text-sm text-dust">
                {accuracy.notes.map((n) => (
                  <li key={n} className="flex flex-row items-start gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary/70" aria-hidden />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
              <Link to="/profile" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                עדכון הפרופיל →
              </Link>
            </motion.div>
          ) : null}

          {prepTimeline ? (
            <motion.section variants={fadeUp} className="border border-iron/30 bg-card" aria-labelledby="prep-timeline-heading" dir="rtl">
              <div className="border-b border-iron/20 px-5 py-3 text-right">
                <p className="eyebrow mb-1">ציר הכנה עד הגיוס</p>
                <h2 id="prep-timeline-heading" className="text-base font-bold text-foreground sm:text-lg">
                  מה כדאי לעשות בשלב הנוכחי
                </h2>
              </div>
              <div className="grid gap-px bg-iron/15 sm:grid-cols-2 lg:grid-cols-4">
                {prepTimeline.map((phase) => {
                  const PhaseIcon =
                    phase.status === "done" ? CheckCircle2 : phase.status === "active" ? CircleDot : Circle;
                  return (
                    <div
                      key={phase.id}
                      className={`bg-card p-4 text-right ${phase.status === "active" ? "bg-primary/[0.06]" : ""} ${
                        phase.status === "upcoming" ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex flex-row items-center justify-between gap-2">
                        <PhaseIcon
                          className={`h-4 w-4 shrink-0 ${
                            phase.status === "active"
                              ? "text-primary"
                              : phase.status === "done"
                                ? "text-olive"
                                : "text-dust/50"
                          }`}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-foreground">{phase.title}</p>
                          <p className="font-mono text-[10px] text-dust/70">{phase.window}</p>
                        </div>
                      </div>
                      {phase.status === "active" ? (
                        <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-dust">
                          {phase.tasks.map((t) => (
                            <li key={t} className="flex flex-row items-start gap-1.5">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/70" aria-hidden />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </motion.section>
          ) : null}

          <motion.div variants={fadeUp}>
            <DashboardAccountPreferences data={data} />
          </motion.div>

          <motion.div variants={fadeUp} className="flex justify-start" dir="rtl">
            <Link
              to="/profile"
              className="text-sm text-dust transition hover:text-primary hover:underline"
            >
              עריכת פרופיל מלא →
            </Link>
          </motion.div>

          {/* Hub — התאמת תפקידים */}
          <motion.section variants={fadeUp} className="space-y-4" aria-labelledby="dashboard-tools-heading">
            <div className="text-right">
              <p className="eyebrow mb-1">המשך מהדשבורד</p>
              <h2 id="dashboard-tools-heading" className="text-lg font-bold text-foreground sm:text-xl">
                {MATCH_TOOL_NAME}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-dust">{SECRETARY_COMING}. {MATCH_TOOL_DESC}</p>
            </div>

            {aiReady ? (
              <div className="space-y-4">
                <DashboardActionCard
                  to="/ai-counselor"
                  variant="primary"
                  badge="הפרופיל מלא"
                  title={MATCH_TOOL_NAME}
                  description={MATCH_TOOL_DESC}
                  icon={Target}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <DashboardActionCard
                    to="/report"
                    badge="דוח מקיף"
                    title="דוח מוכנות מלא"
                    description="דוח אישי מעמיק: כיוון מומלץ, 10 תפקידים, חוזקות, טיפים למיונים וסיכום להורים. כולל PDF."
                    icon={FileText}
                  />
                  <DashboardActionCard
                    to="/role-insights"
                    badge="מאגר ידע"
                    title="תובנות תפקידים"
                    description="מדריכי תפקידים, יומיום, מסלולי הכשרה וביקורות של חיילים ששירתו בתפקיד."
                    icon={Compass}
                  />
                </div>
              </div>
            ) : (
              <div className="border border-iron/30 bg-card p-5 text-right sm:p-8" dir="rtl">
                <p className="eyebrow mb-2">{MATCH_TOOL_NAME}</p>
                <h3 className="flex flex-row items-center justify-end gap-2 text-base font-bold text-foreground sm:text-lg">
                  <Target className="h-5 w-5 shrink-0 text-dust" />
                  <span>עוד כמה שדות ואפשר להריץ התאמה</span>
                </h3>
                {missingLabels.length > 0 ? (
                  <ul className="mt-3 list-disc pr-5 text-sm text-dust">
                    {missingLabels.map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-dust">מלאו את ההעדפות למעלה ושמרו.</p>
                )}
              </div>
            )}

            {!aiReady ? (
              <DashboardActionCard
                to="/role-insights"
                badge="זמין גם בלי פרופיל מלא"
                title="תובנות תפקידים"
                description="מדריכי תפקידים, יומיום, מסלולי הכשרה וביקורות של חיילים ששירתו בתפקיד."
                icon={Compass}
              />
            ) : null}
          </motion.section>
        </motion.div>
      )}
    </div>
  );
}

function DashboardProgress({
  value,
  label = "התקדמות",
  size = "md",
}: {
  value: number;
  label?: string;
  size?: "md" | "lg";
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={`w-full overflow-hidden rounded-sm bg-iron/25 ${size === "lg" ? "h-3.5" : "h-3"}`}
      {...progressBarProps(clamped, label)}
    >
      <motion.div
        className="h-full rounded-sm bg-primary shadow-[0_0_14px_color-mix(in_oklch,var(--primary)_45%,transparent)]"
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

function MetricRow({
  label,
  value,
  pct,
}: {
  label: string;
  value: string;
  pct: number;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-4 p-4 text-right sm:p-7">
      <div className="flex flex-row items-end justify-between gap-4">
        <div className="min-w-0 text-right">
          <p className="text-xs text-dust">{label}</p>
          <p className="font-mono text-3xl font-black tabular-nums leading-none text-foreground">{value}</p>
        </div>
        <span className="shrink-0 font-mono text-sm tabular-nums text-primary">{pct}%</span>
      </div>
      <DashboardProgress value={pct} label={label} />
    </div>
  );
}
