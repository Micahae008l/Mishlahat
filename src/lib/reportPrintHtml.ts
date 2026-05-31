import type { FullReport } from "@/lib/api";
import { SITE_NAME_HE } from "@/lib/brand";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function listItems(items: string[] | undefined): string {
  if (!items?.length) return "";
  return `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
}

export function buildReportPrintHtml(report: FullReport, userName: string): string {
  const date = new Date().toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const rolesHtml = (report.roles || [])
    .map((r, i) => {
      const meta = [r.serviceLength ? `יציאות: ${esc(r.serviceLength)}` : "", r.location ? esc(r.location) : ""]
        .filter(Boolean)
        .join(" · ");
      return `
      <article class="role-card">
        <header class="role-head">
          <span class="role-rank">${String(i + 1).padStart(2, "0")}</span>
          <h3>${esc(r.roleTitle || "")}</h3>
          <span class="role-pct">${r.matchPercentage ?? 0}%</span>
        </header>
        ${meta ? `<p class="role-meta">${meta}</p>` : ""}
        ${r.summary ? `<p class="role-summary">${esc(r.summary)}</p>` : ""}
        ${r.description ? `<p class="role-desc">${esc(r.description)}</p>` : ""}
        ${r.fitReason ? `<p class="role-fit">✓ ${esc(r.fitReason)}</p>` : ""}
        ${r.riskNote ? `<p class="role-risk">⚠ ${esc(r.riskNote)}</p>` : ""}
        ${
          r.tags?.length
            ? `<div class="tags">${r.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>`
            : ""
        }
      </article>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${esc(SITE_NAME_HE)} — דוח כיוון אישי</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Heebo", system-ui, sans-serif;
      background: #f4f1ea;
      color: #1a1a1a;
      line-height: 1.55;
      font-size: 11pt;
    }
    .page {
      max-width: 210mm;
      margin: 0 auto;
      padding: 14mm 16mm 18mm;
      background: #fff;
    }
    @media print {
      body { background: #fff; }
      .page { padding: 10mm 12mm; max-width: none; }
      .no-print { display: none !important; }
      .role-card { break-inside: avoid; }
      h2 { break-after: avoid; }
    }
    .brand { font-size: 22pt; font-weight: 800; color: #6b7c52; }
    .subtitle { font-size: 14pt; font-weight: 700; margin-top: 4px; }
    .meta { font-size: 9.5pt; color: #666; margin-top: 8px; }
    hr { border: none; border-top: 1px solid #d8ddd0; margin: 16px 0; }
    h2 {
      font-size: 11pt;
      font-weight: 700;
      color: #6b7c52;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 8px;
    }
    .direction-box {
      background: linear-gradient(135deg, #f4f6ef 0%, #e8ece0 100%);
      border: 1px solid #b8c4a4;
      border-radius: 6px;
      padding: 14px 16px;
      margin-bottom: 16px;
    }
    .direction-title { font-size: 16pt; font-weight: 800; color: #6b7c52; }
    .direction-desc { margin-top: 6px; color: #444; }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .card {
      border: 1px solid #d8ddd0;
      border-radius: 6px;
      padding: 12px 14px;
      background: #fafaf8;
    }
    .card h2 { margin-bottom: 6px; }
    ul { padding-right: 1.2em; }
    li { margin-bottom: 4px; }
    .callout {
      border-right: 3px solid #6b7c52;
      padding: 10px 14px;
      background: #f4f6ef;
      margin-bottom: 12px;
      border-radius: 0 6px 6px 0;
    }
    .callout p { color: #333; }
    .role-card {
      border: 1px solid #d8ddd0;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .role-head {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      flex-direction: row-reverse;
      justify-content: flex-end;
    }
    .role-rank {
      font-size: 9pt;
      font-weight: 700;
      color: #6b7c52;
      font-family: monospace;
    }
    .role-head h3 { flex: 1; font-size: 12pt; font-weight: 700; text-align: right; }
    .role-pct {
      background: #e2e8d4;
      color: #4a5638;
      font-weight: 800;
      font-size: 10pt;
      padding: 2px 8px;
      border-radius: 4px;
      white-space: nowrap;
    }
    .role-meta { font-size: 9pt; color: #777; margin-top: 6px; }
    .role-summary { font-size: 10pt; color: #555; margin-top: 4px; }
    .role-desc { font-size: 10pt; margin-top: 8px; color: #333; }
    .role-fit { font-size: 9.5pt; color: #5a6844; margin-top: 6px; font-weight: 600; }
    .role-risk { font-size: 9.5pt; color: #8b2500; margin-top: 4px; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; justify-content: flex-start; }
    .tags span {
      font-size: 8pt;
      background: #eee;
      padding: 2px 8px;
      border-radius: 3px;
      color: #555;
    }
    .parent-box {
      border: 1px solid #b8c4a4;
      background: #f4f6ef;
      border-radius: 6px;
      padding: 14px 16px;
      margin-top: 16px;
    }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #d8ddd0;
      font-size: 8.5pt;
      color: #888;
      text-align: center;
    }
    .print-hint.no-print {
      text-align: center;
      padding: 12px;
      background: #1a1a1a;
      color: #fff;
      font-size: 10pt;
    }
    .print-hint button {
      margin-top: 8px;
      padding: 8px 20px;
      background: #6b7c52;
      color: #fff;
      border: none;
      border-radius: 4px;
      font-family: inherit;
      font-weight: 700;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <p class="print-hint no-print">לשמירה כ-PDF: לחצו «הדפסה» ובחרו «שמור כ-PDF»</p>
  <p class="print-hint no-print"><button type="button" onclick="window.print()">הדפסה / שמירה כ-PDF</button></p>
  <div class="page">
    <header>
      <div class="brand">${esc(SITE_NAME_HE)}</div>
      <div class="subtitle">דוח כיוון אישי</div>
      <p class="meta">שם: ${esc(userName)} · תאריך: ${esc(date)}</p>
    </header>
    <hr />
    <section class="direction-box">
      <p class="direction-title">הכיוון שלך: ${esc(report.direction || "")}</p>
      <p class="direction-desc">${esc(report.directionExplanation || "")}</p>
    </section>
    <div class="grid-2">
      <div class="card">
        <h2>חוזקות</h2>
        ${listItems(report.strengths)}
      </div>
      <div class="card">
        <h2>לשיפור</h2>
        ${listItems(report.weaknesses)}
      </div>
    </div>
    ${
      report.improvementTips?.length
        ? `<section class="card" style="margin-bottom:12px"><h2>טיפים מעשיים</h2>${listItems(report.improvementTips)}</section>`
        : ""
    }
    ${
      report.interviewTips?.length
        ? `<section class="card" style="margin-bottom:12px"><h2>טיפים לראיונות</h2>${listItems(report.interviewTips)}</section>`
        : ""
    }
    ${
      report.rolesTheyAskedAbout
        ? `<section class="callout"><h2>לגבי התפקידים שציינתם</h2><p>${esc(report.rolesTheyAskedAbout)}</p></section>`
        : ""
    }
    ${
      report.fearResponse
        ? `<section class="callout"><h2>לגבי החששות</h2><p>${esc(report.fearResponse)}</p></section>`
        : ""
    }
    <h2 style="margin-top:8px;margin-bottom:12px">10 תפקידים מומלצים</h2>
    ${rolesHtml}
    ${
      report.parentSummary
        ? `<section class="parent-box"><h2>סיכום להורים</h2><p style="margin-top:8px">${esc(report.parentSummary)}</p></section>`
        : ""
    }
    <p class="footer">
      דוח זה נוצר על ידי ${esc(SITE_NAME_HE)}. מבוסס על נתונים שהוזנו — אינו המלצה רשמית של צה״ל.
    </p>
  </div>
  <script>window.addEventListener("load", () => { setTimeout(() => window.print(), 400); });</script>
</body>
</html>`;
}

export function openReportPrintWindow(report: FullReport, userName: string): void {
  const html = buildReportPrintHtml(report, userName);
  const w = window.open("", "_blank");
  if (!w) {
    throw new Error("חסמו חלון קופץ — אפשרו חלונות קופצים לאתר");
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
