import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Download,
  Target,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Users,
  Award,
  Heart,
  MapPin,
} from "lucide-react";
import type { FullReportResponse } from "@/lib/api";
import { SITE_NAME_HE } from "@/lib/brand";

const ease = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
};

type Props = {
  data: FullReportResponse;
  onPrint: () => void;
  onServerDownload: () => void;
  pdfLoading: boolean;
  savedBadge?: boolean;
};

export function ReportResultView({ data, onPrint, onServerDownload, pdfLoading, savedBadge }: Props) {
  const { report } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 topo-lines">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
        {savedBadge && (
          <motion.p variants={fadeUp} className="text-center text-xs text-olive">
            הדוח נשמר בהיסטוריה שלכם
          </motion.p>
        )}
        <motion.div
          variants={fadeUp}
          className="flex flex-col-reverse gap-4 border-b border-iron/30 pb-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="text-right">
            <p className="mb-2 font-mono text-xs tracking-widest text-primary uppercase">דוח כיוון אישי</p>
            <h1 className="text-2xl font-black sm:text-3xl">
              הכיוון שלך: <span className="text-primary">{report.direction}</span>
            </h1>
            <p className="mt-2 text-sm text-dust">{report.directionExplanation}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110"
            >
              <Download className="h-4 w-4" aria-hidden />
              שמירה כ-PDF (מומלץ)
            </button>
            <button
              type="button"
              disabled={pdfLoading}
              onClick={onServerDownload}
              className="text-xs text-dust transition hover:text-foreground disabled:opacity-50"
            >
              {pdfLoading ? (
                <span className="inline-block h-3 w-28 animate-pulse rounded-sm bg-dust/40" aria-hidden />
              ) : (
                "הורדה ישירה מהשרת"
              )}
            </button>
          </div>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2">
          <motion.div variants={fadeUp} className="border border-iron/30 bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
              <span className="font-mono text-xs tracking-widest text-dust uppercase">חוזקות</span>
            </div>
            <ul className="space-y-1.5 text-sm text-foreground">
              {report.strengths?.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={fadeUp} className="border border-iron/30 bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-dust" aria-hidden />
              <span className="font-mono text-xs tracking-widest text-dust uppercase">לשיפור</span>
            </div>
            <ul className="space-y-1.5 text-sm text-foreground">
              {report.weaknesses?.map((w, i) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
          </motion.div>
        </div>

        {report.improvementTips?.length ? (
          <motion.div variants={fadeUp} className="border border-iron/30 bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="font-mono text-xs tracking-widest text-dust uppercase">טיפים מעשיים</span>
            </div>
            <ul className="grid gap-2 text-sm text-foreground sm:grid-cols-2">
              {report.improvementTips.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}

        {report.interviewTips?.length ? (
          <motion.div variants={fadeUp} className="border border-iron/30 bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="font-mono text-xs tracking-widest text-dust uppercase">טיפים לראיונות ומיון</span>
            </div>
            <ul className="space-y-1.5 text-sm text-foreground">
              {report.interviewTips.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </motion.div>
        ) : null}

        {report.rolesTheyAskedAbout && (
          <motion.div variants={fadeUp} className="border border-primary/20 bg-primary/[0.03] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-mono text-xs tracking-widest text-dust uppercase">לגבי התפקידים שציינתם</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{report.rolesTheyAskedAbout}</p>
          </motion.div>
        )}

        {report.fearResponse && (
          <motion.div variants={fadeUp} className="border border-iron/30 bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              <span className="font-mono text-xs tracking-widest text-dust uppercase">לגבי החששות שלכם</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{report.fearResponse}</p>
          </motion.div>
        )}

        <motion.div variants={fadeUp}>
          <p className="mb-4 font-mono text-xs tracking-widest text-primary uppercase">10 תפקידים מומלצים</p>
          <div className="space-y-4">
            {report.roles?.map((r, i) => (
              <div key={i} className="border border-iron/30 bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-right">
                    <h3 className="text-base font-bold text-foreground">
                      <span className="ml-2 inline-block font-mono text-xs text-primary">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {r.roleTitle}
                    </h3>
                    <p className="mt-1 text-sm text-dust">{r.summary}</p>
                  </div>
                  <span className="shrink-0 rounded-sm bg-primary/15 px-2.5 py-1 font-mono text-sm font-bold text-primary">
                    {r.matchPercentage}%
                  </span>
                </div>
                {r.description && (
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80">{r.description}</p>
                )}
                {(r.serviceLength || r.location) && (
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-dust">
                    {r.serviceLength && <span>יציאות: {r.serviceLength}</span>}
                    {r.location && (
                      <span>
                        <MapPin className="mb-0.5 ml-0.5 inline h-3 w-3" />
                        {r.location}
                      </span>
                    )}
                  </div>
                )}
                {r.fitReason && (
                  <p className="mt-2 text-xs text-primary">
                    <Target className="mb-0.5 ml-1 inline h-3 w-3" />
                    {r.fitReason}
                  </p>
                )}
                {r.riskNote && (
                  <p className="mt-1 text-xs text-destructive">
                    <AlertTriangle className="mb-0.5 ml-1 inline h-3 w-3" />
                    {r.riskNote}
                  </p>
                )}
                {r.tags?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.tags.map((tag, ti) => (
                      <span key={ti} className="rounded-sm bg-iron/20 px-2 py-0.5 text-[10px] text-dust">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </motion.div>

        {report.parentSummary && (
          <motion.div variants={fadeUp} className="border border-primary/30 bg-primary/5 p-6">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" aria-hidden />
              <span className="font-mono text-xs tracking-widest text-dust uppercase">סיכום להורים</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{report.parentSummary}</p>
          </motion.div>
        )}

        <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-between gap-4 border-t border-iron/30 pt-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
            >
              <Download className="h-4 w-4" aria-hidden />
              שמירה כ-PDF
            </button>
            <button
              type="button"
              disabled={pdfLoading}
              onClick={onServerDownload}
              className="inline-flex items-center gap-2 rounded-md border border-iron/40 px-4 py-2.5 text-sm text-dust transition hover:text-foreground disabled:opacity-50"
            >
              {pdfLoading ? (
                <span className="inline-block h-3 w-24 animate-pulse rounded-sm bg-dust/40" aria-hidden />
              ) : (
                "הורדה מהשרת"
              )}
            </button>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link to="/report" className="text-dust transition hover:text-foreground">
              דוח חדש
            </Link>
            <Link to="/dashboard" className="text-dust transition hover:text-foreground">
              דשבורד
            </Link>
          </div>
        </motion.div>

        <p className="text-center text-xs text-dust/50">
          דוח זה נוצר על ידי {SITE_NAME_HE}. אינו מהווה המלצה רשמית של צה״ל.
        </p>
      </motion.div>
    </div>
  );
}
