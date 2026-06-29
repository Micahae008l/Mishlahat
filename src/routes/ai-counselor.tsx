import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { User, ArrowLeft, Award, Compass, ShieldQuestion } from "lucide-react";
import { MATCH_TOOL_NAME } from "@/lib/voice";
import {
  ChatMessageSkeleton,
  RoleMatchCardsSkeleton,
} from "@/components/skeletons/PageSkeletons";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { trackAiMatch } from "@/lib/analytics";

const RoleMatchCards = lazy(() => import("@/components/RoleMatchCards").then((m) => ({ default: m.RoleMatchCards })));
const MatchHistoryPanel = lazy(() =>
  import("@/components/MatchHistoryPanel").then((m) => ({ default: m.MatchHistoryPanel })),
);
import { IdfPhotoPanel } from "@/components/IdfPhotoPanel";
import { getIdfPhoto } from "@/lib/idf-images";
import {
  getMatchHistory,
  listMatchHistory,
  matchRolesRequest,
  type DashboardResponse,
  type MatchConfidence,
  type MatchHistoryDetail,
  type RoleMatch,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/api-errors";
import { computeMatchAccuracy } from "@/lib/match-accuracy";
import { diffMatchRuns, type MatchRunDiff, type ProfileSnapshot } from "@/lib/match-diff";
import { MatchDiffCard } from "@/components/MatchDiffCard";
import { OfficialScoresNudge } from "@/components/OfficialScoresNudge";
import { dashboardQueryOptions } from "@/lib/queries";
import { queryKeys } from "@/lib/query-keys";
import { getToken } from "@/lib/auth";
import { AI_PROFILE_MISSING_LABELS } from "@/lib/profile-preference-data";
import { migrateLegacyYomHameahTo12, YOM_HAMEAH_12_KEYS } from "@/lib/yom-hameah-12";
import { ARIA } from "@/lib/a11y";

export const Route = createFileRoute("/ai-counselor")({
  component: AiCounselorPage,
  head: () => ({
    meta: [
      { title: `${MATCH_TOOL_NAME} | קח כיוון` },
      { name: "description", content: "התאמת תפקידים לפי הפרופיל שלכם — דפ״ר, רפואי, מא״ה והעדפות." },
    ],
  }),
});

const ease = [0.16, 1, 0.3, 1] as const;

interface Message {
  role: "user" | "ai";
  text: string;
}

function AiCounselorPage() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "שלום. לחצו «התאמת תפקידים» — ננתח את הפרופיל שלכם ונציג 7 המלצות עם ציון התאמה, תמונה ותקציר קצר לכל תפקיד.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<RoleMatch[] | null>(null);
  const [confidence, setConfidence] = useState<MatchConfidence | null>(null);
  const [confidenceNotes, setConfidenceNotes] = useState<string[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [runDiff, setRunDiff] = useState<{ diff: MatchRunDiff; previousDate: string } | null>(null);
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const token = mounted ? getToken() : null;

  const { data: dash } = useQuery({
    ...dashboardQueryOptions(token),
    enabled: mounted && !!token,
  });

  const aiReady = Boolean(dash?.aiReady);
  const tokenCapped = Boolean(dash?.aiTokens?.capped);
  const missingLabels =
    dash?.aiProfileMissing?.map((k) => AI_PROFILE_MISSING_LABELS[k] ?? k).filter(Boolean) ?? [];

  const yomAvgLabel = (() => {
    const y = dash?.stats?.yomHameah ? migrateLegacyYomHameahTo12(dash.stats.yomHameah) : null;
    if (!y) return "—";
    const avg = YOM_HAMEAH_12_KEYS.reduce((a, k) => a + y[k], 0) / 12;
    return `${avg.toFixed(1)}/5`;
  })();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, roles, loading]);

  async function runMatch() {
    if (!getToken()) {
      toast.error("יש להתחבר");
      navigate({ to: "/post-signup" });
      return;
    }
    if (!aiReady) {
      toast.error("השלימו את הפרופיל לפני ההתאמה");
      return;
    }
    if (tokenCapped) {
      toast.error("הגעתם למכסת השימוש — נסו שוב מאוחר יותר או פנו למנהל");
      return;
    }
    setLoading(true);
    setRoles(null);
    setConfidence(null);
    setConfidenceNotes([]);
    setActiveHistoryId(null);
    setRunDiff(null);
    setMessages((prev) => [...prev, { role: "user", text: "בקשת התאמת תפקידים" }]);
    try {
      const res = await matchRolesRequest();
      setRoles(res.roles);
      setConfidence(res.confidence ?? null);
      setConfidenceNotes(res.confidenceNotes ?? []);
      setActiveHistoryId(res.historyId ?? null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.matchHistory(token) });
      void computeRunDiff(res.historyId ?? null, res.roles, dash);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `מצאנו ${res.roles.length} תפקידים מותאמים. גללו למטה לכרטיסים — לחצו «למה התפקיד מתאים?» לפירוט קצר. ההתאמה נשמרה בהיסטוריה ותוכלו לחזור אליה.`,
        },
      ]);
      trackAiMatch();
      toast.success("ההמלצות מוכנות");
    } catch (e) {
      const msg = getErrorMessage(e, "שגיאה בהתאמת תפקידים");
      setMessages((prev) => [...prev, { role: "ai", text: msg }]);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Compares the run just completed with the most recent previous run and
   * surfaces a deterministic "what changed" summary. Best-effort: any failure
   * silently skips the diff.
   */
  async function computeRunDiff(
    currentId: string | null,
    currentRoles: RoleMatch[],
    dashData: DashboardResponse | undefined,
  ) {
    try {
      const { matches } = await listMatchHistory();
      const previous = matches.find((m) => m.id !== currentId);
      if (!previous) return;
      const prevDetail = await getMatchHistory(previous.id);
      const currentSnapshot: ProfileSnapshot | null = dashData
        ? {
            daparScore: dashData.stats?.daparScore ?? null,
            medicalProfile: dashData.stats?.medicalProfile ?? null,
            combatPreference: dashData.preferences?.combatPreference ?? null,
            focus: dashData.preferences?.focus ?? null,
            physicalActivityLevel: dashData.preferences?.physicalActivityLevel ?? null,
            yomHameahSource: dashData.preferences?.yomHameahSource ?? null,
          }
        : null;
      const diff = diffMatchRuns(
        { roles: currentRoles, snapshot: currentSnapshot },
        { roles: prevDetail.roles, snapshot: (prevDetail.profileSnapshot as ProfileSnapshot | null) ?? null },
      );
      setRunDiff({ diff, previousDate: prevDetail.generatedAt });
    } catch {
      // Diff is a bonus — never block or surface errors for it.
    }
  }

  function loadFromHistory(detail: MatchHistoryDetail) {
    setRoles(detail.roles);
    setConfidence(detail.confidence);
    setConfidenceNotes(detail.confidenceNotes ?? []);
    setActiveHistoryId(detail.id);
    setRunDiff(null);
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: `נטענה התאמה שנשמרה ב-${new Date(detail.generatedAt).toLocaleDateString("he-IL")}. אם הפרופיל השתנה מאז — הריצו התאמה חדשה לתוצאות מעודכנות.`,
      },
    ]);
  }

  const accuracy = computeMatchAccuracy(dash);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 topo-lines">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="space-y-8"
      >
        <div className="overflow-hidden rounded-sm border border-iron/30">
          <IdfPhotoPanel
            photo={getIdfPhoto("s3")}
            aspectClassName="aspect-[21/7]"
            overlayClassName="from-background/55 via-background/75 to-background"
          />
        </div>

        <div className="border-b border-iron/30 pb-6 text-right">
          <p className="eyebrow eyebrow-accent mb-2">{MATCH_TOOL_NAME}</p>
          <h1 className="text-xl font-bold text-foreground sm:text-3xl">
            איזה תפקידים מתאימים לפרופיל שלכם
          </h1>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-dust sm:text-sm">
            מריצים התאמה אחת — מקבלים 7 הצעות עם ציון, תמונה ותקציר. בלי צ&apos;אט ארוך.
          </p>
        </div>

        {tokenCapped && token && (
          <div className="border border-destructive/30 bg-destructive/5 p-5 text-right">
            <p className="font-semibold text-foreground text-sm">מכסת הטוקנים נוצלה</p>
            <p className="mt-1 text-sm text-dust">
              נוצלו {dash?.aiTokens?.used?.toLocaleString("he-IL") ?? "—"} מתוך{" "}
              {dash?.aiTokens?.cap?.toLocaleString("he-IL") ?? "—"} טוקנים. פנו למנהל המערכת להגדלת המכסה.
            </p>
          </div>
        )}

        {!aiReady && token && !tokenCapped && (
          <div className="border border-iron/30 bg-card p-5 text-right">
            <p className="font-semibold text-foreground text-sm">נדרש פרופיל מלא לפני התאמת תפקידים</p>
            {missingLabels.length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-sm text-dust">
                {missingLabels.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            ) : null}
            <Link to="/onboarding" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              השלימו בפרופיל
            </Link>
          </div>
        )}

        {dash && aiReady ? <OfficialScoresNudge dash={dash} /> : null}

        {dash && aiReady && (
          <div className="space-y-2">
            <div className="flex flex-wrap justify-center gap-3 rounded-sm border border-iron/25 bg-card/50 px-3 py-3 font-mono text-xs text-dust sm:justify-end sm:px-4">
              <span>
                דפ״ר: <strong className="text-foreground">{dash.stats?.daparScore ?? "—"}</strong>
              </span>
              <span className="text-iron/40">|</span>
              <span>
                רפואי: <strong className="text-foreground">{dash.stats?.medicalProfile ?? "—"}</strong>
              </span>
              <span className="text-iron/40">|</span>
              <span>
                מא״ה: <strong className="text-foreground">{yomAvgLabel}</strong>
              </span>
              <span className="text-iron/40">|</span>
              <span>
                דיוק התאמה:{" "}
                <strong className={accuracy.level === "high" ? "text-olive" : accuracy.level === "medium" ? "text-primary" : "text-destructive"}>
                  {accuracy.pct}%
                </strong>
              </span>
            </div>
            {accuracy.level !== "high" && accuracy.notes.length > 0 ? (
              <p className="text-right text-[11px] leading-relaxed text-dust/80">
                {accuracy.notes[0]}{" "}
                <Link to="/profile" className="text-primary hover:underline">
                  עדכון בפרופיל
                </Link>
              </p>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={loading || !aiReady || !token || tokenCapped}
            onClick={runMatch}
            className="btn-primary disabled:opacity-40 disabled:pointer-events-none"
          >
            <Award className="h-4 w-4" aria-hidden />
            התאמת תפקידים
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-md border border-iron/40 px-5 py-2.5 text-sm text-dust transition hover:border-primary/40 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            דשבורד
          </Link>
        </div>

        <section className="border border-iron/30 bg-card overflow-hidden" aria-labelledby="ai-chat-heading">
          <div className="border-b border-iron/20 px-5 py-2.5 text-right">
            <h2 id="ai-chat-heading" className="eyebrow">
              מה קורה כאן
            </h2>
          </div>
          <div
            className="max-h-[min(280px,40vh)] space-y-4 overflow-y-auto p-5"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-busy={loading}
            aria-label={ARIA.chatLog}
          >
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease }}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-xs ${
                      m.role === "ai" ? "bg-primary/10 text-primary" : "bg-iron/30 text-foreground"
                    }`}
                  >
                    {m.role === "ai" ? (
                      <Compass className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <User className="h-3.5 w-3.5" aria-hidden />
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "ai"
                        ? "border border-iron/20 bg-secondary text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="status" aria-label={ARIA.chatLoading}>
                <ChatMessageSkeleton />
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        </section>

        <AnimatePresence>
          {loading && !roles ? (
            <motion.div
              key="roles-skeleton"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease }}
            >
              <RoleMatchCardsSkeleton />
            </motion.div>
          ) : null}
          {roles && roles.length > 0 ? (
            <motion.div
              key="roles-results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease }}
              className="space-y-5"
            >
              {confidence ? (
                <div
                  className={`flex flex-row-reverse items-start gap-3 border p-4 text-right ${
                    confidence === "high"
                      ? "border-olive/30 bg-olive/5"
                      : confidence === "medium"
                        ? "border-primary/25 bg-primary/5"
                        : "border-destructive/30 bg-destructive/5"
                  }`}
                >
                  <ShieldQuestion
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      confidence === "high" ? "text-olive" : confidence === "medium" ? "text-primary" : "text-destructive"
                    }`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      רמת ביטחון בהמלצות:{" "}
                      {confidence === "high" ? "גבוהה" : confidence === "medium" ? "בינונית" : "נמוכה"}
                    </p>
                    {confidenceNotes.length > 0 ? (
                      <ul className="mt-1 space-y-0.5 text-xs leading-relaxed text-dust">
                        {confidenceNotes.map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {runDiff ? <MatchDiffCard diff={runDiff.diff} previousDate={runDiff.previousDate} /> : null}

              <Suspense fallback={<RoleMatchCardsSkeleton />}>
                <RoleMatchCards roles={roles} />
              </Suspense>

              <p className="text-right text-[11px] leading-relaxed text-dust/60">
                ההמלצות הן כלי הכוונה והכנה בלבד, על בסיס הנתונים שהזנתם — הן אינן קביעה רשמית של
                צה״ל ואינן מבטיחות שיבוץ. הזכאות בפועל נקבעת במיונים הרשמיים.
              </p>
            </motion.div>
          ) : null}
          {roles && roles.length === 0 && !loading ? (
            <motion.div
              key="roles-empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease }}
            >
              <EmptyState
                title="לא נמצאו תפקידים מתאימים"
                description="נסו לעדכן את הפרופיל ולהריץ שוב — אולי משהו השתנה."
                actionLabel="עריכת פרופיל"
                actionTo="/profile"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {token ? (
          <Suspense fallback={null}>
            <MatchHistoryPanel onLoad={loadFromHistory} activeId={activeHistoryId} />
          </Suspense>
        ) : null}
      </motion.div>
    </div>
  );
}
