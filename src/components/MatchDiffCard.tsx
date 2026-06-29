import { GitCompareArrows, Minus, Plus, TrendingDown, TrendingUp } from "lucide-react";
import type { MatchRunDiff } from "@/lib/match-diff";

export function MatchDiffCard({ diff, previousDate }: { diff: MatchRunDiff; previousDate: string }) {
  const dateLabel = new Date(previousDate).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
  });

  return (
    <section className="border border-iron/30 bg-card text-right" aria-labelledby="match-diff-heading" dir="rtl">
      <div className="flex items-center justify-between gap-2 border-b border-iron/20 px-5 py-2.5">
        <span className="font-mono text-[10px] text-dust/60">לעומת ההרצה מ-{dateLabel}</span>
        <h2 id="match-diff-heading" className="eyebrow flex items-center gap-1.5">
          <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
          מה השתנה
        </h2>
      </div>

      <div className="space-y-4 p-5">
        {!diff.hasChanges ? (
          <p className="text-sm text-dust">
            אין שינוי משמעותי מההרצה הקודמת — הפרופיל וההמלצות נשארו יציבים.
          </p>
        ) : (
          <>
            {diff.profileChanges.length > 0 ? (
              <div>
                <p className="mb-1.5 text-xs font-bold text-foreground">שינויים בפרופיל</p>
                <ul className="space-y-1 font-mono text-xs text-dust">
                  {diff.profileChanges.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {diff.newRoles.length > 0 ? (
              <div>
                <p className="mb-1.5 text-xs font-bold text-foreground">תפקידים חדשים ברשימה</p>
                <ul className="space-y-1 text-xs text-dust">
                  {diff.newRoles.map((r) => (
                    <li key={r} className="flex flex-row items-center gap-1.5">
                      <Plus className="h-3 w-3 shrink-0 text-olive" aria-hidden />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {diff.droppedRoles.length > 0 ? (
              <div>
                <p className="mb-1.5 text-xs font-bold text-foreground">ירדו מהרשימה</p>
                <ul className="space-y-1 text-xs text-dust">
                  {diff.droppedRoles.map((r) => (
                    <li key={r} className="flex flex-row items-center gap-1.5">
                      <Minus className="h-3 w-3 shrink-0 text-destructive/80" aria-hidden />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {diff.scoreChanges.length > 0 ? (
              <div>
                <p className="mb-1.5 text-xs font-bold text-foreground">שינויי ציון</p>
                <ul className="space-y-1 text-xs text-dust">
                  {diff.scoreChanges.map((c) => (
                    <li key={c.roleTitle} className="flex flex-row items-center gap-1.5">
                      {c.to > c.from ? (
                        <TrendingUp className="h-3 w-3 shrink-0 text-olive" aria-hidden />
                      ) : (
                        <TrendingDown className="h-3 w-3 shrink-0 text-destructive/80" aria-hidden />
                      )}
                      <span>
                        {c.roleTitle}: <span className="font-mono">{c.from}% ← {c.to}%</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
