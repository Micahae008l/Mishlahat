import nodemailer from "nodemailer";

let transporterPromise;
let warnedNoSmtp;

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

export async function sendOtpEmail(email, code) {
  const from = trimEnv("SMTP_FROM") || `משלחת <${trimEnv("SMTP_USER") || "no-reply@mishlahat.local"}>`;
  const transporter = await getTransporter();

  if (!transporter) {
    if (!warnedNoSmtp) {
      warnedNoSmtp = true;
      console.warn(
        "[email] אין SMTP — לא נשלח מייל. הוסיפו SMTP_HOST, SMTP_USER, SMTP_PASS ב־server/.env (ראו server/.env.example, Gmail: סיסמת אפליקציה)."
      );
    }
    console.log(`[auth/otp] dev code for ${email}: ${code}`);
    return { delivered: false, devCode: code };
  }

  await transporter.sendMail({
    from,
    to: email,
    subject: "קוד הכניסה שלך למשלחת",
    text: `קוד הכניסה שלך למשלחת הוא: ${code}\n\nהקוד תקף ל-10 דקות.`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>קוד הכניסה שלך למשלחת</h2>
        <p>הזינו את הקוד הבא כדי להמשיך:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:0.2em">${code}</p>
        <p>הקוד תקף ל-10 דקות.</p>
      </div>
    `,
  });

  return { delivered: true };
}
