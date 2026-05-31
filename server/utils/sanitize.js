/** @typedef {{ ok: true, value: T }} Ok<T> */
/** @typedef {{ ok: false, error: string, code?: string }} Fail */

export const LIMITS = {
  EMAIL_MAX: 254,
  NAME_MAX: 120,
  PHONE_MAX: 20,
  OTP_CODE_LEN: 6,
  TEXT_SHORT: 500,
  TEXT_MEDIUM: 2000,
  TEXT_LONG: 8000,
  SEARCH_MAX: 100,
  YOM_QUESTIONNAIRE_MAX: 24,
  QUESTION_ID_MAX: 64,
  REPORT_ROLES_MAX: 12,
  REPORT_TAGS_MAX: 12,
  REPORT_TAG_LEN: 80,
  REPORT_STRENGTHS_MAX: 20,
  FITNESS_PULL_MAX: 999,
  JSON_BODY_MAX_DEPTH: 10,
  QUERY_STRING_MAX: 2048,
};

const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/;

/** @returns {Ok<string> | Fail} */
export function fail(error, code = "VALIDATION_ERROR") {
  return { ok: false, error, code };
}

/** @returns {Ok<T>} */
export function ok(value) {
  return { ok: true, value };
}

export function stripControlChars(str) {
  if (typeof str !== "string") return "";
  return str.replace(CONTROL_CHARS, "").trim();
}

export function isPlainObject(value, depth = 0) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  if (Object.getPrototypeOf(value) !== Object.prototype) return false;
  if (depth > LIMITS.JSON_BODY_MAX_DEPTH) return false;
  return true;
}

/** Reject prototype-pollution keys anywhere in a plain object tree. */
export function hasUnsafeKeys(value, depth = 0) {
  if (depth > LIMITS.JSON_BODY_MAX_DEPTH) return true;
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) {
    return value.some((item) => hasUnsafeKeys(item, depth + 1));
  }
  if (!isPlainObject(value, depth)) return true;
  for (const key of Object.keys(value)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") return true;
    if (hasUnsafeKeys(value[key], depth + 1)) return true;
  }
  return false;
}

/** @returns {Ok<Record<string, unknown>> | Fail} */
export function requirePlainObject(value, label = "body") {
  if (value === undefined || value === null) return ok({});
  if (!isPlainObject(value)) return fail(`${label} must be a JSON object`);
  if (hasUnsafeKeys(value)) return fail("בקשה לא תקינה");
  return ok(value);
}

/** @returns {Ok<string> | Fail} */
export function parseString(value, { maxLen, minLen = 0, label = "field", allowEmpty = false } = {}) {
  if (value === undefined || value === null) {
    if (allowEmpty) return ok("");
    return fail(`${label} is required`);
  }
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    return fail(`${label} must be a string`);
  }
  const s = stripControlChars(String(value));
  if (!allowEmpty && s.length < minLen) return fail(`${label} is required`);
  if (s.length > maxLen) return fail(`${label} is too long`);
  return ok(s);
}

/** @returns {Ok<string> | Fail} */
export function parseEmail(value) {
  const parsed = parseString(value, { maxLen: LIMITS.EMAIL_MAX, minLen: 3, label: "email" });
  if (!parsed.ok) return parsed;
  const email = parsed.value.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("נא להזין אימייל תקין");
  }
  return ok(email);
}

/** @returns {Ok<string> | Fail} */
export function parseOtpCode(value) {
  const digits = String(value ?? "").replace(/[^0-9]/g, "");
  if (digits.length !== LIMITS.OTP_CODE_LEN) {
    return fail("נא להזין קוד בן 6 ספרות");
  }
  return ok(digits);
}

/** @returns {Ok<"login" | "signup"> | Fail} */
export function parseAuthIntent(value) {
  const raw = stripControlChars(String(value ?? "login")).toLowerCase();
  return ok(raw === "signup" ? "signup" : "login");
}

/** @returns {Ok<number> | Fail} */
export function parseIntInRange(value, { min, max, label = "value" }) {
  if (value === undefined || value === null || value === "") {
    return fail(`${label} is required`);
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    return fail(`${label} is invalid`);
  }
  return ok(n);
}

/** @returns {Ok<number | null> | Fail} */
export function parseOptionalIntInRange(value, { min, max, label = "value" }) {
  if (value === undefined || value === null || value === "") return ok(null);
  return parseIntInRange(value, { min, max, label });
}

/** @returns {Ok<Date | null> | Fail} */
export function parseOptionalIsoDate(value, label = "date") {
  if (value === undefined || value === null || value === "") return ok(null);
  const s = stripControlChars(String(value));
  if (s.length > 32) return fail(`${label} is invalid`);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return fail(`${label} is invalid`);
  return ok(d);
}

/** @returns {Ok<string> | Fail} */
export function parseEnum(value, allowed, { label = "value", allowEmpty = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (allowEmpty) return ok("");
    return fail(`${label} is required`);
  }
  const s = stripControlChars(String(value));
  if (!allowed.includes(s)) return fail(`${label} is invalid`);
  return ok(s);
}

/** @returns {Ok<{ limit: number, skip: number }> | Fail} */
export function parsePagination(query, { defaultLimit = 50, maxLimit = 100 } = {}) {
  const limitRaw = query?.limit;
  const skipRaw = query?.skip;

  let limit = defaultLimit;
  if (limitRaw !== undefined && limitRaw !== "") {
    const parsed = parseIntInRange(limitRaw, { min: 1, max: maxLimit, label: "limit" });
    if (!parsed.ok) return parsed;
    limit = parsed.value;
  }

  let skip = 0;
  if (skipRaw !== undefined && skipRaw !== "") {
    const parsed = parseIntInRange(skipRaw, { min: 0, max: 1_000_000, label: "skip" });
    if (!parsed.ok) return parsed;
    skip = parsed.value;
  }

  return ok({ limit, skip });
}

/** @returns {Ok<string> | Fail} */
export function parseSearchQuery(value, maxLen = LIMITS.SEARCH_MAX) {
  if (value === undefined || value === null || value === "") return ok("");
  return parseString(value, { maxLen, label: "q", allowEmpty: true });
}
