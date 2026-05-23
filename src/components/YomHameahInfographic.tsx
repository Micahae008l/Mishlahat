type Props = {
  /** Full explainer for optional `<details>` (same copy as `yom-hameah-explainer.txt`). */
  longExplainer: string;
};

const DIMENSION_CHIPS = [
  { short: "עיבוד מידע", hint: "נתונים, טבלאות" },
  { short: "טכני", hint: "מערכות וכלים" },
  { short: "מרחב", hint: "כיוונים, שטח" },
  { short: "צוות", hint: "שיתוף, תקשורת" },
  { short: "ניהול", hint: "ארגון, הובלה" },
] as const;

/**
 * Visual explainer for יום המא״ה on onboarding — replaces a wall of text with scannable graphics.
 */
export function YomHameahInfographic({ longExplainer }: Props) {
  return (
    <section
      aria-labelledby="yom-infographic-title"
      className="space-y-5 rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/[0.07] via-white/[0.02] to-transparent p-4 sm:p-5"
    >
      <div className="text-right">
        <h2 id="yom-infographic-title" className="text-base font-bold tracking-tight text-foreground sm:text-lg">
          מאה — איך לקרוא את זה?
        </h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          כל ממד הוא ציון נפרד בסולם 1–5. במשלחת נאגדים חמישה ממדים נוחים מתוך הרשימה הארוכה של הגליון הרשמי.
        </p>
      </div>

      {/* 1–5 scale */}
      <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
        <p className="mb-2 text-right text-xs font-medium text-foreground">סולם הציון</p>
        <div dir="ltr" className="flex justify-between gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums sm:h-10 sm:w-10 sm:text-sm ${
                n <= 2
                  ? "border border-white/15 bg-white/5 text-muted-foreground"
                  : n === 3
                    ? "border border-primary/40 bg-primary/15 text-foreground"
                    : "border border-primary/60 bg-primary/25 text-primary"
              }`}
            >
              {n}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground sm:text-xs" dir="rtl">
          <span>1 — הכי נמוך</span>
          <span>5 — הכי גבוה</span>
        </div>
      </div>

      {/* Two exercises → one score */}
      <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
        <p className="mb-3 text-right text-xs font-medium text-foreground">איך נקבע ציון?</p>
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-center text-[11px] font-medium text-foreground sm:text-xs">
              מבחן / תרגיל
            </span>
            <span className="text-muted-foreground" aria-hidden>
              +
            </span>
            <span className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-center text-[11px] font-medium text-foreground sm:text-xs">
              מבחן / תרגיל
            </span>
          </div>
          <span className="text-sm font-light text-primary" aria-hidden>
            ↓
          </span>
          <div className="rounded-lg border border-primary/45 bg-primary/15 px-4 py-2 text-center text-[11px] font-semibold text-primary sm:text-sm">
            ציון אחד לממד
          </div>
        </div>
        <p className="mt-2 text-right text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          לפי מקורות מעודכנים (למשל מתגייסים): לרוב לפחות שני מבחנים לפני שמקבעים מספר — לא רגע בודד של לחץ.
        </p>
      </div>

      {/* Five merged dimensions */}
      <div>
        <p className="mb-2 text-right text-xs font-medium text-foreground">חמשת הממדים במשלחת</p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="list">
          {DIMENSION_CHIPS.map(({ short, hint }) => (
            <li
              key={short}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2.5 text-right sm:px-3"
            >
              <span className="block text-xs font-semibold text-foreground">{short}</span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">{hint}</span>
            </li>
          ))}
        </ul>
      </div>

      <details className="group rounded-lg border border-white/10 bg-black/15 text-right">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-muted-foreground transition marker:content-none hover:text-foreground [&::-webkit-details-marker]:hidden">
          <span className="inline-flex w-full items-center justify-between gap-2">
            הרחבה — טקסט מלא
            <span className="text-[10px] text-primary/80 transition group-open:rotate-180">▼</span>
          </span>
        </summary>
        <p className="border-t border-white/5 px-3 pb-3 pt-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
          {longExplainer}
        </p>
      </details>
    </section>
  );
}
