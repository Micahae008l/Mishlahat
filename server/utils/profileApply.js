import User from "../models/User.js";
import MilitaryStats from "../models/MilitaryStats.js";
import Preferences from "../models/Preferences.js";
import { addMonths, aggregateYomFromAnswers, loadYomQuestionDefs } from "./yomLoad.js";
import { isValidYomHameah12, migrateLegacyYomHameahTo12 } from "./yomHameah12Keys.js";

export const SERVICE_MAP = {
  pre: "Pre-Draft",
  serving: "Active Duty",
  veteran: "Discharged",
};

export function setDateField(update, key, value) {
  if (value === undefined) return;
  update[key] = value ? new Date(value) : null;
}

/**
 * @param {import("mongoose").Types.ObjectId} userId
 * @param {Record<string, unknown>} userPatch
 */
export async function applyUserPatch(userId, userPatch) {
  if (!userPatch || typeof userPatch !== "object") return;
  const u = {};
  if (userPatch.preferredName !== undefined) {
    const n = String(userPatch.preferredName).trim().slice(0, 120);
    u.preferredName = n;
  }
  if (userPatch.phone !== undefined) {
    u.phone = String(userPatch.phone)
      .trim()
      .replace(/\s+/g, "")
      .slice(0, 20);
  }
  if (userPatch.serviceLifeCycle === "pre" || userPatch.serviceLifeCycle === "serving" || userPatch.serviceLifeCycle === "veteran") {
    u.status = SERVICE_MAP[userPatch.serviceLifeCycle];
  }
  if (Object.keys(u).length) await User.findByIdAndUpdate(userId, u);
}

/**
 * @param {import("mongoose").Types.ObjectId} userId
 * @param {Record<string, unknown>} stats
 */
export async function applyStatsPatch(userId, stats) {
  if (!stats || typeof stats !== "object") return;
  const update = {};
  setDateField(update, "draftDate", stats.draftDate);
  setDateField(update, "dischargeDate", stats.dischargeDate);
  setDateField(update, "serviceStartDate", stats.serviceStartDate);
  setDateField(update, "serviceEndDate", stats.serviceEndDate);

  if (stats.daparScore !== undefined) update.daparScore = stats.daparScore;
  if (stats.medicalProfile !== undefined) update.medicalProfile = stats.medicalProfile;

  if (Array.isArray(stats.yomQuestionnaire) && stats.yomQuestionnaire.length > 0) {
    update.yomQuestionnaire = stats.yomQuestionnaire.map((x) => ({
      questionId: String(x.questionId),
      score: Number(x.score),
    }));
    try {
      const defs = loadYomQuestionDefs();
      const yom = aggregateYomFromAnswers(update.yomQuestionnaire, defs);
      if (yom) update.yomHameah = yom;
    } catch {
      /* keep manual yomHameah if file missing */
    }
  } else if (stats.yomHameah !== undefined) {
    if (stats.yomHameah === null) {
      update.yomHameah = null;
      update.yomQuestionnaire = [];
    } else {
      const migrated = migrateLegacyYomHameahTo12(stats.yomHameah);
      if (isValidYomHameah12(migrated)) {
        update.yomHameah = migrated;
      } else if (isValidYomHameah12(stats.yomHameah)) {
        update.yomHameah = stats.yomHameah;
      }
      update.yomQuestionnaire = [];
    }
  }

  if (Object.keys(update).length) {
    await MilitaryStats.findOneAndUpdate({ userId }, { $set: update }, { new: true, upsert: true });
  }

  const userAfter = await User.findById(userId).select("status");
  const doc = await MilitaryStats.findOne({ userId });
  if (userAfter?.status === "Active Duty" && doc?.serviceStartDate && !doc.dischargeDate) {
    const end = addMonths(doc.serviceStartDate, 32);
    await MilitaryStats.findOneAndUpdate({ userId }, { $set: { dischargeDate: end } });
  }
}

/**
 * @param {import("mongoose").Types.ObjectId} userId
 * @param {Record<string, unknown>} preferences
 */
export async function applyPreferencesPatch(userId, preferences) {
  if (!preferences || typeof preferences !== "object") return;
  const p = {};
  if (preferences.combatPreference !== undefined) p.combatPreference = preferences.combatPreference;
  if (preferences.schedule !== undefined) p.schedule = preferences.schedule;
  if (preferences.focus !== undefined) p.focus = preferences.focus;
  if (preferences.location !== undefined) p.location = preferences.location;
  if (preferences.physicalActivityLevel !== undefined) p.physicalActivityLevel = preferences.physicalActivityLevel;
  if (preferences.yomHameahSource === "official" || preferences.yomHameahSource === "self" || preferences.yomHameahSource === "unspecified") {
    p.yomHameahSource = preferences.yomHameahSource;
  }
  if (Object.keys(p).length) {
    await Preferences.findOneAndUpdate({ userId }, { $set: p }, { new: true, upsert: true });
  }
}
