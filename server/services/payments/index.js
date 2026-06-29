import { mockProvider } from "./mockProvider.js";
import { growProvider } from "./growProvider.js";

const PROVIDERS = {
  mock: mockProvider,
  grow: growProvider,
};

/** Active provider id, from env. Defaults to mock (test mode). */
export function activeProviderId() {
  return (process.env.PAYMENTS_PROVIDER || "mock").toLowerCase();
}

export function isMockActive() {
  return activeProviderId() === "mock";
}

export function getPaymentProvider() {
  const id = activeProviderId();
  const provider = PROVIDERS[id];
  if (!provider) {
    throw new Error(`Unknown PAYMENTS_PROVIDER "${id}" (expected: ${Object.keys(PROVIDERS).join(", ")}).`);
  }
  return provider;
}

/**
 * Hard guard: the mock provider hands out entitlements for free, so it must never be the
 * active provider in production. Call this at startup.
 */
export function assertPaymentsSafeForEnv() {
  if (process.env.NODE_ENV === "production" && isMockActive()) {
    console.error(
      "[payments] FATAL: PAYMENTS_PROVIDER=mock in production would grant paid features for free. Set PAYMENTS_PROVIDER=grow."
    );
    process.exit(1);
  }
}
