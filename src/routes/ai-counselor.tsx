import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, ArrowLeft, Award } from "lucide-react";
import {
  ChatMessageSkeleton,
  RoleMatchCardsSkeleton,
} from "@/components/skeletons/PageSkeletons";
import { toast } from "sonner";
import { RoleMatchCards } from "@/components/RoleMatchCards";
import { IdfPhotoPanel } from "@/components/IdfPhotoPanel";
import { getIdfPhoto } from "@/lib/idf-images";
import { matchRolesRequest, type RoleMatch } from "@/lib/api";
import { getErrorMessage } from "@/lib/api-errors";
import { dashboardQueryOptions } from "@/lib/queries";
import { getToken } from "@/lib/auth";
import { AI_PROFILE_MISSING_LABELS } from "@/lib/profile-preference-data";
import { migrateLegacyYomHameahTo12, YOM_HAMEAH_12_KEYS } from "@/lib/yom-hameah-12";
import { ARIA } from "@/lib/a11y";

export const Route = createFileRoute("/ai-counselor")({
  component: AiCounselorPage,
  head: () => ({
    meta: [
      { title: "יועץ AI | קח כיוון" },
      { name: "description", content: "יועץ AI שמנתח את הפרופיל האישי שלכם וממליץ על תפקידים מתאימים בצה״ל." },
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
      text: "שלום. לחצו «התאמת תפקידים» — ננתח את הפרופיל שלכם ונציג 5 המלצות עם ציון התאמה, תמונה ותקציר קצר לכל תפקיד.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<RoleMatch[] | null>(null);
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
      toast.error("השלימו את הפרופיל לפני שימוש ביועץ");
      return;
    }
    if (tokenCapped) {
      toast.error("הגעתם למכסת הטוקנים לשימוש ביועץ AI");
      return;
    }
    setLoading(true);
    setRoles(null);
    setMessages((prev) => [...prev, { role: "user", text: "בקשת התאמת תפקידים" }]);
    try {
      const { roles: list } = await matchRolesRequest();
      setRoles(list);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `מצאנו ${list.length} תפקידים מותאמים. גללו למטה לכרטיסים — לחצו «למה התפקיד מתאים?» לפירוט קצר.`,
        },
      ]);
      toast.success("ההמלצות מוכנות");
    } catch (e) {
      const msg = getErrorMessage(e, "שגיאה בהתאמת תפקידים");
      setMessages((prev) => [...prev, { role: "ai", text: msg }]);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

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
          <p className="font-mono text-xs tracking-widest text-primary uppercase mb-2">יועץ התאמה</p>
          <h1 className="text-xl font-bold text-foreground sm:text-3xl">התאמת תפקידים בצה&quot;ל</h1>
          <p className="mt-2 max-w-lg text-xs text-dust leading-relaxed sm:text-sm">
            ניתוח אישי מול מאגר תפקידים — תוצאות ויזואליות, תקציר לכל תפקיד, פירוט רק כשצריך.
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

        {dash && aiReady && (
          <div
            dir="rtl"
            className="flex flex-wrap justify-start gap-3 rounded-sm border border-iron/25 bg-card/50 px-3 py-3 font-mono text-xs text-dust sm:px-4"
          >
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
          </div>
        )}

        <div dir="rtl" className="flex flex-wrap items-center justify-start gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-md border border-iron/40 px-5 py-2.5 text-sm text-dust transition hover:border-primary/40 hover:text-foreground"
          >
            דשבורד
            <ArrowLeft className="h-3.5 w-3.5 rotate-180" aria-hidden />
          </Link>
          <button
            type="button"
            disabled={loading || !aiReady || !token || tokenCapped}
            onClick={runMatch}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-40 active:scale-[0.97]"
          >
            <Award className="h-4 w-4" aria-hidden />
            התאמת תפקידים
          </button>
        </div>

        <section className="border border-iron/30 bg-card overflow-hidden" aria-labelledby="ai-chat-heading">
          <div className="border-b border-iron/20 px-5 py-2.5 text-right">
            <h2 id="ai-chat-heading" className="font-mono text-[10px] tracking-widest text-dust uppercase">
              שיחה
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
                      <Bot className="h-3.5 w-3.5" aria-hidden />
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
            >
              <RoleMatchCards roles={roles} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
