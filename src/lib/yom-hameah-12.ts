/** Must stay aligned with server/utils/yomHameah12Keys.js */

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
] as const;

export type YomHameah12Key = (typeof YOM_HAMEAH_12_KEYS)[number];

export type YomHameah = Record<YomHameah12Key, number>;

export const YOM_HAMEAH_12_LABELS_HE: Record<YomHameah12Key, string> = {
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

const LEGACY_5 = ["teamwork", "management", "technical", "field", "dataProcessing"] as const;

export function isValidYomHameah12(y: unknown): y is YomHameah {
  if (!y || typeof y !== "object") return false;
  const o = y as Record<string, unknown>;
  return YOM_HAMEAH_12_KEYS.every((k) => {
    const v = o[k];
    return typeof v === "number" && v >= 1 && v <= 5;
  });
}

/** מבנה ישן (5) → 12; אם כבר 12 תקינים — עותק נקי */
export function migrateLegacyYomHameahTo12(y: unknown): YomHameah | null {
  if (!y || typeof y !== "object") return null;
  const o = y as Record<string, number>;
  if (isValidYomHameah12(o)) {
    return Object.fromEntries(YOM_HAMEAH_12_KEYS.map((k) => [k, o[k]])) as YomHameah;
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

export function defaultYomHameah12Scores(): YomHameah {
  return Object.fromEntries(YOM_HAMEAH_12_KEYS.map((k) => [k, 3])) as YomHameah;
}
