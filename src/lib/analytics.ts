/**
 * Privacy-friendly analytics — Plausible or custom.
 *
 * Set VITE_PLAUSIBLE_DOMAIN in .env to enable Plausible.
 * All events are fire-and-forget; failures are silently ignored.
 * No cookies, no PII, no third-party trackers.
 */

const PLAUSIBLE_DOMAIN = (import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined)?.trim();
const PLAUSIBLE_API = (import.meta.env.VITE_PLAUSIBLE_API as string | undefined)?.trim() || "https://plausible.io/api/event";

type EventProps = Record<string, string | number | boolean>;

/**
 * Track a custom event.
 * If Plausible is configured, sends via their API.
 * Otherwise logs to console in development.
 */
export function trackEvent(name: string, props?: EventProps) {
  if (PLAUSIBLE_DOMAIN) {
    // Use Plausible's events API
    try {
      const w = window as typeof window & { plausible?: (name: string, opts?: { props?: EventProps }) => void };
      if (w.plausible) {
        w.plausible(name, props ? { props } : undefined);
      } else {
        // Fallback: direct API call if script hasn't loaded
        fetch(PLAUSIBLE_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            url: window.location.href,
            domain: PLAUSIBLE_DOMAIN,
            props,
          }),
        }).catch(() => {});
      }
    } catch {
      // Silently fail
    }
    return;
  }

  // Development: log to console
  if (import.meta.env.DEV) {
    console.log(`[analytics] ${name}`, props ?? "");
  }
}

/**
 * Plausible script tag attributes for the root document.
 * Returns null if not configured.
 */
export function getPlausibleScriptUrl(): string | null {
  if (!PLAUSIBLE_DOMAIN) return null;
  const base = PLAUSIBLE_API.replace("/api/event", "");
  return `${base}/js/script.js`;
}

export function getPlausibleDomain(): string | null {
  return PLAUSIBLE_DOMAIN ?? null;
}

// ── Predefined events ──────────────────────────────────────────────────────

export function trackSignupStep(step: number, total: number) {
  trackEvent("signup_step", { step, total });
}

export function trackSignupComplete() {
  trackEvent("signup_complete");
}

export function trackAiMatch() {
  trackEvent("ai_match_run");
}

export function trackReportGenerate() {
  trackEvent("report_generate");
}

export function trackReviewSubmit(roleSlug: string) {
  trackEvent("review_submit", { role: roleSlug });
}

export function trackShare(method: string) {
  trackEvent("share", { method });
}

export function trackError(message: string, source?: string) {
  trackEvent("client_error", { message: message.slice(0, 200), source: source ?? "unknown" });
}
