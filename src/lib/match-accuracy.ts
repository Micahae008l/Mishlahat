import type { DashboardResponse } from "@/lib/api";
import { AI_PROFILE_MISSING_LABELS } from "@/lib/profile-preference-data";

export type MatchAccuracy = {
  /** 0-100 — how much the matching engine can trust the current profile */
  pct: number;
  level: "high" | "medium" | "low";
  levelLabel: string;
  notes: string[];
};

const REQUIRED_FIELD_COUNT = 7;

/**
 * Deterministic "match accuracy" estimate, computed from profile completeness
 * and data quality (official vs self-estimated meah scores).
 * Mirrors what the server's AI-ready gate + confidence logic care about.
 */
export function computeMatchAccuracy(dash: DashboardResponse | undefined): MatchAccuracy {
  const notes: string[] = [];
  if (!dash) {
    return { pct: 0, level: "low", levelLabel: "נמוך", notes: ["טוענים את נתוני הפרופיל…"] };
  }

  const missing = dash.aiProfileMissing ?? [];
  const filled = Math.max(0, REQUIRED_FIELD_COUNT - missing.length);
  let pct = Math.round((filled / REQUIRED_FIELD_COUNT) * 70);

  for (const key of missing) {
    const label = AI_PROFILE_MISSING_LABELS[key] ?? key;
    notes.push(`חסר: ${label}`);
  }

  const yomSource = dash.preferences?.yomHameahSource;
  const hasYom = !missing.includes("yomHameah");
  if (hasYom) {
    if (yomSource === "official") {
      pct += 30;
    } else if (yomSource === "self") {
      pct += 15;
      notes.push("ציוני המא״ה הם הערכה עצמית — עדכון לציונים רשמיים ישפר את הדיוק");
    } else {
      pct += 10;
      notes.push("לא צוין אם ציוני המא״ה רשמיים — סמנו את המקור בפרופיל");
    }
  }

  pct = Math.min(100, Math.max(0, pct));
  const level = pct >= 85 ? "high" : pct >= 60 ? "medium" : "low";
  const levelLabel = level === "high" ? "גבוה" : level === "medium" ? "בינוני" : "נמוך";

  if (level === "high" && notes.length === 0) {
    notes.push("הפרופיל מלא ומבוסס על נתונים רשמיים — ההתאמה במיטבה");
  }

  return { pct, level, levelLabel, notes };
}
