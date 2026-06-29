import type { RoleMatch } from "@/lib/api";

export type ProfileSnapshot = {
  daparScore?: number | null;
  medicalProfile?: number | null;
  combatPreference?: string | null;
  focus?: string | null;
  physicalActivityLevel?: string | null;
  yomHameahSource?: string | null;
};

export type MatchRunDiff = {
  profileChanges: string[];
  newRoles: string[];
  droppedRoles: string[];
  scoreChanges: Array<{ roleTitle: string; from: number; to: number }>;
  hasChanges: boolean;
};

const SNAPSHOT_LABELS: Record<keyof ProfileSnapshot, string> = {
  daparScore: "דפ״ר",
  medicalProfile: "פרופיל רפואי",
  combatPreference: "כיוון שירות",
  focus: "מיקוד",
  physicalActivityLevel: "רמת כושר",
  yomHameahSource: "מקור ציוני מא״ה",
};

const VALUE_LABELS: Record<string, string> = {
  Kravi: "קרבי",
  Jobnik: "עורפי",
  Mixed: "משולב",
  FieldCombat: "קרבי/שטח",
  SupportHQ: "מפקדה/תמיכה",
  TechTrack: "טכנולוגי",
  MedicalInstruction: "רפואה/הדרכה",
  Undecided: "לא הוחלט",
  Tech: "טכנולוגי",
  Physical: "פיזי",
  Research: "מחקרי",
  Medical: "רפואי",
  Any: "כללי",
  Low: "נמוכה",
  Medium: "בינונית",
  High: "גבוהה",
  Unspecified: "לא צוין",
  official: "רשמי",
  self: "הערכה עצמית",
  unspecified: "לא צוין",
};

function fmt(v: unknown): string {
  if (v == null || v === "") return "—";
  const s = String(v);
  return VALUE_LABELS[s] ?? s;
}

function normTitle(s: string): string {
  return s.replace(/["'״׳()]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Compares the current match run against a previous one and explains, in
 * Hebrew, what changed and why results may differ. Pure and deterministic —
 * built from stored snapshots, not AI output.
 */
export function diffMatchRuns(
  current: { roles: RoleMatch[]; snapshot: ProfileSnapshot | null },
  previous: { roles: RoleMatch[]; snapshot: ProfileSnapshot | null },
): MatchRunDiff {
  const profileChanges: string[] = [];

  if (current.snapshot && previous.snapshot) {
    for (const key of Object.keys(SNAPSHOT_LABELS) as Array<keyof ProfileSnapshot>) {
      const before = previous.snapshot[key] ?? null;
      const after = current.snapshot[key] ?? null;
      if (String(before ?? "") !== String(after ?? "")) {
        profileChanges.push(`${SNAPSHOT_LABELS[key]}: ${fmt(before)} ← ${fmt(after)}`);
      }
    }
  }

  const prevByTitle = new Map(previous.roles.map((r) => [normTitle(r.roleTitle), r]));
  const currByTitle = new Map(current.roles.map((r) => [normTitle(r.roleTitle), r]));

  const newRoles: string[] = [];
  const scoreChanges: MatchRunDiff["scoreChanges"] = [];
  for (const r of current.roles) {
    const prev = prevByTitle.get(normTitle(r.roleTitle));
    if (!prev) {
      newRoles.push(r.roleTitle);
    } else if (Math.abs((prev.matchPercentage || 0) - (r.matchPercentage || 0)) >= 3) {
      scoreChanges.push({
        roleTitle: r.roleTitle,
        from: prev.matchPercentage || 0,
        to: r.matchPercentage || 0,
      });
    }
  }

  const droppedRoles = previous.roles
    .filter((r) => !currByTitle.has(normTitle(r.roleTitle)))
    .map((r) => r.roleTitle);

  return {
    profileChanges,
    newRoles,
    droppedRoles,
    scoreChanges,
    hasChanges:
      profileChanges.length > 0 ||
      newRoles.length > 0 ||
      droppedRoles.length > 0 ||
      scoreChanges.length > 0,
  };
}
