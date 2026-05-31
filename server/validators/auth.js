import { parseAuthIntent, parseEmail, parseOtpCode, requirePlainObject } from "../utils/sanitize.js";

function validateAuthBody(req, { requireCode = false } = {}) {
  const bodyResult = requirePlainObject(req.body, "body");
  if (!bodyResult.ok) return bodyResult;

  const allowed = requireCode ? ["email", "intent", "code"] : ["email", "intent"];
  for (const key of Object.keys(bodyResult.value)) {
    if (!allowed.includes(key)) {
      return { ok: false, error: `Unknown field: ${key}`, code: "VALIDATION_ERROR" };
    }
  }

  const emailResult = parseEmail(bodyResult.value.email);
  if (!emailResult.ok) return emailResult;

  const intentResult = parseAuthIntent(bodyResult.value.intent);
  if (!intentResult.ok) return intentResult;

  const sanitized = { email: emailResult.value, intent: intentResult.value };

  if (requireCode) {
    const codeResult = parseOtpCode(bodyResult.value.code);
    if (!codeResult.ok) return codeResult;
    sanitized.code = codeResult.value;
  }

  req.body = sanitized;
  return { ok: true };
}

export function validateRequestOtp(req) {
  return validateAuthBody(req);
}

export function validateVerifyOtp(req) {
  return validateAuthBody(req, { requireCode: true });
}
