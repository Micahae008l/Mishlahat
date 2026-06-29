import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import User from "../models/User.js";
import MilitaryStats from "../models/MilitaryStats.js";
import Preferences from "../models/Preferences.js";
import { recordAiUsage } from "../utils/recordAiUsage.js";
import { computeAiProfileMissing } from "../utils/profileAiReady.js";
import {
  YOM_HAMEAH_12_KEYS,
  YOM_HAMEAH_12_LABELS_HE,
  migrateLegacyYomHameahTo12,
} from "../utils/yomHameah12Keys.js";
import { getIdfRoleCatalogParsed } from "../utils/idfRoleCatalog.js";
import { preFilterRoles } from "../utils/rolePreFilter.js";
import {
  MATCH_ROLE_COUNT,
  CANDIDATE_POOL_SIZE,
  reconcileAiSelectedRoles,
} from "../utils/matchRolesAnchor.js";
import MatchHistory from "../models/MatchHistory.js";
import { trimUserMatchHistory } from "./matchHistoryController.js";
import { mapOpenAiError } from "../utils/openaiErrors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Bump when match-roles-system.txt or the user-prompt structure changes. */
export const MATCH_PROMPT_VERSION = "match-v4";

function loadSystemPrompt() {
  try {
    return fs.readFileSync(path.join(__dirname, "../prompts/match-roles-system.txt"), "utf8");
  } catch {
    return `You are an expert IDF placement counselor. Respond with ONLY a valid JSON object: {"roles":[...]} with ${MATCH_ROLE_COUNT} role objects (roleTitle, matchPercentage, summary, description, tags). summary = one Hebrew sentence; description = 2-3 Hebrew sentences.`;
  }
}

const BASE_SYSTEM_PROMPT = loadSystemPrompt();

/**
 * Build the system prompt with an inline candidate pool the AI chooses from.
 * The pool is pre-screened for eligibility; the AI does the actual selection + ranking.
 */
function buildSystemPrompt(candidatePool) {
  const catalogSection = candidatePool?.length
    ? `

---

## מאגר מועמדים — ${candidatePool.length} תפקידים זמינים לבחירה

להלן ${candidatePool.length} תפקידים שעברו סינון התאמה ראשוני (דפ״ר, רפואי, העדפות קשיחות). בחרו מתוכם את התפקידים שבאמת מתאימים למועמד ודרגו אותם.

חובות:
- בחרו עד ${MATCH_ROLE_COUNT} התפקידים המתאימים ביותר, מהחזק לחלש.
- מותר ורצוי לא לכלול תפקיד שלא תואם את החוזקות/ההעדפות של המועמד — גם אם הוא יוקרתי או סלקטיבי.
- השתמשו אך ורק ב-roleTitle שמופיע ברשימה למטה — אסור להמציא תפקידים.
- כתבו summary, description ו-tags בעברית לכל תפקיד שנבחר.
- שימו לב לשדות signals ו-aiRecommendationHint — הם מנחים את ההתאמה והתיאור.

${JSON.stringify(candidatePool.map(r => ({
  roleTitle: r.roleTitle,
  category: r.category,
  combat: r.combat,
  selective: r.selective,
  preferenceTags: r.preferenceTags,
  signals: r.signals,
  bestFor: r.bestFor,
  aiRecommendationHint: r.aiRecommendationHint,
})), null, 0)}`
    : "";

  return BASE_SYSTEM_PROMPT + catalogSection;
}

/**
 * Normalize model output: JSON mode object, legacy raw array, or fenced / prefixed text.
 */
function parseRolesArray(raw) {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*\r?\n?/i, "").replace(/\r?\n?```\s*$/i, "").trim();

  const tryParse = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  let parsed = tryParse(s);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object" && Array.isArray(parsed.roles)) return parsed.roles;

  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start !== -1 && end > start) {
    parsed = tryParse(s.slice(start, end + 1));
    if (Array.isArray(parsed)) return parsed;
  }

  const objStart = s.indexOf("{");
  const objEnd = s.lastIndexOf("}");
  if (objStart !== -1 && objEnd > objStart) {
    parsed = tryParse(s.slice(objStart, objEnd + 1));
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.roles)) return parsed.roles;
  }

  return null;
}

/** Loose Hebrew title normalization for matching AI output back to catalog rows. */
function normalizeTitle(s) {
  return String(s || "")
    .replace(/["'״׳()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Find the pre-filtered catalog row the AI most likely referenced. */
function findFilteredRole(filteredRoles, roleTitle) {
  const target = normalizeTitle(roleTitle);
  if (!target) return null;
  let best = null;
  for (const r of filteredRoles) {
    const cand = normalizeTitle(r.roleTitle);
    if (cand === target) return r;
    if (!best && (cand.includes(target) || target.includes(cand))) best = r;
  }
  return best;
}

/**
 * Confidence is deterministic and honest: it reflects data quality,
 * not how good the recommendations "sound".
 */
function computeMatchConfidence({ yomSource, filteredRoleCount, matchedToCatalog, totalRoles }) {
  const notes = [];
  let level = "high";

  if (yomSource !== "official") {
    level = "medium";
    notes.push("ציוני המא״ה הם הערכה עצמית — הזנת ציונים רשמיים תשפר משמעותית את הדיוק.");
  }
  if (filteredRoleCount < 15) {
    level = "low";
    notes.push("הפרופיל הנוכחי מצמצם מאוד את מאגר התפקידים הרלוונטי — ייתכן שהעדפות גמישות יותר יפתחו אפשרויות נוספות.");
  }
  if (totalRoles > 0 && matchedToCatalog < totalRoles) {
    if (level === "high") level = "medium";
    notes.push("חלק מהתפקידים שהוצעו לא זוהו במאגר המאומת — התייחסו אליהם כהכוונה כללית.");
  }
  if (level === "high") {
    notes.push("הפרופיל מלא וציוני המא״ה רשמיים — ההמלצות מבוססות על נתונים מאומתים.");
  }
  return { level, notes };
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const AI_MODEL = process.env.AI_MATCH_MODEL || "gpt-4o";
const AI_TEMPERATURE = parseFloat(process.env.AI_MATCH_TEMPERATURE) || 0.2;

export async function matchRoles(req, res) {
  const userId = req.userId;
  let userEmail = "";
  let filteredRoleCount = 0;
  const startedAt = Date.now();

  try {
    const user = await User.findById(userId).select("email");
    userEmail = user?.email || "";

    const stats = await MilitaryStats.findOne({ userId });
    const preferences = await Preferences.findOne({ userId });

    const { ready, missing } = computeAiProfileMissing(stats, preferences);
    if (!ready) {
      return res.status(400).json({
        error:
          "השלימו את הפרופיל לפני שימוש ביועץ: תאריך גיוס, העדפות שירות (כיוון, מיקוד, כושר), דפ״ר, פרופיל רפואי וציוני מא״ה לכל הממדים.",
        missing,
      });
    }

    // Migrate yom hameah to 12-key format
    const yom = migrateLegacyYomHameahTo12(stats.yomHameah);

    // Pre-filter the catalog 302 → eligible candidates, then hand the AI a pool to choose from.
    const catalog = getIdfRoleCatalogParsed();
    const allRoles = catalog?.roles || [];
    const filteredRoles = preFilterRoles(allRoles, stats, preferences, yom);
    filteredRoleCount = filteredRoles.length;
    const candidatePool = filteredRoles.slice(0, CANDIDATE_POOL_SIZE);

    console.log(
      `[ai/match-roles] Pre-filtered ${allRoles.length} → ${filteredRoles.length} eligible; AI choosing from pool of ${candidatePool.length} for user ${userId}`,
    );

    const legacyQ =
      stats.yomQuestionnaire?.length > 0
        ? ` (יש גם נתון ישן של שאלון ${stats.yomQuestionnaire.length} פריטים — אם יש סתירה מול ציוני הממדים, עדיף להסתמך על ציוני הממדים)`
        : "";

    const yomSrc =
      preferences?.yomHameahSource === "official"
        ? "רשמי (מאה/מכון ממיין)"
        : preferences?.yomHameahSource === "self"
          ? "הערכה עצמית לסימולציה בלבד"
          : "לא צוין מקור";

    const yomLines = yom
      ? YOM_HAMEAH_12_KEYS.map(
          (k) => `  • ${k} (${YOM_HAMEAH_12_LABELS_HE[k] ?? k}): ${typeof yom[k] === "number" ? yom[k] : "—"}/5`
        ).join("\n")
      : "  (לא הוזנו ציוני מאה)";

    // Compute yom peaks and lows for the AI to focus on
    const yomSorted = yom
      ? YOM_HAMEAH_12_KEYS
          .map(k => ({ key: k, label: YOM_HAMEAH_12_LABELS_HE[k] ?? k, score: yom[k] }))
          .filter(d => typeof d.score === "number")
          .sort((a, b) => b.score - a.score)
      : [];
    const topDims = yomSorted.filter(d => d.score >= 4).slice(0, 5);
    const lowDims = yomSorted.filter(d => d.score <= 2);

    const strengthsLine = topDims.length
      ? `חוזקות בולטות: ${topDims.map(d => `${d.label} (${d.score})`).join(", ")}`
      : "אין ציונים בולטים גבוהים";
    const weaknessLine = lowDims.length
      ? `ממדים נמוכים: ${lowDims.map(d => `${d.label} (${d.score})`).join(", ")}`
      : "אין ציונים בולטים נמוכים";

    const poolLines = candidatePool
      .map((r, i) => `${i + 1}. ${r.roleTitle}`)
      .join("\n");

    const userPrompt = `ענה לפי כללי המערכת (JSON בלבד, טקסטים בעברית).

החזר אובייקט JSON עם מפתח יחיד "roles" — מערך של עד ${MATCH_ROLE_COUNT} תפקידים, מהמתאים ביותר לפחות מתאים.

## מאגר מועמדים — בחרו ודרגו

לפניכם ${candidatePool.length} תפקידים שעברו סינון ראשוני. בחרו מתוכם את התפקידים שבאמת מתאימים למועמד הזה ודרגו אותם. מותר (ועדיף) לא לכלול תפקידים שלא תואמים את החוזקות וההעדפות — גם אם הם יוקרתיים או סלקטיביים. השתמשו אך ורק ב-roleTitle מהרשימה; אל תמציאו תפקידים.

${poolLines}

## הנחיות חשיבה

1. מה הדפ״ר (${stats.daparScore}) מאפשר ומגביל?
2. מה הפרופיל הרפואי (${stats.medicalProfile}) מאפשר?
3. חוזקות במא״ה: ${strengthsLine}
4. ממדים נמוכים: ${weaknessLine} — הימנעו מתפקידים שנשענים בעיקר על הממדים האלה.
5. העדפות: ${preferences?.combatPreference || "—"} (קרביות), ${preferences?.focus || "—"} (מיקוד), ${preferences?.physicalActivityLevel || "—"} (כושר)

## חובה בכל description

(1) ציטוט דפ״ר ${stats.daparScore} והשפעתו.
(2) ציטוט פרופיל רפואי ${stats.medicalProfile} וזכאות.
(3) ממד מא״ה ספציפי שמתאים.
(4) משפט על יומיום בתפקיד.

matchPercentage: ההערכה שלכם להתאמה — יורד מהחזק לחלש. טווחים: 85-95 (מצוין), 72-84 (חזק), 58-71 (סביר).

## פרופיל מועמד

- דפ"ר: ${stats.daparScore}
- פרופיל רפואי: ${stats.medicalProfile}
- מקור ציוני מאה: ${yomSrc}
- ציוני מאה (כל 12 ממדים):
${yomLines}${legacyQ}
- ${strengthsLine}
- ${weaknessLine}
- העדפת קרביות: ${preferences?.combatPreference || "לא הוגדר"}
- מערכת שבוע: ${preferences?.schedule || "כללי"}
- מיקוד: ${preferences?.focus || "כללי"}
- מיקום: ${preferences?.location || "כל מקום"}
- פעילות גופנית: ${preferences?.physicalActivityLevel || "לא צוין"}

החזירו את התפקידים המתאימים ביותר מתוך המאגר — roleTitle זהה לרשומה במאגר, מדורגים מהחזק לחלש, טקסטים בעברית.`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(candidatePool) },
        { role: "user", content: userPrompt },
      ],
      temperature: AI_TEMPERATURE,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    });

    const durationMs = Date.now() - startedAt;
    const usage = completion.usage ?? {};
    const modelUsed = completion.model || AI_MODEL;
    const promptTokens = usage.prompt_tokens ?? 0;
    const completionTokens = usage.completion_tokens ?? 0;
    const totalTokens = usage.total_tokens ?? promptTokens + completionTokens;

    const choice = completion.choices[0];
    const content = choice?.message?.content?.trim() ?? "";
    const finishReason = choice?.finish_reason ?? null;

    if (finishReason === "length") {
      console.warn("[ai/match-roles] finish_reason=length (possible truncation)");
    }

    const roles = parseRolesArray(content);

    if (!Array.isArray(roles) || roles.length === 0) {
      console.error("[ai/match-roles] Unparseable or empty roles. Raw (first 400 chars):", content.slice(0, 400));
      await recordAiUsage({
        userId,
        userEmail,
        endpoint: "match-roles",
        model: modelUsed,
        promptTokens,
        completionTokens,
        totalTokens,
        durationMs,
        status: "parse_error",
        finishReason,
        openaiRequestId: completion.id ?? null,
        filteredRoleCount,
        promptVersion: MATCH_PROMPT_VERSION,
        errorMessage: "Unparseable or empty roles",
      });
      return res.status(502).json({
        error: "AI returned invalid response format. Please try again.",
      });
    }

    await recordAiUsage({
      userId,
      userEmail,
      endpoint: "match-roles",
      model: modelUsed,
      promptTokens,
      completionTokens,
      totalTokens,
      durationMs,
      status: "success",
      finishReason,
      openaiRequestId: completion.id ?? null,
      filteredRoleCount,
      promptVersion: MATCH_PROMPT_VERSION,
    });

    // AI selected + ranked from the candidate pool; validate titles against real roles.
    const normalized = reconcileAiSelectedRoles(candidatePool, roles, MATCH_ROLE_COUNT);
    const matchedToCatalog = normalized.length;

    const { level: confidence, notes: confidenceNotes } = computeMatchConfidence({
      yomSource: preferences?.yomHameahSource,
      filteredRoleCount,
      matchedToCatalog,
      totalRoles: normalized.length,
    });

    let historyId = null;
    let generatedAt = new Date().toISOString();
    try {
      const saved = await MatchHistory.create({
        userId,
        topRole: normalized[0]?.roleTitle || "",
        topMatch: normalized[0]?.matchPercentage ?? null,
        confidence,
        confidenceNotes,
        roles: normalized,
        profileSnapshot: {
          daparScore: stats.daparScore,
          medicalProfile: stats.medicalProfile,
          combatPreference: preferences?.combatPreference ?? null,
          focus: preferences?.focus ?? null,
          physicalActivityLevel: preferences?.physicalActivityLevel ?? null,
          yomHameahSource: preferences?.yomHameahSource ?? null,
        },
        promptVersion: MATCH_PROMPT_VERSION,
        model: modelUsed,
      });
      historyId = String(saved._id);
      generatedAt = saved.createdAt.toISOString();
      void trimUserMatchHistory(userId);
    } catch (saveErr) {
      // History persistence must never block returning results to the user.
      console.error("[ai/match-roles] history save failed:", saveErr);
    }

    res.json({ roles: normalized, confidence, confidenceNotes, historyId, generatedAt });
  } catch (err) {
    await recordAiUsage({
      userId,
      userEmail,
      endpoint: "match-roles",
      model: AI_MODEL,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      durationMs: Date.now() - startedAt,
      status: "api_error",
      filteredRoleCount,
      promptVersion: MATCH_PROMPT_VERSION,
      errorMessage: err?.message || "Unknown error",
    });
    if (err?.status === 401) {
      return res.status(503).json({ error: "OpenAI API key is invalid or missing." });
    }
    const mapped = mapOpenAiError(err);
    if (mapped) {
      return res.status(mapped.status).json({ error: mapped.error, code: mapped.code });
    }
    console.error("[ai/match-roles]", err);
    res.status(500).json({ error: err.message });
  }
}
