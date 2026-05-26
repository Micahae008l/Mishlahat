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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadSystemPrompt() {
  try {
    return fs.readFileSync(path.join(__dirname, "../prompts/match-roles-system.txt"), "utf8");
  } catch {
    return `You are an expert IDF placement counselor. Respond with ONLY a valid JSON object: {"roles":[...]} with 5 role objects (roleTitle, matchPercentage, summary, description, tags). summary = one Hebrew sentence; description = 2-3 Hebrew sentences.`;
  }
}

const BASE_SYSTEM_PROMPT = loadSystemPrompt();

/**
 * Build the system prompt with an inline filtered catalog subset.
 * Much smaller than the full 302-role dump → model can reason properly.
 */
function buildSystemPrompt(filteredRoles) {
  const catalogSection = filteredRoles?.length
    ? `

---

## מאגר תפקידים מסונן (JSON — חובת עבודה)

להלן ${filteredRoles.length} תפקידי צה"ל שסוננו מראש כמתאימים פוטנציאלית לפרופיל המועמד. זהו מקור העדפתכם — בחרו מתוכו.

חובות:
- בחרו roleTitle שמופיע במדויק (או כמעט) מתוך הרשומות למטה.
- אל תמציאו תפקידים שלא ברשימה; אם חסר — השתמשו ברשומה הכי קרובה.
- שימו לב לשדות signals ו-aiRecommendationHint — הם מנחים את ההתאמה.

${JSON.stringify(filteredRoles.map(r => ({
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

    // Pre-filter the catalog from 302 → ~40 best candidates
    const catalog = getIdfRoleCatalogParsed();
    const allRoles = catalog?.roles || [];
    const filteredRoles = preFilterRoles(allRoles, stats, preferences, yom);
    filteredRoleCount = filteredRoles.length;

    console.log(`[ai/match-roles] Pre-filtered ${allRoles.length} → ${filteredRoles.length} roles for user ${userId}`);

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

    const userPrompt = `ענה לפי כללי המערכת (JSON בלבד, טקסטים בעברית).

החזר אובייקט JSON עם מפתח יחיד "roles" (מערך של 5 תפקידים), בדיוק כפי שמוגדר בהוראות המערכת.

## הנחיות חשיבה

לפני שתבחר תפקידים, חשוב שלב-אחר-שלב:

1. מה הדפ״ר (${stats.daparScore}) מאפשר ומגביל? דפ״ר גבוה (65+) פותח מסלולים טכנולוגיים, מודיעיניים וקצונה. דפ״ר נמוך יותר מכוון לתפקידי שטח, תמיכה ולוגיסטיקה.

2. מה הפרופיל הרפואי (${stats.medicalProfile}) מאפשר? 97=קרבי מלא, 82=רוב קרבי, 72=חלק מקרבי, 64=מוגבל, 45/21=עורפי בלבד.

3. מה החוזקות הבולטות במא״ה? ${strengthsLine}. התאימו תפקידים שמנצלים חוזקות אלה.

4. מה הממדים הנמוכים? ${weaknessLine}. הימנעו מתפקידים שדורשים בדיוק את הממדים הנמוכים.

5. מה ההעדפות? ${preferences?.combatPreference || "—"} (קרביות), ${preferences?.focus || "—"} (מיקוד), ${preferences?.physicalActivityLevel || "—"} (כושר). כבדו העדפות אבל ציינו בכנות אם משהו סותר.

6. סרקו את ${filteredRoles.length} התפקידים המסוננים ובחרו 5 שמתאימים הכי טוב לשילוב של כל הנ״ל. תפקיד #1 חייב להיות ההתאמה החזקה ביותר, ולאחריו סדר יורד.

## חובה בכל תיאור

בשדה description של כל תפקיד חייבים להופיע במפורש:
(1) לפחות משפט שמצטט את דפ״ר ${stats.daparScore} ומסביר מה מאפשר/מגביל.
(2) לפחות משפט שמצטט את פרופיל רפואי ${stats.medicalProfile} ומסביר זכאות.
(3) לפחות התייחסות לממד אחד ספציפי מהמא״ה שמתאים לתפקיד.
(4) הסבר קצר מה עושים ביומיום בתפקיד.

matchPercentage: סדרו מ-#1 (הגבוה ביותר) ל-#5 (הנמוך). #1 יהיה 85-95 רק אם ההתאמה מצוינת. טווחים: 85-95 (מצוין), 72-84 (חזק), 58-71 (סביר).

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

המלץ על 5 תפקידי צה"ל. שמות ותיאורים — בעברית בלבד.`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(filteredRoles) },
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
    });

    // Ensure roles are sorted by matchPercentage descending
    roles.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));

    const normalized = roles.map((r) => {
      const description = String(r.description || "").trim();
      let summary = String(r.summary || "").trim();
      if (!summary && description) {
        const first = description.split(/(?<=[.!?])\s+/)[0]?.trim();
        summary = first && first.length <= 140 ? first : `${description.slice(0, 120).trim()}…`;
      }
      return {
        roleTitle: String(r.roleTitle || "").trim(),
        matchPercentage: Math.round(Number(r.matchPercentage) || 0),
        summary,
        description,
        tags: Array.isArray(r.tags) ? r.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 6) : [],
      };
    });

    res.json({ roles: normalized });
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
      errorMessage: err?.message || "Unknown error",
    });
    if (err?.status === 401) {
      return res.status(503).json({ error: "OpenAI API key is invalid or missing." });
    }
    console.error("[ai/match-roles]", err);
    res.status(500).json({ error: err.message });
  }
}
