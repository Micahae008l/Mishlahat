import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronUp, Columns3, Search, X } from "lucide-react";
import { IdfPhotoPanel } from "@/components/IdfPhotoPanel";
import { getIdfPhoto, idfPhotoAt } from "@/lib/idf-images";
import {
  getRoleBySlug,
  ROLE_CATEGORIES,
  ROLE_INSIGHTS,
  type RoleCategory,
  type RoleInsight,
} from "@/lib/role-insights-data";
import { RoleReviewPanel, RoleReviewStats as ReviewStatsBar } from "@/components/RoleReviewSection";
import { getAllReviewStats, type RoleReviewStats } from "@/lib/api";

type RoleInsightsSearch = {
  role?: string;
};

export const Route = createFileRoute("/role-insights")({
  component: RoleInsightsPage,
  validateSearch: (search: Record<string, unknown>): RoleInsightsSearch => ({
    role: typeof search.role === "string" && search.role ? search.role : undefined,
  }),
  head: () => ({
    meta: [
      { title: "תובנות תפקידים | קח כיוון" },
      {
        name: "description",
        content:
          "סקירת תפקידים בצה״ל: קרבי, טכנולוגי, מודיעין, לוגיסטיקה ועוד — כל מה שצריך לדעת לפני גיוס.",
      },
    ],
  }),
});

const ease = [0.16, 1, 0.3, 1] as const;
const ALL_CATEGORIES = Object.keys(ROLE_CATEGORIES) as RoleCategory[];

const MAX_COMPARE = 3;

function RoleInsightsPage() {
  const { role: deepLinkSlug } = Route.useSearch();
  const [activeCategory, setActiveCategory] = useState<RoleCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [reviewStats, setReviewStats] = useState<Record<string, RoleReviewStats>>({});
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const compareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAllReviewStats()
      .then((data) => setReviewStats(data.stats ?? {}))
      .catch(() => {});
  }, []);

  // Deep link from match results: expand the role and scroll to it
  useEffect(() => {
    if (!deepLinkSlug || !getRoleBySlug(deepLinkSlug)) return;
    setExpandedSlug(deepLinkSlug);
    setActiveCategory("all");
    setSearch("");
    const t = setTimeout(() => {
      document.getElementById(`role-${deepLinkSlug}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
    return () => clearTimeout(t);
  }, [deepLinkSlug]);

  function toggleCompare(slug: string) {
    setCompareSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, slug];
    });
  }

  function openCompare() {
    setShowCompare(true);
    setTimeout(() => compareRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  const compareRoles = compareSlugs
    .map((s) => getRoleBySlug(s))
    .filter((r): r is RoleInsight => r != null);

  const filtered = useMemo(() => {
    let list: RoleInsight[] = ROLE_INSIGHTS;
    if (activeCategory !== "all") {
      list = list.filter((r) => r.category === activeCategory);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.shortDescription.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [activeCategory, search]);

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-8 md:py-14 topo-lines">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="relative overflow-hidden border border-iron/30 p-5 text-right sm:p-8 md:p-12"
      >
        <IdfPhotoPanel
          photo={getIdfPhoto("s8")}
          aspectClassName="absolute inset-0 min-h-0"
          className="absolute inset-0"
          overlayClassName="from-background/70 via-background/85 to-background"
          imgClassName="object-[center_30%]"
        />
        <div className="relative space-y-4">
          <p className="font-mono text-xs tracking-widest text-primary uppercase">
            מדריך תפקידים
          </p>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl lg:text-5xl">
            תובנות תפקיד
          </h1>
          <p className="max-w-2xl text-base leading-[1.7] text-dust md:text-lg">
            כל מה שצריך לדעת על תפקיד לפני שמחליטים: יום טיפוסי, מסלול הכשרה, דרישות,
            ולאן יוצאים אחרי השירות.
          </p>
        </div>
      </motion.header>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-4"
      >
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש תפקיד..."
            className="input-field w-full pl-10 pr-4"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dust/40">
            <Search className="h-4 w-4" />
          </span>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === "all"
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-iron/30 text-dust hover:border-iron/50 hover:text-foreground"
            }`}
          >
            הכל ({ROLE_INSIGHTS.length})
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const count = ROLE_INSIGHTS.filter((r) => r.category === cat).length;
            if (count === 0) return null;
            const meta = ROLE_CATEGORIES[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition ${
                  activeCategory === cat
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-iron/30 text-dust hover:border-iron/50 hover:text-foreground"
                }`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Compare bar */}
      <AnimatePresence>
        {compareSlugs.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease }}
            className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3 border border-primary/30 bg-background/95 p-3 backdrop-blur-sm sm:p-4"
            dir="rtl"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Columns3 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              {compareRoles.map((r) => (
                <span
                  key={r.slug}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-iron/30 bg-card px-2.5 py-1 text-xs text-foreground"
                >
                  {r.title}
                  <button
                    type="button"
                    onClick={() => toggleCompare(r.slug)}
                    className="text-dust hover:text-destructive"
                    aria-label={`הסרת ${r.title} מההשוואה`}
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              ))}
              {compareSlugs.length < MAX_COMPARE ? (
                <span className="text-[11px] text-dust/70">אפשר לבחור עד {MAX_COMPARE} תפקידים</span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={openCompare}
              disabled={compareSlugs.length < 2}
              className="btn-primary px-4 py-1.5 text-xs disabled:opacity-40 disabled:pointer-events-none"
            >
              השוואה ({compareSlugs.length})
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Comparison table */}
      {showCompare && compareRoles.length >= 2 ? (
        <div ref={compareRef}>
          <RoleComparisonTable
            roles={compareRoles}
            onClose={() => setShowCompare(false)}
            onRemove={toggleCompare}
          />
        </div>
      ) : null}

      {/* Role cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="border border-iron/30 bg-card px-6 py-12 text-center">
            <p className="text-sm text-dust">לא נמצאו תפקידים מתאימים לחיפוש.</p>
          </div>
        ) : (
          filtered.map((role, i) => (
            <RoleInsightCard
              key={role.slug}
              role={role}
              photo={idfPhotoAt(i + 1)}
              idx={i}
              expanded={expandedSlug === role.slug}
              onToggle={() =>
                setExpandedSlug((prev) => (prev === role.slug ? null : role.slug))
              }
              stats={reviewStats[role.slug] ?? null}
              compareChecked={compareSlugs.includes(role.slug)}
              compareDisabled={!compareSlugs.includes(role.slug) && compareSlugs.length >= MAX_COMPARE}
              onCompareToggle={() => toggleCompare(role.slug)}
            />
          ))
        )}
      </div>

      {/* Disclaimer */}
      <div className="border border-iron/20 bg-card p-5 text-right">
        <p className="text-xs text-dust leading-relaxed">
          <strong className="text-foreground">שימו לב:</strong> התוכן מבוסס על מידע
          כללי ומעודכן ככל הניתן, אבל דרישות ותנאים משתנים בין מחזורים ויחידות. תמיד
          אמתו מול גורמים רשמיים — מיטב, לשכת הגיוס, ואתר מתגייסים.
        </p>
      </div>

      {/* CTA bar */}
      <div className="flex flex-col items-stretch justify-between gap-4 border border-iron/30 bg-card p-6 text-right sm:flex-row sm:items-center sm:justify-end">
        <p className="text-sm text-dust">
          מוכנים לנסות? ההתאמה משתמשת בדפ״ר, ברפואי ובמא״ה מהפרופיל.
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Link
            to="/ai-counselor"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110"
          >
            <ChevronLeft className="h-4 w-4" />
            ליוצר ההתאמה
          </Link>
          <Link
            to="/dashboard"
            className="rounded-md border border-iron/40 px-5 py-3 text-sm text-dust transition hover:border-primary/40 hover:text-foreground"
          >
            דשבורד
          </Link>
        </div>
      </div>
    </div>
  );
}

function RoleComparisonTable({
  roles,
  onClose,
  onRemove,
}: {
  roles: RoleInsight[];
  onClose: () => void;
  onRemove: (slug: string) => void;
}) {
  const rows: Array<{ label: string; render: (r: RoleInsight) => string }> = [
    { label: "דרישות", render: (r) => r.requirements },
    { label: "יום טיפוסי", render: (r) => r.dailyLife },
    { label: "מסלול הכשרה", render: (r) => r.trainingPath },
    { label: "לאן יוצאים אחרי", render: (r) => r.exitOpportunities },
    { label: "טיפים להכנה", render: (r) => r.tips },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className="overflow-hidden border border-primary/30 bg-card"
      aria-labelledby="role-compare-heading"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-3 border-b border-iron/20 px-4 py-3 sm:px-6">
        <h2 id="role-compare-heading" className="flex items-center gap-2 text-base font-bold text-foreground">
          <Columns3 className="h-4 w-4 text-primary" aria-hidden />
          השוואת תפקידים
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-iron/30 text-dust transition hover:border-iron/50 hover:text-foreground"
          aria-label="סגירת ההשוואה"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-right text-sm">
          <thead>
            <tr className="border-b border-iron/20">
              <th className="w-28 p-3 align-top font-mono text-[10px] tracking-widest text-dust/70 uppercase sm:w-36 sm:p-4" scope="col">
                קריטריון
              </th>
              {roles.map((r) => {
                const catMeta = ROLE_CATEGORIES[r.category];
                return (
                  <th key={r.slug} className="p-3 align-top sm:p-4" scope="col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className={`block text-[10px] font-bold uppercase tracking-wider ${catMeta.color}`}>
                          {catMeta.label}
                        </span>
                        <span className="mt-0.5 block text-sm font-bold text-foreground">{r.title}</span>
                        {r.minDapar != null ? (
                          <span className="mt-1 block font-mono text-[10px] text-dust/70">
                            דפ״ר {r.minDapar}+{r.minMedical != null ? ` · רפואי ${r.minMedical}+` : ""}
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(r.slug)}
                        className="shrink-0 text-dust/60 hover:text-destructive"
                        aria-label={`הסרת ${r.title} מההשוואה`}
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-iron/15">
            {rows.map((row) => (
              <tr key={row.label}>
                <th className="p-3 align-top text-xs font-bold text-foreground sm:p-4" scope="row">
                  {row.label}
                </th>
                {roles.map((r) => (
                  <td key={r.slug} className="p-3 align-top text-xs leading-[1.7] text-dust sm:p-4">
                    {row.render(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}

function RoleInsightCard({
  role,
  photo,
  idx,
  expanded,
  onToggle,
  stats,
  compareChecked,
  compareDisabled,
  onCompareToggle,
}: {
  role: RoleInsight;
  photo: ReturnType<typeof idfPhotoAt>;
  idx: number;
  expanded: boolean;
  onToggle: () => void;
  stats: RoleReviewStats | null;
  compareChecked: boolean;
  compareDisabled: boolean;
  onCompareToggle: () => void;
}) {
  const catMeta = ROLE_CATEGORIES[role.category];

  return (
    <motion.article
      id={`role-${role.slug}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: idx * 0.03, ease }}
      className={`overflow-hidden border bg-card text-right scroll-mt-32 ${
        compareChecked ? "border-primary/40" : "border-iron/20"
      }`}
    >
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-4 p-4 text-right transition hover:bg-secondary/30 sm:p-6"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${catMeta.color}`}>
              {catMeta.label}
            </span>
            {role.tags.map((t) => (
              <span
                key={t}
                className="rounded-sm border border-iron/20 px-2 py-0.5 text-[10px] text-dust"
              >
                {t}
              </span>
            ))}
          </div>
          <h2 className="text-lg font-bold text-foreground sm:text-xl">{role.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-dust">{role.shortDescription}</p>
          {role.minDapar != null && (
            <div className="mt-3 flex flex-wrap gap-3 font-mono text-[11px] text-dust/70">
              <span>דפ״ר {role.minDapar}+</span>
              {role.minMedical != null && <span>רפואי {role.minMedical}+</span>}
            </div>
          )}
          {stats && <div className="mt-2"><ReviewStatsBar stats={stats} /></div>}
        </div>
        <div className="mt-1 shrink-0 text-dust">
          {expanded ? (
            <ChevronUp className="h-5 w-5" aria-hidden />
          ) : (
            <ChevronDown className="h-5 w-5" aria-hidden />
          )}
        </div>
      </button>

      <div className="flex justify-start border-t border-iron/10 px-4 py-2 sm:px-6">
        <label
          className={`inline-flex cursor-pointer items-center gap-2 text-xs ${
            compareDisabled ? "cursor-not-allowed opacity-40" : ""
          } ${compareChecked ? "text-primary" : "text-dust hover:text-foreground"}`}
        >
          <input
            type="checkbox"
            checked={compareChecked}
            disabled={compareDisabled}
            onChange={onCompareToggle}
            className="h-3.5 w-3.5 accent-[var(--primary)]"
          />
          הוספה להשוואה
        </label>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, ease }}
          className="border-t border-iron/20"
        >
          <div className="hidden sm:block border-b border-iron/20">
            <IdfPhotoPanel
              photo={photo}
              aspectClassName="aspect-[24/8]"
              overlayClassName="from-background/40 via-background/60 to-background"
            />
          </div>
          <div className="space-y-6 p-4 sm:p-6 md:p-8">
            <DetailSection title="יום טיפוסי" content={role.dailyLife} />
            <DetailSection title="מסלול הכשרה" content={role.trainingPath} />
            <DetailSection title="דרישות" content={role.requirements} />
            <DetailSection title="לאן יוצאים אחרי השירות" content={role.exitOpportunities} />
            <DetailSection title="טיפים להכנה" content={role.tips} />

            <div className="border-t border-iron/20 pt-5">
              <RoleReviewPanel roleSlug={role.slug} roleTitle={role.title} />
            </div>
          </div>
        </motion.div>
      )}
    </motion.article>
  );
}

function DetailSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold text-foreground">{title}</h3>
      <p className="text-sm leading-[1.7] text-dust">{content}</p>
    </div>
  );
}
