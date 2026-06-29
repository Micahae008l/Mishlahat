import type { DashboardResponse } from "./api";
import {
  COMBAT_PREFERENCE_OPTIONS,
  FITNESS_PREFERENCE_OPTIONS,
  FOCUS_PREFERENCE_OPTIONS,
  type CombatPreferenceValue,
  type FitnessPreferenceValue,
  type FocusPreferenceValue,
} from "./profile-preference-data";
import { defaultYomHameah12Scores, migrateLegacyYomHameahTo12, type YomHameah } from "./yom-hameah-12";

const COMBAT_SET = new Set(COMBAT_PREFERENCE_OPTIONS.map((o) => o.value));
const FOCUS_SET = new Set(FOCUS_PREFERENCE_OPTIONS.map((o) => o.value));
const FITNESS_SET = new Set(FITNESS_PREFERENCE_OPTIONS.map((o) => o.value));

export function draftDateToYmd(raw: string | Date | null | undefined): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function yomFromDashboard(stats: DashboardResponse["stats"]): YomHameah {
  return migrateLegacyYomHameahTo12(stats?.yomHameah) ?? defaultYomHameah12Scores();
}

export function coerceCombat(v: string | undefined): CombatPreferenceValue | "" {
  if (!v || v === "Undecided") return "";
  return COMBAT_SET.has(v as CombatPreferenceValue) ? (v as CombatPreferenceValue) : "";
}

export function coerceFocus(v: string | undefined): FocusPreferenceValue | "" {
  if (!v || v === "Any") return "";
  return FOCUS_SET.has(v as FocusPreferenceValue) ? (v as FocusPreferenceValue) : "";
}

export function coerceFitness(v: string | undefined): FitnessPreferenceValue | "" {
  if (!v || v === "Unspecified") return "";
  return FITNESS_SET.has(v as FitnessPreferenceValue) ? (v as FitnessPreferenceValue) : "";
}

/** First wizard step that still needs input (3–5). Assumes `!d.aiReady`. */
export function computePostSignupResumeStep(d: DashboardResponse): number {
  const name = d.user?.preferredName?.trim() ?? "";
  if (!name || d.stats?.daparScore == null || d.stats?.medicalProfile == null) return 3;
  const p = d.preferences;
  if (!p?.combatPreference || p.combatPreference === "Undecided" ||
      !p?.focus || p.focus === "Any" ||
      !p?.physicalActivityLevel || p.physicalActivityLevel === "Unspecified") return 4;
  if (!d.stats?.draftDate || Number.isNaN(Date.parse(String(d.stats.draftDate)))) return 5;
  return 5;
}

/** Primary entry target after the user taps “connect” on marketing pages. */
export function authedEntryHref(d: DashboardResponse | null): "/dashboard" | "/onboarding" | "/post-signup" {
  if (!d) return "/post-signup";
  if (d.aiReady) return "/dashboard";
  if ((d.user?.preferredName ?? "").trim().length > 0) return "/onboarding";
  return "/post-signup";
}
