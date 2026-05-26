import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Loader2, ArrowLeft, Award } from "lucide-react";
import { toast } from "sonner";
import { RoleMatchCards } from "@/components/RoleMatchCards";
import { IdfPhotoPanel } from "@/components/IdfPhotoPanel";
import { getIdfPhoto } from "@/lib/idf-images";
import { getDashboardStats, matchRolesRequest, type RoleMatch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { AI_PROFILE_MISSING_LABELS } from "@/lib/profile-preference-data";
import { migrateLegacyYomHameahTo12, YOM_HAMEAH_12_KEYS } from "@/lib/yom-hameah-12";

export const Route = createFileRoute("/ai-counselor")({
  component: AiCounselorPage,
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
    queryKey: ["dashboard", token],
    queryFn: () => getDashboardStats(),
    enabled: mounted && !!token,
  });

  const aiReady = Boolean(dash?.aiReady);
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
      const msg = e instanceof Error ? e.message : "שגיאה";
      setMessages((prev) => [...prev, { role: "ai", text: `שגיאה מהשרת: ${msg}` }]);
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
            photo={getIdfPhoto("soldiers-climbing")}
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

        {!aiReady && token && (
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
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={loading || !aiReady || !token}
            onClick={runMatch}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-40 active:scale-[0.97]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
            {loading ? "מנתחים…" : "התאמת תפקידים"}
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-md border border-iron/40 px-5 py-2.5 text-sm text-dust transition hover:border-primary/40 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            דשבורד
          </Link>
        </div>

        <div className="border border-iron/30 bg-card overflow-hidden">
          <div className="border-b border-iron/20 px-5 py-2.5 text-right">
            <span className="font-mono text-[10px] tracking-widest text-dust uppercase">שיחה</span>
          </div>
          <div className="max-h-[min(280px,40vh)] space-y-4 overflow-y-auto p-5">
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
                    {m.role === "ai" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="border border-iron/20 bg-secondary px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <AnimatePresence>
          {roles && roles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease }}
            >
              <RoleMatchCards roles={roles} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
