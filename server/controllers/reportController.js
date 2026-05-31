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
import ReportHistory from "../models/ReportHistory.js";
import { trimUserReportHistory } from "./reportHistoryController.js";
import { generateReportPdf } from "../utils/reportPdf.js";
import { buildReportHtml } from "../utils/reportHtml.js";
import { SITE_NAME_HE } from "../utils/brand.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const REPORT_MODEL = process.env.AI_REPORT_MODEL || "gpt-4o";
const REPORT_TEMPERATURE = parseFloat(process.env.AI_REPORT_TEMPERATURE) || 0.25;

export async function generateReport(req, res) {
  const userId = req.userId;
  let userEmail = "";
  let filteredRoleCount = 0;
  const startedAt = Date.now();

  try {
    const user = await User.findById(userId).select("email preferredName");
    userEmail = user?.email || "";
    const userName = user?.preferredName?.trim() || userEmail.split("@")[0] || "משתמש";

    const stats = await MilitaryStats.findOne({ userId });
    const preferences = await Preferences.findOne({ userId });

    const { ready, missing } = computeAiProfileMissing(stats, preferences);
    if (!ready) {
      return res.status(400).json({
        error: "השלימו את הפרופיל לפני יצירת דוח מלא.",
        missing,
      });
    }

    const fitness = req.body.fitness || {};
    const run3km = fitness.run3km || null;
    const pullUps = fitness.pullUps ?? null;
    const pushUps = fitness.pushUps ?? null;
    const sitUps = fitness.sitUps ?? null;
    const motivation = fitness.motivation || "";
    const interests = fitness.interests || "";
    const languages = fitness.languages || "";
    const notes = fitness.notes || "";

    const yom = migrateLegacyYomHameahTo12(stats.yomHameah);

    const catalog = getIdfRoleCatalogParsed();
    const allRoles = catalog?.roles || [];
    const filteredRoles = preFilterRoles(allRoles, stats, preferences, yom);
    filteredRoleCount = filteredRoles.length;

    const yomSrc =
      preferences?.yomHameahSource === "official"
        ? "רשמי (מאה/מכון ממיין)"
        : preferences?.yomHameahSource === "self"
          ? "הערכה עצמית"
          : "לא צוין";

    const yomLines = yom
      ? YOM_HAMEAH_12_KEYS.map(
          (k) => `  • ${k} (${YOM_HAMEAH_12_LABELS_HE[k] ?? k}): ${typeof yom[k] === "number" ? yom[k] : "—"}/5`
        ).join("\n")
      : "  (לא הוזנו)";

    const yomSorted = yom
      ? YOM_HAMEAH_12_KEYS
          .map((k) => ({ key: k, label: YOM_HAMEAH_12_LABELS_HE[k] ?? k, score: yom[k] }))
          .filter((d) => typeof d.score === "number")
          .sort((a, b) => b.score - a.score)
      : [];
    const topDims = yomSorted.filter((d) => d.score >= 4).slice(0, 5);
    const lowDims = yomSorted.filter((d) => d.score <= 2);
    const strengthsLine = topDims.length
      ? topDims.map((d) => `${d.label} (${d.score})`).join(", ")
      : "אין ציונים בולטים גבוהים";
    const weaknessLine = lowDims.length
      ? lowDims.map((d) => `${d.label} (${d.score})`).join(", ")
      : "אין ציונים בולטים נמוכים";

    const fitnessSection = [
      run3km ? `ריצת 3 ק"מ: ${run3km}` : null,
      pullUps != null ? `מתח: ${pullUps}` : null,
      pushUps != null ? `שכיבות סמיכה: ${pushUps}` : null,
      sitUps != null ? `כפיפות בטן: ${sitUps}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const systemPrompt = `אתה יועץ שירות צבאי מקצועי ומנוסה של ${SITE_NAME_HE}. אתה מכיר לעומק את כל תפקידי צה"ל, החמ"שים (חודשי שירות), הדרישות, המיונים, ומסלולי הקבע.

המשימה שלך: להפיק דוח כיוון אישי מקיף ופרסונלי ביותר, על בסיס כל המידע שמסר המועמד.

## חובה: התאמה אישית מירבית

- אם המועמד ציין תפקידים שמעניינים אותו — התייחס אליהם ישירות! תגיד אם מתאימים או לא ולמה.
- אם ציין פחדים — התייחס ותן טיפים מעשיים.
- אם ציין חלומות — חבר אותם לתפקידים קונקרטיים.
- אם ציין העדפת חמ"ש — כבד את זה ובחר תפקידים שמתאימים לטווח הזה.
- אם ציין קרבה לבית — בחר בסיסים/תפקידים שמתאימים גיאוגרפית.
- שים דגש על "למה זה מתאים לך ספציפית" ולא הסברים גנריים.
- ציין חמ"ש (אורך שירות) לכל תפקיד.
- ציין בסיס/מיקום לכל תפקיד.

## מבנה JSON

החזר JSON עם המבנה הבא:
{
  "direction": "string — הכיוון הכללי: קרבי/מודיעין/טכנולוגיה/הדרכה/לוגיסטיקה/רפואי/תקשורת/סייבר וכו'",
  "directionExplanation": "string — 3-4 משפטים למה זה הכיוון הנכון, עם אזכור ספציפי של מה שהמועמד סיפר",
  "strengths": ["string — 4-6 חוזקות מרכזיות — מבוסס גם על מה שהמועמד אמר על עצמו"],
  "weaknesses": ["string — 2-4 נקודות חלשות — בכנות אבל בכבוד"],
  "improvementTips": ["string — 5-7 טיפים מעשיים וקונקרטיים: ספר/פודקאסט/ערוץ/תרגול/קורס ספציפי"],
  "interviewTips": ["string — 4-5 טיפים לגיבוש/מיון/ראיון — ספציפיים לכיוון שנבחר"],
  "roles": [
    {
      "roleTitle": "string",
      "matchPercentage": number,
      "summary": "string — משפט אחד תמציתי",
      "description": "string — 4-6 משפטים: (1) מה עושים ביומיום (2) למה מתאים לך ספציפית (3) דפ״ר/רפואי (4) ממד מא״ה",
      "tags": ["string — עד 5 תגיות"],
      "fitReason": "string — משפט אחד מנוסח אישית: 'אתה מתאים כי...'",
      "riskNote": "string — סיכון/חסם אם קיים, ריק אם אין",
      "serviceLength": "string — חמ\"ש משוער (12/16/21/32 חודשים)",
      "location": "string — בסיס/אזור גיאוגרפי"
    }
  ],
  "rolesTheyAskedAbout": "string — אם המועמד ציין תפקידים שמעניינים: תגובה ישירה אליהם — האם מתאימים? למה כן/לא? חלופות?",
  "fearResponse": "string — אם המועמד ציין פחדים: מענה אישי ומרגיע עם טיפים מעשיים",
  "parentSummary": "string — 4-5 משפטים להורים: הכיוון, למה מתאים, מה הילד/ה יצא/תצא עם, אורך שירות צפוי"
}

## כללים
- roles: בדיוק 10 תפקידים, מסודרים מההתאמה הגבוהה ביותר לנמוכה
- הכל בעברית. אל תשתמש ב-em dashes
- matchPercentage: 85-95 = מצוין, 72-84 = חזק, 58-71 = סביר
- roleTitle מתוך הקטלוג המצורף — לא להמציא שמות
- description חייב להיות אישי! לא גנרי. ציין דפ״ר, רפואי, ממד מא״ה, ויומיום
- improvementTips — ספציפיים (שם של ספר, ערוץ יוטיוב, אתר, תרגול קונקרטי)
- interviewTips — ספציפיים לסוג המיון של הכיוון הנבחר
- rolesTheyAskedAbout / fearResponse — ריקים אם לא סופק מידע רלוונטי`;

    const personalInfoLines = [];
    if (motivation) personalInfoLines.push(`מוטיבציה ומה מניע אותי: ${motivation}`);
    if (interests) personalInfoLines.push(`תחביבים ותחומי עניין: ${interests}`);
    if (languages) personalInfoLines.push(`שפות: ${languages}`);
    if (notes) personalInfoLines.push(notes);

    const userPrompt = `## פרופיל מועמד

שם: ${userName}
דפ"ר: ${stats.daparScore}
פרופיל רפואי: ${stats.medicalProfile}
מקור ציוני מאה: ${yomSrc}
ציוני מאה (12 ממדים):
${yomLines}
חוזקות מא"ה: ${strengthsLine}
חולשות מא"ה: ${weaknessLine}
העדפת קרביות: ${preferences?.combatPreference || "לא הוגדר"}
מערכת שבוע: ${preferences?.schedule || "כללי"}
מיקוד: ${preferences?.focus || "כללי"}
מיקום: ${preferences?.location || "כל מקום"}
רמת כושר (העדפה): ${preferences?.physicalActivityLevel || "לא צוין"}
${fitnessSection ? `נתוני כושר בפועל: ${fitnessSection}` : ""}

## מידע אישי מורחב מהמועמד

${personalInfoLines.length ? personalInfoLines.join("\n") : "(לא סופק מידע נוסף)"}

## קטלוג תפקידים מסונן (${filteredRoles.length} תפקידים)

${JSON.stringify(
  filteredRoles.map((r) => ({
    roleTitle: r.roleTitle,
    category: r.category,
    combat: r.combat,
    minDapar: r.minDapar,
    minMedical: r.minMedical,
    tags: r.tags?.slice(0, 4),
    aiRecommendationHint: r.aiRecommendationHint,
  })),
  null,
  0
)}

## משימה

הפק דוח כיוון אישי מקיף ומותאם אישית (JSON בלבד).
- 10 תפקידים מדורגים
- כיוון כללי מומלץ + הסבר אישי
- חוזקות וחולשות (מבוסס על כל מה שסיפר + נתונים)
- טיפים מעשיים (ספציפיים!)
- תגובה לתפקידים שציין ולפחדים שציין
- סיכום להורים`;

    const completion = await openai.chat.completions.create({
      model: REPORT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: REPORT_TEMPERATURE,
      max_tokens: 12000,
      response_format: { type: "json_object" },
    });

    const durationMs = Date.now() - startedAt;
    const usage = completion.usage ?? {};
    const modelUsed = completion.model || REPORT_MODEL;
    const promptTokens = usage.prompt_tokens ?? 0;
    const completionTokens = usage.completion_tokens ?? 0;
    const totalTokens = usage.total_tokens ?? promptTokens + completionTokens;

    const choice = completion.choices[0];
    const raw = choice?.message?.content?.trim() ?? "";
    const finishReason = choice?.finish_reason ?? null;

    let report;
    try {
      report = JSON.parse(raw);
    } catch {
      await recordAiUsage({
        userId,
        userEmail,
        endpoint: "full-report",
        model: modelUsed,
        promptTokens,
        completionTokens,
        totalTokens,
        durationMs,
        status: "parse_error",
        finishReason,
        openaiRequestId: completion.id ?? null,
        filteredRoleCount,
        errorMessage: "JSON parse failed",
      });
      return res.status(502).json({ error: "AI returned invalid format. Try again." });
    }

    await recordAiUsage({
      userId,
      userEmail,
      endpoint: "full-report",
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

    if (Array.isArray(report.roles)) {
      report.roles.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
    }

    const top = report.roles?.[0];
    const saved = await ReportHistory.create({
      userId,
      userName,
      direction: String(report.direction || "").slice(0, 200),
      topRole: String(top?.roleTitle || "").slice(0, 200),
      topMatch: top?.matchPercentage ?? null,
      report,
    });
    void trimUserReportHistory(userId);

    res.json({
      report,
      userName,
      generatedAt: saved.createdAt.toISOString(),
      historyId: String(saved._id),
    });
  } catch (err) {
    await recordAiUsage({
      userId,
      userEmail,
      endpoint: "full-report",
      model: REPORT_MODEL,
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
    console.error("[ai/full-report]", err);
    res.status(500).json({ error: err.message });
  }
}

export async function downloadReportPdf(req, res) {
  try {
    const { report, userName } = req.body;
    const name = userName || "משתמש";
    const format = req.query.format || "pdf";

    if (format === "html") {
      const html = buildReportHtml(report, name);
      res.set({
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="kachkivun-report.html"`,
      });
      return res.send(html);
    }

    const pdfBuffer = await generateReportPdf(report, name);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kachkivun-report.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (err) {
    console.error("[report/pdf]", err);
    res.status(500).json({ error: err.message });
  }
}
