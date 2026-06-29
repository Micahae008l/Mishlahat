import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, X } from "lucide-react";
import type { DashboardResponse } from "@/lib/api";

const STORAGE_KEY = "kachkivun_official_scores_nudge_until";
const SNOOZE_DAYS = 7;

function isSnoozed(): boolean {
  try {
    const until = Number(localStorage.getItem(STORAGE_KEY) || 0);
    return Date.now() < until;
  } catch {
    return false;
  }
}

/**
 * Shown when meah scores are self-estimated: the single highest-leverage
 * action a user can take to improve match accuracy is entering official
 * scores after יום המא״ה. Dismissible with a 7-day snooze.
 */
export function OfficialScoresNudge({ dash }: { dash: DashboardResponse | undefined }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(isSnoozed());
  }, []);

  const isSelfEstimated = dash?.preferences?.yomHameahSource === "self";
  const hasYom = dash?.stats?.yomHameah != null;
  if (!isSelfEstimated || !hasYom || dismissed) return null;

  function snooze() {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now() + SNOOZE_DAYS * 86_400_000));
    } catch {
      // localStorage unavailable — dismiss for this session only
    }
    setDismissed(true);
  }

  return (
    <div
      className="flex flex-row-reverse items-start gap-3 border border-primary/25 bg-primary/[0.05] p-4 text-right"
      dir="rtl"
      role="note"
    >
      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          ציוני המא״ה שלכם הם הערכה עצמית
        </p>
        <p className="mt-1 text-xs leading-relaxed text-dust">
          עברתם כבר את יום המא״ה? הזנת הציונים הרשמיים (מאזור אישי במיטב) תשפר משמעותית את דיוק
          ההתאמות ואת רמת הביטחון בהמלצות.
        </p>
        <Link to="/profile" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
          עדכון ציונים רשמיים בפרופיל ←
        </Link>
      </div>
      <button
        type="button"
        onClick={snooze}
        className="shrink-0 text-dust/60 transition hover:text-foreground"
        aria-label="סגירת ההודעה לשבוע"
        title="הסתרה לשבוע"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
