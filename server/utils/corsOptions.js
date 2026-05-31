/**
 * Production: set ALLOWED_ORIGINS (comma-separated) or FRONTEND_URL (single origin).
 * Dev: leave unset → reflect any origin (same as cors() default).
 */
export function corsOptions() {
  const fromList =
    process.env.ALLOWED_ORIGINS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const single = process.env.FRONTEND_URL?.trim();
  const origins = fromList.length > 0 ? fromList : single ? [single] : [];

  if (origins.length === 0) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[cors] ALLOWED_ORIGINS / FRONTEND_URL not set — API accepts all origins. Set your app origin in production.",
      );
    }
    return {
      origin: true,
      credentials: true,
    };
  }

  return {
    origin: origins,
    credentials: true,
  };
}
