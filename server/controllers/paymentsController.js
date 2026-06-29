import User from "../models/User.js";
import Payment from "../models/Payment.js";
import { PRODUCTS, getProduct, publicProduct, CURRENCY } from "../config/products.js";
import { applyGrant, getEntitlementForUserId } from "../utils/entitlements.js";
import { getPaymentProvider, isMockActive, activeProviderId } from "../services/payments/index.js";

function frontendBase() {
  return (process.env.FRONTEND_URL || "http://localhost:8080/").trim();
}

function apiBaseFromReq(req) {
  return `${req.protocol}://${req.get("host")}`;
}

/** GET /api/payments/products — public. Lists what's for sale + which provider is live. */
export function listProducts(_req, res) {
  res.json({
    products: PRODUCTS.map(publicProduct),
    currency: CURRENCY,
    provider: activeProviderId(),
    testMode: isMockActive(),
  });
}

/** GET /api/payments/entitlement — auth. What the current user can do right now. */
export async function getEntitlement(req, res) {
  try {
    const entitlement = await getEntitlementForUserId(req.userId);
    res.json({ entitlement });
  } catch (err) {
    console.error("[payments/entitlement]", err);
    res.status(500).json({ error: err.message });
  }
}

/** POST /api/payments/checkout — auth. Creates a pending order and returns a checkout URL. */
export async function createCheckout(req, res) {
  try {
    const product = getProduct(req.body?.productId);
    if (!product) {
      return res.status(400).json({ error: "מוצר לא קיים", code: "UNKNOWN_PRODUCT" });
    }

    const user = await User.findById(req.userId).select("email");
    const provider = getPaymentProvider();

    const payment = await Payment.create({
      userId: req.userId,
      userEmail: user?.email || "",
      productId: product.id,
      provider: provider.id,
      amountAgorot: product.priceAgorot,
      currency: CURRENCY,
      status: "pending",
    });

    const { checkoutUrl, providerRef } = await provider.createCheckout({
      payment,
      product,
      user,
      frontendUrl: frontendBase(),
      apiUrl: apiBaseFromReq(req),
    });

    if (providerRef) {
      payment.providerRef = providerRef;
      await payment.save();
    }

    res.json({ checkoutUrl, orderId: String(payment._id), testMode: isMockActive() });
  } catch (err) {
    console.error("[payments/checkout]", err);
    res.status(500).json({ error: err.message || "שגיאה ביצירת תשלום" });
  }
}

/**
 * Idempotently mark a payment paid and apply its grant. Safe to call more than once —
 * the grant only happens on the first transition to paid.
 */
async function settlePayment(payment, raw) {
  if (payment.status === "paid" && payment.granted) return payment;

  const product = getProduct(payment.productId);
  if (!product) throw new Error(`Payment ${payment._id} references unknown product ${payment.productId}`);

  // Atomic claim: only the first writer flips granted false→true.
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, granted: { $ne: true } },
    { $set: { status: "paid", granted: true, raw: raw ?? payment.raw } },
    { new: true }
  );

  if (claimed) {
    await applyGrant(claimed.userId, product);
    return claimed;
  }
  return payment;
}

/** POST /api/payments/webhook — public, called by the processor. */
export async function paymentWebhook(req, res) {
  try {
    const provider = getPaymentProvider();
    const result = await provider.verifyWebhook(req);
    if (!result?.valid) {
      return res.status(400).json({ error: "invalid webhook" });
    }

    const payment = await Payment.findById(result.paymentId);
    if (!payment) return res.status(404).json({ error: "unknown payment" });

    if (result.providerRef && !payment.providerRef) {
      payment.providerRef = result.providerRef;
    }

    if (result.paid) {
      await settlePayment(payment, result.raw);
    } else {
      payment.status = "failed";
      payment.raw = result.raw ?? payment.raw;
      await payment.save();
    }

    // Processors expect a quick 200 ack.
    res.json({ ok: true });
  } catch (err) {
    console.error("[payments/webhook]", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/payments/mock/confirm — auth, TEST MODE ONLY.
 * Simulates a successful payment so the full flow is testable without a real processor.
 */
export async function mockConfirm(req, res) {
  if (!isMockActive()) {
    return res.status(403).json({ error: "Mock confirmation is disabled (real provider active)." });
  }
  try {
    const payment = await Payment.findOne({
      _id: req.body?.orderId,
      userId: req.userId,
    });
    if (!payment) return res.status(404).json({ error: "הזמנה לא נמצאה" });

    await settlePayment(payment, { mock: true, confirmedAt: new Date().toISOString() });
    const entitlement = await getEntitlementForUserId(req.userId);
    res.json({ ok: true, entitlement });
  } catch (err) {
    console.error("[payments/mock-confirm]", err);
    res.status(500).json({ error: err.message });
  }
}
