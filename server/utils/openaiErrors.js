/**
 * Maps OpenAI SDK errors to user-facing Hebrew messages and HTTP status codes.
 * Keeps raw English in server logs only — never expose billing URLs to end users.
 */

/**
 * @param {unknown} err
 * @returns {{ status: number; error: string; code?: string } | null}
 */
export function mapOpenAiError(err) {
  const status = err && typeof err === "object" && "status" in err ? Number(err.status) : 0;
  const code =
    err && typeof err === "object" && "code" in err && typeof err.code === "string"
      ? err.code
      : err && typeof err === "object" && err.error && typeof err.error === "object" && "code" in err.error
        ? String(err.error.code)
        : "";

  if (status === 401) {
    return {
      status: 503,
      code: "OPENAI_AUTH",
      error: "מפתח OpenAI לא תקין או חסר. פנו למנהל המערכת.",
    };
  }

  if (status === 429 && (code === "insufficient_quota" || code === "billing_hard_limit_reached")) {
    return {
      status: 503,
      code: "OPENAI_QUOTA",
      error:
        "מכסת OpenAI נגמרה — יש להוסיף אשראי או לעדכן חיוב בחשבון OpenAI. פיצ'רי ה-AI (התאמת תפקידים, דוח מוכנות) לא זמינים עד לפתרון.",
    };
  }

  if (status === 429) {
    return {
      status: 503,
      code: "OPENAI_RATE_LIMIT",
      error: "OpenAI עמוס כרגע. נסו שוב בעוד דקה.",
    };
  }

  if (status === 503 || status === 502) {
    return {
      status: 503,
      code: "OPENAI_UNAVAILABLE",
      error: "שירות OpenAI לא זמין כרגע. נסו שוב מאוחר יותר.",
    };
  }

  return null;
}
