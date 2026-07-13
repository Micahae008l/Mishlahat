import nodemailer from "nodemailer";
import { SITE_NAME_HE } from "./brand.js";

let transporterPromise;
let warnedNoSmtp;

const OTP_TTL_MINUTES = 10;

/** Brand colors as hex — email clients ignore oklch/CSS vars. */
const C = {
  bg: "#0a0d0b",
  card: "#161a17",
  cardTop: "#1b201c",
  border: "#2b322c",
  text: "#f3f1eb",
  muted: "#9aa197",
  faint: "#6f766c",
  olive: "#7d9c55",
  oliveDark: "#5f7d43",
  codeBg: "#0c0f0d",
  codeBorder: "#3a4a2c",
  white: "#ffffff",
};

function trimEnv(name) {
  return String(process.env[name] || "").trim();
}

/** True when real SMTP send is possible (OTP will not only go to console). */
export function isSmtpConfigured() {
  return Boolean(trimEnv("SMTP_HOST") && trimEnv("SMTP_USER") && trimEnv("SMTP_PASS"));
}

function smtpReady() {
  return isSmtpConfigured();
}

async function getTransporter() {
  if (!smtpReady()) return null;
  if (!transporterPromise) {
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === "true";
    transporterPromise = nodemailer.createTransport({
      host: trimEnv("SMTP_HOST"),
      port,
      secure,
      auth: {
        user: trimEnv("SMTP_USER"),
        pass: trimEnv("SMTP_PASS"),
      },
      requireTLS: !secure && port === 587,
    });
  }
  return transporterPromise;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Build OTP HTML.
 * Note: Gmail/Outlook block JS — no real clipboard API, so there is no true
 * one-click "copy" button possible in email. The code is rendered as a single
 * continuous, user-select:all chip: one tap (desktop) / long-press (mobile)
 * selects the whole thing to copy. Digits stay continuous (letter-spacing
 * only, no separators) so pasted values need no cleanup.
 */
function buildOtpHtml({ siteName, code, ttlMinutes, appUrl }) {
  const safeName = escapeHtml(siteName);
  const safeCode = escapeHtml(String(code));
  const year = new Date().getFullYear();
  const loginHref = appUrl ? escapeHtml(appUrl.replace(/\/$/, "") + "/post-signup") : "";

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>קוד הכניסה שלך</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    קוד הכניסה שלך ל${safeName}: ${safeCode}. תקף ל־${ttlMinutes} דקות.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:${C.card};border:1px solid ${C.border};border-radius:20px;overflow:hidden;">
          <tr>
            <td style="height:3px;background:${C.olive};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:40px 32px 8px;font-family:Arial,Helvetica,sans-serif;text-align:center;" dir="rtl">
              <p style="margin:0;font-size:12px;letter-spacing:0.22em;color:${C.olive};font-weight:700;text-transform:uppercase;">
                ${safeName}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 0;font-family:Arial,Helvetica,sans-serif;color:${C.text};text-align:center;" dir="rtl">
              <h1 style="margin:0 0 10px;font-size:26px;line-height:1.3;font-weight:800;color:${C.white};">
                קוד הכניסה שלך
              </h1>
              <p style="margin:0 auto 28px;max-width:340px;font-size:15px;line-height:1.65;color:${C.muted};">
                הזינו את הקוד במסך ההתחברות כדי להמשיך.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px;" dir="rtl">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.codeBg};border:1px solid ${C.codeBorder};border-radius:16px;">
                <tr>
                  <td align="center" style="padding:26px 16px 22px;font-family:Arial,Helvetica,sans-serif;">
                    <p style="margin:0 0 14px;font-size:11px;letter-spacing:0.18em;color:${C.faint};font-weight:700;text-transform:uppercase;">
                      קוד חד־פעמי
                    </p>
                    <span style="display:inline-block;font-family:'Courier New',Consolas,monospace;font-size:40px;font-weight:700;letter-spacing:0.32em;line-height:1;color:${C.white};direction:ltr;-webkit-user-select:all;-moz-user-select:all;user-select:all;cursor:pointer;padding:12px 10px 12px 26px;border-radius:12px;background:${C.card};border:1px solid ${C.border};">${safeCode}</span>
                    <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:${C.muted};">
                      הקישו על הקוד כדי לסמן אותו, ואז העתיקו
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 32px 0;font-family:Arial,Helvetica,sans-serif;text-align:center;" dir="rtl">
              <p style="margin:0;font-size:13px;line-height:1.6;color:${C.muted};">
                ⏱ הקוד תקף ל־<span style="color:${C.text};font-weight:700;">${ttlMinutes} דקות</span>.
              </p>
            </td>
          </tr>

          ${
            loginHref
              ? `<tr>
            <td align="center" style="padding:24px 32px 4px;" dir="rtl">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="border-radius:12px;background:${C.olive};">
                    <a href="${loginHref}" style="display:inline-block;padding:14px 40px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:${C.white};text-decoration:none;border-radius:12px;">
                      חזרה להתחברות
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ""
          }

          <tr>
            <td style="padding:24px 32px 32px;font-family:Arial,Helvetica,sans-serif;text-align:center;" dir="rtl">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${C.faint};">
                לא ביקשתם קוד? אפשר להתעלם מהמייל. אל תשתפו את הקוד עם אף אחד.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid ${C.border};font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${C.faint};text-align:center;" dir="rtl">
              © ${year} ${safeName}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildOtpText({ siteName, code, ttlMinutes, appUrl }) {
  const lines = [
    `קוד הכניסה שלך ל${siteName}:`,
    "",
    code,
    "",
    `הקוד תקף ל־${ttlMinutes} דקות.`,
    "העתיקו את הקוד והדביקו במסך ההתחברות.",
    "",
    "לא ביקשתם קוד? התעלמו מהמייל.",
  ];
  if (appUrl) {
    lines.push("", `התחברות: ${appUrl.replace(/\/$/, "")}/post-signup`);
  }
  return lines.join("\n");
}

export async function sendOtpEmail(email, code) {
  const from =
    trimEnv("SMTP_FROM") || `${SITE_NAME_HE} <${trimEnv("SMTP_USER") || "no-reply@kachkivun.local"}>`;
  const transporter = await getTransporter();
  const appUrl = trimEnv("FRONTEND_URL");

  if (!transporter) {
    if (!warnedNoSmtp) {
      warnedNoSmtp = true;
      console.warn(
        "[email] אין SMTP — לא נשלח מייל. הוסיפו SMTP_HOST, SMTP_USER, SMTP_PASS ב־server/.env (ראו server/.env.example, Gmail: סיסמת אפליקציה)."
      );
    }
    if (process.env.NODE_ENV !== "production") {
      console.log(`[auth/otp] dev code for ${email}: ${code}`);
    }
    return { delivered: false };
  }

  // Code first in subject → iOS/Android notification often shows it for one-tap fill/copy
  const subject = `${code} הוא קוד הכניסה שלך ל${SITE_NAME_HE}`;
  const text = buildOtpText({
    siteName: SITE_NAME_HE,
    code,
    ttlMinutes: OTP_TTL_MINUTES,
    appUrl,
  });
  const html = buildOtpHtml({
    siteName: SITE_NAME_HE,
    code,
    ttlMinutes: OTP_TTL_MINUTES,
    appUrl,
  });

  await transporter.sendMail({
    from,
    to: email,
    subject,
    text,
    html,
  });

  return { delivered: true };
}
