/**
 * Test-mode payment provider. NEVER use in production — it grants entitlements
 * without taking real money (see the production guard in index.js).
 *
 * createCheckout returns a URL to the app's /checkout page with provider=mock, where
 * the user clicks "simulate successful payment" → POST /api/payments/mock/confirm.
 */
export const mockProvider = {
  id: "mock",

  async createCheckout({ payment, frontendUrl }) {
    const url = new URL("/checkout", frontendUrl);
    url.searchParams.set("orderId", String(payment._id));
    url.searchParams.set("provider", "mock");
    return { checkoutUrl: url.toString() };
  },

  /** Mock has no server-to-server webhook; confirmation goes through mock/confirm. */
  async verifyWebhook() {
    return { valid: false };
  },
};
