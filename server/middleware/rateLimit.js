import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** All /api routes — generous default so normal app use is unaffected. */
export const apiLimiter = rateLimit({
  windowMs: parsePositiveInt(process.env.API_RATE_LIMIT_WINDOW_MS, FIFTEEN_MINUTES_MS),
  max: parsePositiveInt(process.env.API_RATE_LIMIT_MAX, 100),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET" && (req.path === "/health" || req.originalUrl === "/api/health"),
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      error: "יותר מדי בקשות. נסו שוב בעוד כמה דקות.",
      code: "RATE_LIMIT_API",
    });
  },
});

/** Login / OTP / registration — 5 attempts per 15 minutes per IP. */
export const authLimiter = rateLimit({
  windowMs: parsePositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, FIFTEEN_MINUTES_MS),
  max: parsePositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 5),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      error: "יותר מדי ניסיונות כניסה. נסו שוב בעוד 15 דקות.",
      code: "RATE_LIMIT_AUTH",
    });
  },
});

function emailKey(req) {
  const email = (req.body?.email || "").trim().toLowerCase();
  // ipKeyGenerator normalizes IPv6 so users can't rotate within a /64 to bypass limits
  return email || ipKeyGenerator(req.ip);
}

/** OTP request — max 5 sends per email per 15 minutes. */
export const otpRequestLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  max: 5,
  keyGenerator: emailKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "שלחתם יותר מדי קודים לכתובת הזו. נסו שוב בעוד 15 דקות.",
      code: "RATE_LIMIT_OTP_REQUEST",
    });
  },
});

/** OTP verify — max 10 attempts per email per 15 minutes (prevents brute-force). */
export const otpVerifyLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  max: 10,
  keyGenerator: emailKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "יותר מדי ניסיונות אימות. נסו שוב בעוד 15 דקות.",
      code: "RATE_LIMIT_OTP_VERIFY",
    });
  },
});
