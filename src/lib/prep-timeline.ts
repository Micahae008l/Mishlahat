export type PrepPhaseStatus = "done" | "active" | "upcoming";

export type PrepPhase = {
  id: string;
  title: string;
  window: string;
  tasks: string[];
  status: PrepPhaseStatus;
};

type PhaseDef = Omit<PrepPhase, "status"> & {
  /** Phase is active while daysRemaining is within (minDays, maxDays] */
  minDays: number;
  maxDays: number;
};

const PHASES: PhaseDef[] = [
  {
    id: "build",
    title: "בנייה",
    window: "מ-120 יום ומעלה",
    minDays: 120,
    maxDays: Infinity,
    tasks: [
      "השלימו את הפרופיל עם ציונים רשמיים (דפ״ר, רפואי, מא״ה)",
      "התחילו תוכנית כושר הדרגתית — ריצה 2-3 פעמים בשבוע",
      "עברו על מאגר התפקידים וסמנו 5-10 שמסקרנים אתכם",
    ],
  },
  {
    id: "focus",
    title: "מיקוד",
    window: "120-60 יום לפני",
    minDays: 60,
    maxDays: 120,
    tasks: [
      "הריצו התאמת תפקידים והפיקו דוח מוכנות מלא",
      "צללו לעומק על 3 התפקידים המובילים — יומיום, מסלול, מיונים",
      "בדקו אילו מיונים נוספים נדרשים לכיוונים שבחרתם",
    ],
  },
  {
    id: "prep",
    title: "הכנה ממוקדת",
    window: "60-21 יום לפני",
    minDays: 21,
    maxDays: 60,
    tasks: [
      "תרגלו ראיונות ושאלות מיון לכיוון שבחרתם",
      "שפרו נקודות חולשה ספציפיות (כושר, עברית, ידע טכני)",
      "ודאו שכל המסמכים הרפואיים והאישורים מסודרים",
    ],
  },
  {
    id: "final",
    title: "ישורת אחרונה",
    window: "3 השבועות האחרונים",
    minDays: 0,
    maxDays: 21,
    tasks: [
      "סדרו ציוד אישי ומסמכים ליום הגיוס",
      "שמרו על שגרת שינה וכושר — בלי שיאים חדשים",
      "עברו שוב על הדוח האחרון ושתפו את המשפחה בכיוון",
    ],
  },
];

/**
 * Maps days-until-draft to a simple preparation timeline.
 * Returns null when there is no valid future draft date.
 */
export function computePrepTimeline(daysRemaining: number | null): PrepPhase[] | null {
  if (daysRemaining == null || daysRemaining < 0) return null;

  return PHASES.map((p) => {
    let status: PrepPhaseStatus;
    if (daysRemaining > p.maxDays) status = "upcoming";
    else if (daysRemaining <= p.minDays) status = "done";
    else status = "active";
    return { id: p.id, title: p.title, window: p.window, tasks: p.tasks, status };
  });
}
