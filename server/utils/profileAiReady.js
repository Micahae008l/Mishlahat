import { isValidYomHameah12, migrateLegacyYomHameahTo12 } from "./yomHameah12Keys.js";

/** Fields required before AI role matching can run meaningfully. */
export function computeAiProfileMissing(stats, preferences) {
  const missing = [];

  if (!stats?.daparScore) missing.push("daparScore");
  if (!stats?.medicalProfile) missing.push("medicalProfile");
  if (!isYomHameahComplete(stats?.yomHameah)) missing.push("yomHameah");

  if (!stats?.draftDate || Number.isNaN(new Date(stats.draftDate).getTime())) {
    missing.push("draftDate");
  }

  const p = preferences;
  if (!p?.combatPreference || p.combatPreference === "Undecided") {
    missing.push("combatPreference");
  }
  if (!p?.focus || p.focus === "Any") {
    missing.push("focus");
  }
  if (!p?.physicalActivityLevel || p.physicalActivityLevel === "Unspecified") {
    missing.push("physicalActivityLevel");
  }

  return { ready: missing.length === 0, missing };
}

function isYomHameahComplete(y) {
  const migrated = migrateLegacyYomHameahTo12(y);
  return isValidYomHameah12(migrated);
}
