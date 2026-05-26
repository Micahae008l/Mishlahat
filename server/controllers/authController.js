import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import MilitaryStats from "../models/MilitaryStats.js";
import Preferences from "../models/Preferences.js";
import EmailOtp from "../models/EmailOtp.js";
import { computeAiProfileMissing } from "../utils/profileAiReady.js";
import { applyUserPatch, applyStatsPatch, applyPreferencesPatch } from "../utils/profileApply.js";
import { sendOtpEmail } from "../utils/email.js";

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_SECONDS = 45;

function bootstrapAdminEmail() {
  return (process.env.ADMIN_EMAIL || "mike.haddad.08@gmail.com").trim().toLowerCase();
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

function createOtpCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

async function ensureUserScaffold(userId) {
  await MilitaryStats.findOneAndUpdate({ userId }, { $setOnInsert: { userId } }, { upsert: true, new: true });
  await Preferences.findOneAndUpdate({ userId }, { $setOnInsert: { userId } }, { upsert: true, new: true });
}

const SIGNUP_ACCOUNT_EXISTS_MSG =
  "כבר יש חשבון עם האימייל הזה. השתמשו בדף הכניסה במקום הרשמה.";

function parseAuthIntent(body) {
  const raw = String(body?.intent || "login").trim().toLowerCase();
  return raw === "signup" ? "signup" : "login";
}

/** True when signup must be denied — existing user with a complete profile. */
async function existingUserBlocksSignup(email) {
  const user = await User.findOne({ email }).select("_id preferredName");
  if (!user) return false;

  const stats = await MilitaryStats.findOne({ userId: user._id });
  const preferences = await Preferences.findOne({ userId: user._id });
  const preferred = String(user.preferredName || "").trim();
  const { ready: profileFieldsReady } = computeAiProfileMissing(stats, preferences);
  return preferred.length > 0 && profileFieldsReady;
}

function rejectSignupExistingAccount(res) {
  return res.status(409).json({
    error: SIGNUP_ACCOUNT_EXISTS_MSG,
    code: "ACCOUNT_EXISTS",
    redirect: "login",
  });
}

function buildStatsFromProfile(profile) {
  const stats = {};
  if (profile.draftDate !== undefined) stats.draftDate = profile.draftDate;
  if (profile.dischargeDate !== undefined) stats.dischargeDate = profile.dischargeDate;
  if (profile.serviceStartDate !== undefined) stats.serviceStartDate = profile.serviceStartDate;
  if (profile.serviceEndDate !== undefined) stats.serviceEndDate = profile.serviceEndDate;
  if (profile.daparScore !== undefined) stats.daparScore = profile.daparScore;
  if (profile.medicalProfile !== undefined) stats.medicalProfile = profile.medicalProfile;
  if (profile.yomHameah !== undefined) stats.yomHameah = profile.yomHameah;
  if (Array.isArray(profile.yomQuestionnaire) && profile.yomQuestionnaire.length > 0) {
    stats.yomQuestionnaire = profile.yomQuestionnaire;
  }
  return stats;
}

export async function register(req, res) {
  return res.status(410).json({ error: "הרשמה עם סיסמה הוחלפה בכניסה עם קוד חד־פעמי." });
}

export async function login(req, res) {
  return res.status(410).json({ error: "כניסה עם סיסמה הוחלפה בכניסה עם קוד חד־פעמי." });
}

export async function getSession(req, res) {
  try {
    const user = await User.findById(req.userId).select("email role preferredName status");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      userId: String(user._id),
      email: user.email,
      role: user.role || "user",
      preferredName: user.preferredName || "",
      status: user.status,
    });
  } catch (err) {
    console.error("[auth/me]", err);
    res.status(500).json({ error: err?.message || "Server error" });
  }
}

export async function requestOtp(req, res) {
  try {
    const email = normalizeEmail(req.body?.email);
    const intent = parseAuthIntent(req.body);

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "נא להזין אימייל תקין" });
    }

    if (intent === "signup" && (await existingUserBlocksSignup(email))) {
      return rejectSignupExistingAccount(res);
    }

    const recent = await EmailOtp.findOne({
      email,
      purpose: "login",
      consumedAt: null,
      createdAt: { $gt: new Date(Date.now() - OTP_RESEND_SECONDS * 1000) },
    }).sort({ createdAt: -1 });
    if (recent) {
      return res.status(429).json({ error: `אפשר לשלוח קוד חדש בעוד ${OTP_RESEND_SECONDS} שניות` });
    }

    const code = createOtpCode();
    const codeHash = await bcrypt.hash(code, 12);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await EmailOtp.updateMany({ email, purpose: "login", consumedAt: null }, { $set: { consumedAt: new Date() } });
    const otpDoc = new EmailOtp({
      email,
      codeHash,
      purpose: "login",
      expiresAt,
    });
    await otpDoc.save();

    let delivery;
    try {
      delivery = await sendOtpEmail(email, code);
    } catch (sendErr) {
      console.error("[auth/request-otp] send mail failed:", sendErr);
      await otpDoc.deleteOne();
      return res.status(502).json({
        error:
          "לא הצלחנו לשלוח את האימייל. בדקו את הגדרת ה-SMTP (למשל Gmail: סיסמת אפליקציה, כתובת שולח תואמת ל-SMTP_USER) או נסו שוב.",
      });
    }

    res.json({
      message: "קוד נשלח לאימייל",
      expiresInSeconds: OTP_TTL_MINUTES * 60,
      delivery: delivery.delivered ? "email" : "console",
      devCode: process.env.NODE_ENV === "production" ? undefined : delivery.devCode,
    });
  } catch (err) {
    console.error("[auth/request-otp]", err);
    res.status(500).json({ error: err?.message || "Server error" });
  }
}

export async function verifyOtp(req, res) {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || "").replace(/\D/g, "");
    const intent = parseAuthIntent(req.body);

    if (!email || !email.includes("@") || code.length !== 6) {
      return res.status(400).json({ error: "אימייל או קוד לא תקינים" });
    }

    if (intent === "signup" && (await existingUserBlocksSignup(email))) {
      return rejectSignupExistingAccount(res);
    }

    const otp = await EmailOtp.findOne({
      email,
      purpose: "login",
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otp) {
      return res.status(400).json({ error: "הקוד פג תוקף או לא נמצא. שלחו קוד חדש." });
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      otp.consumedAt = new Date();
      await otp.save();
      return res.status(429).json({ error: "יותר מדי ניסיונות. שלחו קוד חדש." });
    }

    const valid = await bcrypt.compare(code, otp.codeHash);
    if (!valid) {
      otp.attempts += 1;
      await otp.save();
      return res.status(401).json({ error: "קוד שגוי" });
    }

    otp.consumedAt = new Date();
    await otp.save();

    const setFields = { emailVerifiedAt: new Date() };
    if (email === bootstrapAdminEmail()) {
      setFields.role = "admin";
    }

    const user = await User.findOneAndUpdate(
      { email },
      { $setOnInsert: { email }, $set: setFields },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await ensureUserScaffold(user._id);

    const stats = await MilitaryStats.findOne({ userId: user._id });
    const preferences = await Preferences.findOne({ userId: user._id });
    const preferred = String(user.preferredName || "").trim();
    const { ready: profileFieldsReady } = computeAiProfileMissing(stats, preferences);
    const profileComplete = preferred.length > 0 && profileFieldsReady;

    res.json({
      token: signToken(user._id),
      userId: user._id,
      status: user.status,
      role: user.role || "user",
      /** True until profile is complete enough for AI (same gate as match-roles). */
      isNewUser: !profileComplete,
    });
  } catch (err) {
    console.error("[auth/verify-otp]", err);
    if (err?.code === 11000) {
      return res.status(409).json({ error: "האימייל כבר בשימוש. נסו שוב." });
    }
    res.status(500).json({ error: err?.message || "Server error" });
  }
}
