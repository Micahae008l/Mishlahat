import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import { SITE_NAME_HE } from "./brand.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_REG = path.join(__dirname, "../fonts/NotoSansHebrew-Regular.ttf");
const FONT_BOLD = path.join(__dirname, "../fonts/NotoSansHebrew-Bold.ttf");

const MARGIN = 50;
const CONTENT_W = 495;

const COLORS = {
  text: "#1a1a1a",
  muted: "#555555",
  accent: "#6b7c52",
  line: "#d8ddd0",
  cardBg: "#f4f6ef",
  risk: "#8b2500",
};

function fontsAvailable() {
  return fs.existsSync(FONT_REG) && fs.existsSync(FONT_BOLD);
}

function registerFonts(doc) {
  if (!fontsAvailable()) {
    throw new Error("Hebrew fonts missing in server/fonts. Run npm install in server/ or redeploy.");
  }
  doc.registerFont("he", FONT_REG);
  doc.registerFont("he-bold", FONT_BOLD);
  return { reg: "he", bold: "he-bold" };
}

function pageBottom(doc) {
  return doc.page.height - MARGIN;
}

function ensureSpace(doc, needed) {
  if (doc.y + needed > pageBottom(doc)) {
    doc.addPage();
  }
}

function writeRtl(doc, fonts, text, { bold = false, size = 10, color = COLORS.text, gap = 4 } = {}) {
  if (!text?.trim()) return;
  doc.font(bold ? fonts.bold : fonts.reg).fontSize(size).fillColor(color);
  doc.text(text.trim(), MARGIN, doc.y, {
    width: CONTENT_W,
    align: "right",
    lineGap: 2,
  });
  doc.moveDown(gap / 10);
}

function sectionHeading(doc, fonts, title) {
  ensureSpace(doc, 40);
  doc.moveDown(0.5);
  writeRtl(doc, fonts, title, { bold: true, size: 12, color: COLORS.accent, gap: 2 });
}

function bulletList(doc, fonts, items) {
  for (const item of items || []) {
    ensureSpace(doc, 28);
    writeRtl(doc, fonts, `• ${item}`, { size: 10, gap: 2 });
  }
}

export async function generateReportPdf(report, userName) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: MARGIN,
        info: {
          Title: `${SITE_NAME_HE} — דוח כיוון אישי`,
          Author: SITE_NAME_HE,
        },
      });

      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const fonts = registerFonts(doc);
      const dateStr = new Date().toLocaleDateString("he-IL");

      writeRtl(doc, fonts, SITE_NAME_HE, { bold: true, size: 22, color: COLORS.accent, gap: 1 });
      writeRtl(doc, fonts, "דוח כיוון אישי", { bold: true, size: 15, gap: 1 });
      writeRtl(doc, fonts, `שם: ${userName}  ·  ${dateStr}`, { size: 9, color: COLORS.muted, gap: 3 });

      doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + CONTENT_W, doc.y).strokeColor(COLORS.line).stroke();
      doc.moveDown(0.8);

      writeRtl(doc, fonts, `הכיוון שלך: ${report.direction || ""}`, {
        bold: true,
        size: 14,
        color: COLORS.accent,
        gap: 1,
      });
      writeRtl(doc, fonts, report.directionExplanation || "", { size: 10, color: COLORS.muted, gap: 3 });

      if (report.strengths?.length) {
        sectionHeading(doc, fonts, "חוזקות");
        bulletList(doc, fonts, report.strengths);
      }
      if (report.weaknesses?.length) {
        sectionHeading(doc, fonts, "נקודות לשיפור");
        bulletList(doc, fonts, report.weaknesses);
      }
      if (report.improvementTips?.length) {
        sectionHeading(doc, fonts, "טיפים מעשיים");
        bulletList(doc, fonts, report.improvementTips);
      }
      if (report.interviewTips?.length) {
        sectionHeading(doc, fonts, "טיפים לראיונות ומיון");
        bulletList(doc, fonts, report.interviewTips);
      }
      if (report.rolesTheyAskedAbout) {
        sectionHeading(doc, fonts, "לגבי התפקידים שציינתם");
        writeRtl(doc, fonts, report.rolesTheyAskedAbout, { size: 10, gap: 2 });
      }
      if (report.fearResponse) {
        sectionHeading(doc, fonts, "לגבי החששות");
        writeRtl(doc, fonts, report.fearResponse, { size: 10, gap: 2 });
      }

      sectionHeading(doc, fonts, "10 תפקידים מומלצים");

      for (let i = 0; i < (report.roles || []).length; i++) {
        const r = report.roles[i];
        ensureSpace(doc, 75);
        writeRtl(doc, fonts, `${String(i + 1).padStart(2, "0")}  ${r.roleTitle || ""}  (${r.matchPercentage || 0}%)`, {
          bold: true,
          size: 11,
          gap: 1,
        });
        const meta = [r.serviceLength ? `יציאות: ${r.serviceLength}` : null, r.location ? r.location : null]
          .filter(Boolean)
          .join("  · ");
        if (meta) writeRtl(doc, fonts, meta, { size: 8, color: COLORS.muted, gap: 1 });
        if (r.summary) writeRtl(doc, fonts, r.summary, { size: 9, color: COLORS.muted, gap: 1 });
        if (r.description) writeRtl(doc, fonts, r.description, { size: 9, gap: 1 });
        if (r.fitReason) writeRtl(doc, fonts, `מתאים כי: ${r.fitReason}`, { size: 9, color: COLORS.accent, gap: 1 });
        if (r.riskNote) writeRtl(doc, fonts, `שימו לב: ${r.riskNote}`, { size: 9, color: COLORS.risk, gap: 1 });
        doc.moveDown(0.3);
      }

      if (report.parentSummary) {
        sectionHeading(doc, fonts, "סיכום להורים");
        writeRtl(doc, fonts, report.parentSummary, { size: 10, gap: 2 });
      }

      doc.moveDown(1);
      writeRtl(doc, fonts, `דוח זה נוצר על ידי ${SITE_NAME_HE}. אינו המלצה רשמית של צה״ל.`, {
        size: 8,
        color: COLORS.muted,
        gap: 0,
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
