/**
 * Grow / Meshulam (משולם) adapter — Israeli processor with שקלים, Bit, and automatic
 * חשבונית. Uses the "Light" server API.
 *
 * ── BEFORE GOING LIVE you must (in server/.env or Render):
 *   GROW_ENV=prod                 # "prod" (secure.meshulam.co.il) or "test" (sandbox)
 *   GROW_PAGE_CODE=...            # "קוד עמוד" from the Grow dashboard
 *   GROW_USER_ID=...              # "מזהה משתמש" (API user id)
 *   GROW_API_KEY=...              # API key / secret used to sign + verify callbacks
 *
 * Two things still need YOUR account to finish/harden (marked TODO below):
 *   1. The exact field names Grow expects can vary by account tier — confirm against
 *      your dashboard's API docs.
 *   2. Callback verification MUST be hardened (re-query the transaction or verify the
 *      signature) before trusting a "paid" webhook in production.
 */
const ENDPOINTS = {
  prod: "https://secure.meshulam.co.il/api/light/server/1.0",
  test: "https://sandbox.meshulam.co.il/api/light/server/1.0",
};

function cfg() {
  const env = (process.env.GROW_ENV || "test").toLowerCase() === "prod" ? "prod" : "test";
  return {
    base: ENDPOINTS[env],
    pageCode: process.env.GROW_PAGE_CODE || "",
    userId: process.env.GROW_USER_ID || "",
    apiKey: process.env.GROW_API_KEY || "",
  };
}

export const growProvider = {
  id: "grow",

  isConfigured() {
    const c = cfg();
    return Boolean(c.pageCode && c.userId && c.apiKey);
  },

  async createCheckout({ payment, product, frontendUrl, apiUrl }) {
    const c = cfg();
    if (!this.isConfigured()) {
      throw new Error("Grow is not configured — set GROW_PAGE_CODE / GROW_USER_ID / GROW_API_KEY.");
    }

    const successUrl = new URL("/checkout", frontendUrl);
    successUrl.searchParams.set("orderId", String(payment._id));
    successUrl.searchParams.set("provider", "grow");

    const cancelUrl = new URL("/pricing", frontendUrl);
    cancelUrl.searchParams.set("canceled", "1");

    // Server-to-server callback (Grow posts the final status here).
    const notifyUrl = new URL("/api/payments/webhook", apiUrl).toString();

    const body = new URLSearchParams({
      pageCode: c.pageCode,
      userId: c.userId,
      apiKey: c.apiKey,
      sum: (payment.amountAgorot / 100).toFixed(2), // Grow expects shekels, not agorot
      description: product.nameHe,
      paymentNum: "1",
      maxPaymentNum: "1",
      successUrl: successUrl.toString(),
      cancelUrl: cancelUrl.toString(),
      notifyUrl,
      // Round-trips back to us on the callback so we can match the Payment row.
      cField1: String(payment._id),
    });

    const res = await fetch(`${c.base}/createPaymentProcess`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = await res.json().catch(() => ({}));

    // Grow returns { status: 1, data: { url, processId, processToken } } on success.
    if (json?.status !== 1 || !json?.data?.url) {
      throw new Error(`Grow createPaymentProcess failed: ${JSON.stringify(json).slice(0, 300)}`);
    }

    return {
      checkoutUrl: json.data.url,
      providerRef: json.data.processId ? String(json.data.processId) : null,
    };
  },

  /**
   * Parse + verify the server-to-server callback. Returns the Payment id (from cField1)
   * and whether the charge succeeded.
   *
   * TODO(harden): before trusting `valid: true` in production, re-query the transaction
   * via getPaymentProcessInfo (processId + processToken) or verify the request signature.
   * Until then this only runs end-to-end against the sandbox.
   */
  async verifyWebhook(req) {
    const data = req.body || {};
    const paymentId = data.cField1 || data.customFields?.cField1 || null;
    const statusOk = String(data.status ?? data.transactionTypeId ?? "") !== "0" && !data.error;

    if (!paymentId) return { valid: false };

    return {
      valid: true,
      paymentId: String(paymentId),
      paid: Boolean(statusOk),
      providerRef: data.processId ? String(data.processId) : null,
      raw: data,
    };
  },
};
