/**
 * 12 מדדי יום המא״ה (מיון, איתור והתאמה) בסולם 1–5 — בהתאם לרשימות המקובלות באתרי הכנה (תחנות + מבחנים פסיכוטכניים).
 * @type {readonly string[]}
 */
export const YOM_HAMEAH_12_KEYS = [
  "technicalActivation",
  "spatialPerception",
  "dataProcessing",
  "teamwork",
  "command",
  "instruction",
  "interpersonalCare",
  "diligencePersistence",
  "sustainedAttention",
  "speedAndAccuracy",
  "managementOrganization",
  "disciplineMaturity",
];

/** @type {Record<string, string>} */
export const YOM_HAMEAH_12_LABELS_HE = {
  technicalActivation: "הפעלה טכנית והבנת מערכות",
  spatialPerception: "תפיסה מרחבית",
  dataProcessing: "עיבוד מידע",
  teamwork: "עבודת צוות",
  command: "פיקוד",
  instruction: "הדרכה",
  interpersonalCare: "טיפול באדם / יחסים בין־אישיים",
  diligencePersistence: "השקעה והתמדה",
  sustainedAttention: "קשב מתמשך",
  speedAndAccuracy: "זריזות, יעילות ודיוק",
  managementOrganization: "ניהול וארגון",
  disciplineMaturity: "התנהגות מסגרתית ובגרות",
};

const LEGACY_5 = ["teamwork", "management", "technical", "field", "dataProcessing"];

/** @param {unknown} y */
export function isValidYomHameah12(y) {
  if (!y || typeof y !== "object") return false;
  const o = /** @type {Record<string, unknown>} */ (y);
  return YOM_HAMEAH_12_KEYS.every((k) => {
    const v = o[k];
    return typeof v === "number" && v >= 1 && v <= 5;
  });
}

/**
 * ממיר מבנה ישן (5 ממדים) ל־12 מפתחות; אם כבר יש 12 תקינים — מחזיר עותק נקי.
 * @param {unknown} y
 * @returns {Record<string, number>|null}
 */
export function migrateLegacyYomHameahTo12(y) {
  if (!y || typeof y !== "object") return null;
  const o = /** @type {Record<string, number>} */ (y);
  if (isValidYomHameah12(o)) {
    return Object.fromEntries(YOM_HAMEAH_12_KEYS.map((k) => [k, o[k]]));
  }
  if (!LEGACY_5.every((k) => typeof o[k] === "number" && o[k] >= 1 && o[k] <= 5)) {
    return null;
  }
  const t = o.technical;
  const f = o.field;
  const d = o.dataProcessing;
  const tw = o.teamwork;
  const m = o.management;
  return {
    technicalActivation: t,
    spatialPerception: f,
    dataProcessing: d,
    teamwork: tw,
    command: m,
    instruction: m,
    interpersonalCare: Math.max(1, Math.min(5, Math.round((tw + m) / 2))),
    diligencePersistence: m,
    sustainedAttention: d,
    speedAndAccuracy: Math.max(1, Math.min(5, Math.round((d + t) / 2))),
    managementOrganization: m,
    disciplineMaturity: m,
  };
}
