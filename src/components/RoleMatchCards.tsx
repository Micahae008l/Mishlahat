import { useId, useMemo, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { trackShare } from "@/lib/analytics";
import {
  BookOpen,
  Bot,
  Briefcase,
  ChevronDown,
  Cpu,
  Heart,
  MapPin,
  Share2,
  Shield,
  Sparkles,
  Users,
  Waves,
} from "lucide-react";
import { findInsightForRole } from "@/lib/role-insights-data";
import { SITE_NAME_HE } from "@/lib/brand";
import { IdfPhotoCredit } from "@/components/IdfPhotoCredit";
import type { RoleMatch } from "@/lib/api";
import { pickRolePhoto, type IdfPhoto } from "@/lib/idf-photo-catalog";
import { ARIA } from "@/lib/a11y";

const ease = [0.16, 1, 0.3, 1] as const;

function tagIcon(tag: string) {
  const t = tag.toLowerCase();
  if (/קרב|שטח|לוחם/.test(t)) return Shield;
  if (/טכנ|מחשב|סייבר|מערכות/.test(t)) return Cpu;
  if (/משרד|משא|מנהל/.test(t)) return Briefcase;
  if (/ים|חיל הים/.test(t)) return Waves;
  if (/אנוש|טיפול|רפוא|פסיכ/.test(t)) return Heart;
  if (/צוות|ליווי|הדרכה/.test(t)) return Users;
  if (/שטח|מיקום|נהיגה/.test(t)) return MapPin;
  return Sparkles;
}

function MatchRing({ pct, size = "lg" }: { pct: number; size?: "lg" | "md" }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const dim = size === "lg" ? 88 : 64;
  const stroke = size === "lg" ? 6 : 5;
  const r = (dim - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div className="relative shrink-0" style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} className="-rotate-90" aria-hidden>
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-iron/30"
        />
        <motion.circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="text-primary"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center font-mono tabular-nums text-foreground"
        role="img"
        aria-label={ARIA.matchPct(clamped)}
      >
        <span className={size === "lg" ? "text-2xl font-black" : "text-lg font-black"}>{clamped}</span>
        <span className="text-[9px] text-dust">%</span>
      </div>
    </div>
  );
}

function RoleCard({
  role,
  rank,
  photo,
  featured = false,
}: {
  role: RoleMatch;
  rank: number;
  photo: IdfPhoto;
  featured?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const detailId = useId();
  const headline = role.summary?.trim() || role.description.split(/(?<=[.!?])\s+/)[0] || role.roleTitle;
  const insight = useMemo(() => findInsightForRole(role.roleTitle, role.tags), [role.roleTitle, role.tags]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: rank * 0.05, ease }}
      className={`overflow-hidden border text-right ${
        featured ? "border-primary/45 bg-card" : "border-iron/30 bg-card"
      }`}
    >
      <div className={`grid ${featured ? "md:grid-cols-[1fr_220px]" : "grid-cols-1"}`}>
        <div className={`relative min-h-[140px] overflow-hidden ${featured ? "md:order-2" : ""}`}>
          <img
            src={photo.src}
            alt={photo.alt}
            className="h-full w-full object-cover opacity-75"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-card via-card/75 to-transparent" />
          <span
            className="absolute top-3 left-3 rounded-sm border border-primary/30 bg-background/80 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-primary"
            aria-hidden
          >
            #{rank}
          </span>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-transparent px-3 pb-2 pt-8 text-left">
            <IdfPhotoCredit photo={photo} />
          </div>
        </div>

        <div className={`flex flex-col gap-4 p-6 ${featured ? "md:p-8" : ""}`}>
          <div className="flex items-start justify-between gap-4">
            <MatchRing pct={role.matchPercentage} size={featured ? "lg" : "md"} />
            <div className="min-w-0 flex-1">
              <h3 className={`font-bold text-foreground ${featured ? "text-xl" : "text-base"}`}>
                {role.roleTitle}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{headline}</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {role.tags.map((t) => {
              const Icon = tagIcon(t);
              return (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-iron/25 bg-secondary/60 px-2.5 py-1 text-[11px] text-dust"
                >
                  <Icon className="h-3 w-3 shrink-0 text-primary/80" aria-hidden />
                  {t}
                </span>
              );
            })}
          </div>

          {role.matchFactors && role.matchFactors.length > 0 ? (
            <div className="rounded-sm border border-primary/15 bg-primary/[0.04] p-3 text-right" dir="rtl">
              <p className="font-mono text-[10px] tracking-widest text-primary/80 uppercase">
                לפי הנתונים שלך
              </p>
              <ul className="mt-1.5 space-y-1.5 text-[11px] leading-relaxed text-dust">
                {role.matchFactors.map((f) => (
                  <li key={f} className="flex flex-row items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/70" aria-hidden />
                    <span className="min-w-0 flex-1">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {insight ? (
            <div className="flex justify-end">
              <Link
                to="/role-insights"
                search={{ role: insight.slug }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                מדריך מלא: {insight.title}
              </Link>
            </div>
          ) : null}

          {role.description && role.description !== headline ? (
            <div>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                aria-expanded={expanded}
                aria-controls={detailId}
              >
                {expanded ? "פחות פירוט" : "למה התפקיד מתאים?"}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition ${expanded ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {expanded ? (
                <motion.p
                  id={detailId}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 text-xs leading-relaxed text-dust"
                >
                  {role.description}
                </motion.p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

function buildWhatsAppShareUrl(roles: RoleMatch[]) {
  const top = roles[0];
  if (!top) return null;
  const lines = [
    `${SITE_NAME_HE} — התאמת תפקידים`,
    `התפקיד הכי מתאים לי: ${top.roleTitle} (${top.matchPercentage}%)`,
  ];
  if (roles.length > 1) {
    lines.push(`עוד תוצאות: ${roles.slice(1, 3).map((r) => r.roleTitle).join(", ")}`);
  }
  lines.push("", "נסו גם: https://kachkivun.com");
  return `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function RoleMatchCards({ roles }: { roles: RoleMatch[] }) {
  const photos = useMemo(() => {
    const used = new Set<string>();
    return roles.map((r, i) => pickRolePhoto(r.tags, r.roleTitle, i + 1, used));
  }, [roles]);

  if (!roles.length) return null;

  const [top, ...rest] = roles;
  const [topPhoto, ...restPhotos] = photos;
  const whatsappUrl = buildWhatsAppShareUrl(roles);

  return (
    <section className="space-y-5" aria-labelledby="role-match-results-heading">
      <div className="flex items-center justify-end gap-2 text-right">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-widest text-primary uppercase">תוצאות</p>
          <h2 id="role-match-results-heading" className="text-xl font-bold text-foreground">
            {roles.length} תפקידים מותאמים לפרופיל שלכם
          </h2>
          <p className="mt-1 text-[11px] text-dust/70">לכל תפקיד תמונה שונה · קרדיט לצלם/מקור בתחתית התמונה</p>
        </div>
        <div className="flex items-center gap-2">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackShare("whatsapp")}
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-iron/30 text-dust transition hover:border-primary/40 hover:text-primary"
              aria-label="שתפו בוואטסאפ"
            >
              <Share2 className="h-4 w-4" />
            </a>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 text-primary" aria-hidden>
            <Bot className="h-5 w-5" />
          </div>
        </div>
      </div>

      <RoleCard role={top} rank={1} photo={topPhoto} featured />

      {rest.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {rest.map((r, i) => (
            <RoleCard key={`${r.roleTitle}-${i}`} role={r} rank={i + 2} photo={restPhotos[i]} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
