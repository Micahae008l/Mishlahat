import { createFileRoute, Link } from "@tanstack/react-router";
import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ExternalLink,
  Search,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { getRoleInsight, listRoles, roleInsightSlug } from "@/lib/api";
import { RoleReviewsPanel } from "@/components/RoleReviewsPanel";
import { IdfPhotoPanel } from "@/components/IdfPhotoPanel";
import { getIdfPhoto } from "@/lib/idf-images";

type Search = {
  role?: string;
  q?: string;
  category?: string;
};

export const Route = createFileRoute("/role-insights")({
  validateSearch: (raw: Record<string, unknown>): Search => ({
    role: typeof raw.role === "string" && raw.role.trim() ? raw.role.trim() : undefined,
    q: typeof raw.q === "string" && raw.q.trim() ? raw.q.trim() : undefined,
    category: typeof raw.category === "string" && raw.category.trim() ? raw.category.trim() : undefined,
  }),
  component: RoleInsightsPage,
  head: ({ match }) => {
    const role = match.search.role;
    return {
      meta: [
        {
          title: role
            ? `תובנות: ${decodeURIComponent(role)} | קח כיוון`
            : "תובנות תפקידים | קח כיוון",
        },
        {
          name: "description",
          content:
            "מידע על תפקידים בצה״ל: מה עושים ביום־יום, למי זה מתאים, וקישור לאתר מתגייסים הרשמי.",
        },
      ],
    };
  },
});

const ease = [0.16, 1, 0.3, 1] as const;

function IntensityBar({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;
  const pct = Math.round((Math.min(5, Math.max(1, value)) / 5) * 100);
  return (
    <div className="space-y-1 text-right">
      <div className="flex items-center justify-between gap-3 text-xs" dir="rtl">
        <span className="text-dust">{label}</span>
        <span className="font-mono tabular-nums text-dust">{value}/5</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-sm bg-iron/25">
        <div className="h-full bg-primary/80" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RoleInsightsPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const selectedSlug = search.role ? roleInsightSlug(decodeURIComponent(search.role)) : undefined;

  const [query, setQuery] = useState(search.q || "");
  const deferredQ = useDeferredValue(query.trim());

  const listQuery = useQuery({
    queryKey: ["roles-catalog", deferredQ, search.category],
    queryFn: () => listRoles({ q: deferredQ || undefined, category: search.category }),
    staleTime: 5 * 60_000,
  });

  const detailQuery = useQuery({
    queryKey: ["role-insight", selectedSlug],
    queryFn: () => getRoleInsight(selectedSlug!),
    enabled: Boolean(selectedSlug),
    staleTime: 10 * 60_000,
  });

  const categories = listQuery.data?.categories ?? [];
  const roles = listQuery.data?.roles ?? [];
  const detail = detailQuery.data?.role;

  const categoryChips = useMemo(() => categories.slice(0, 24), [categories]);

  function openRole(slug: string) {
    void navigate({
      search: (prev) => ({ ...prev, role: slug }),
    });
  }

  function closeRole() {
    void navigate({
      search: (prev) => {
        const next = { ...prev };
        delete next.role;
        return next;
      },
    });
  }

  function setCategory(category?: string) {
    void navigate({
      search: (prev) => ({
        ...prev,
        category: category || undefined,
        role: undefined,
      }),
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 topo-lines">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="relative overflow-hidden border border-iron/30 p-5 text-right sm:p-8"
      >
        <IdfPhotoPanel
          photo={getIdfPhoto("s8")}
          aspectClassName="absolute inset-0 min-h-0"
          className="absolute inset-0"
          overlayClassName="from-background/70 via-background/85 to-background"
          imgClassName="object-[center_30%]"
        />
        <div className="relative space-y-3">
          <p className="font-mono text-xs tracking-widest text-primary uppercase">קטלוג תפקידים</p>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            תובנות תפקידים
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-dust sm:text-base">
            חיפוש בכל {listQuery.data?.total ?? "…"} התפקידים שבמערכת, הסבר בעברית, וקישור לאתר מתגייסים
            הרשמי של צה״ל. אחרי התאמה ביועץ AI אפשר לפתוח כל תפקיד מכאן.
          </p>
        </div>
      </motion.header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" dir="rtl">
        <label className="relative block flex-1">
          <span className="sr-only">חיפוש תפקיד</span>
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dust" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי שם, קטגוריה או מילת מפתח…"
            className="input-field w-full pr-10"
          />
        </label>
        <Link
          to="/ai-counselor"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          התאמת תפקידים
        </Link>
      </div>

      <div className="flex flex-wrap justify-start gap-2" dir="rtl">
        <button
          type="button"
          onClick={() => setCategory(undefined)}
          className={`rounded-sm border px-3 py-1.5 text-xs transition ${
            !search.category
              ? "border-primary/50 bg-primary/15 text-foreground"
              : "border-iron/30 text-dust hover:border-primary/30"
          }`}
        >
          הכל
        </button>
        {categoryChips.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c === search.category ? undefined : c)}
            className={`rounded-sm border px-3 py-1.5 text-xs transition ${
              search.category === c
                ? "border-primary/50 bg-primary/15 text-foreground"
                : "border-iron/30 text-dust hover:border-primary/30"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="text-right text-xs text-dust" dir="rtl">
        {listQuery.isLoading
          ? "טוען…"
          : `מציגים ${listQuery.data?.count ?? 0} מתוך ${listQuery.data?.total ?? 0} תפקידים`}
      </p>

      <div className="grid gap-3 sm:grid-cols-2" dir="rtl">
        {roles.map((r) => (
          <button
            key={r.slug}
            type="button"
            onClick={() => openRole(r.slug)}
            className="border border-iron/30 bg-card p-4 text-right transition hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-foreground">{r.roleTitle}</h2>
                <p className="mt-1 font-mono text-[10px] tracking-wide text-dust">{r.category}</p>
              </div>
              {r.combat ? (
                <span className="inline-flex items-center gap-1 rounded-sm border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                  <Shield className="h-3 w-3" aria-hidden />
                  קרבי
                </span>
              ) : null}
            </div>
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-dust">{r.summary}</p>
            {r.signals.length ? (
              <p className="mt-2 text-[11px] text-dust/80">{r.signals.slice(0, 3).join(" · ")}</p>
            ) : null}
          </button>
        ))}
      </div>

      {!listQuery.isLoading && roles.length === 0 ? (
        <p className="py-10 text-center text-sm text-dust">לא נמצאו תפקידים לחיפוש הזה.</p>
      ) : null}

      <AnimatePresence>
        {selectedSlug ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-3 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeRole}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="role-insight-title"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25, ease }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-iron/40 bg-card p-5 text-right shadow-xl sm:p-8"
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={closeRole}
                  className="rounded-md border border-iron/30 p-2 text-dust transition hover:text-foreground"
                  aria-label="סגירה"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] tracking-widest text-primary uppercase">
                    {detail?.category || "תפקיד"}
                  </p>
                  <h2 id="role-insight-title" className="text-xl font-black text-foreground sm:text-2xl">
                    {detail?.roleTitle || "טוען…"}
                  </h2>
                </div>
              </div>

              {detailQuery.isLoading ? (
                <p className="text-sm text-dust">טוען פירוט…</p>
              ) : detailQuery.isError ? (
                <p className="text-sm text-destructive">לא הצלחנו לטעון את התפקיד. נסו שוב.</p>
              ) : detail ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2">
                    {detail.combat ? (
                      <span className="rounded-sm border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] text-primary">
                        כיוון קרבי / שדה
                      </span>
                    ) : (
                      <span className="rounded-sm border border-iron/30 px-2 py-1 text-[11px] text-dust">
                        כיוון מקצועי / עורפי
                      </span>
                    )}
                    {detail.selective ? (
                      <span className="rounded-sm border border-iron/30 px-2 py-1 text-[11px] text-dust">
                        קבלה סלקטיבית
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
                    {detail.about.split(/\n\n+/).map((p, i) => (
                      <p key={i} className={i === 0 ? "" : "text-dust"}>
                        {p}
                      </p>
                    ))}
                  </div>

                  {detail.signals.length ? (
                    <div>
                      <h3 className="mb-2 text-xs font-bold text-foreground">מה עושים בפועל</h3>
                      <ul className="list-disc space-y-1 pr-5 text-sm text-dust">
                        {detail.signals.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {detail.requirements.length ? (
                    <div>
                      <h3 className="mb-2 text-xs font-bold text-foreground">דרישות / הערות</h3>
                      <ul className="list-disc space-y-1 pr-5 text-sm text-dust">
                        {detail.requirements.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {(detail.locations.length > 0 || detail.serviceLengthLabel) && (
                    <div className="grid gap-2 text-sm text-dust sm:grid-cols-2">
                      {detail.serviceLengthLabel ? (
                        <p>
                          <span className="text-foreground">אורך שירות משוער: </span>
                          {detail.serviceLengthLabel}
                        </p>
                      ) : null}
                      {detail.locations.length ? (
                        <p>
                          <span className="text-foreground">מיקומים משוערים: </span>
                          {detail.locations.join(", ")}
                        </p>
                      ) : null}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-3">
                    <IntensityBar label="עומס פיזי" value={detail.physicalDemand} />
                    <IntensityBar label="טכנולוגיה" value={detail.techIntensity} />
                    <IntensityBar label="עבודה עם אנשים" value={detail.peopleIntensity} />
                  </div>

                  <div className="flex flex-col gap-2 border-t border-iron/20 pt-4 sm:flex-row sm:justify-end">
                    <a
                      href={detail.officialSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden />
                      חיפוש באתר מתגייסים
                    </a>
                    <a
                      href={detail.officialDirectoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-iron/40 px-4 py-2.5 text-sm text-dust transition hover:border-primary/40 hover:text-foreground"
                    >
                      קטלוג תפקידים רשמי
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                    </a>
                  </div>

                  <p className="text-[11px] leading-relaxed text-dust/80">
                    קישור החיפוש מוביל לתוצאות מאתר מתגייסים (mitgaisim.idf.il). השמות והדרישות משתנים,
                    ואנחנו לא מחליפים ייעוץ רשמי של צה״ל.
                  </p>

                  <RoleReviewsPanel roleSlug={detail.slug} roleTitle={detail.roleTitle} />
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
