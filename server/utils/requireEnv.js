function trimEnv(name) {
  return String(process.env[name] || "").trim();
}

/** Exit if required vars are missing (always enforced). */
export function requireEnv(names) {
  const missing = names.filter((name) => !trimEnv(name));
  if (missing.length === 0) return;
  console.error(`[api] FATAL: missing required env: ${missing.join(", ")}`);
  process.exit(1);
}

/** In production, require vars needed for a secure public deploy. */
export function requireProductionEnv() {
  if (process.env.NODE_ENV !== "production") return;

  requireEnv(["JWT_SECRET", "MONGODB_URI", "OPENAI_API_KEY"]);

  if (!trimEnv("FRONTEND_URL") && !trimEnv("ALLOWED_ORIGINS")) {
    console.error("[api] FATAL: set FRONTEND_URL or ALLOWED_ORIGINS in production.");
    process.exit(1);
  }
}
