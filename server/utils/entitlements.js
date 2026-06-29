import User from "../models/User.js";

/**
 * Single source of truth for "what can this user do right now".
 * Admins bypass every gate. A "pro" plan is only active while planExpiresAt is in the future.
 */
export function resolveEntitlement(user) {
  const isAdmin = user?.role === "admin";
  const planActive =
    user?.plan === "pro" && user?.planExpiresAt && new Date(user.planExpiresAt) > new Date();
  const reportCredits = Math.max(0, Number(user?.reportCredits) || 0);

  return {
    isAdmin,
    plan: planActive ? "pro" : "free",
    planActive: Boolean(planActive),
    planExpiresAt: planActive ? new Date(user.planExpiresAt).toISOString() : null,
    reportCredits,
    // Can generate a paid full report without paying again right now?
    canGenerateReport: isAdmin || Boolean(planActive) || reportCredits > 0,
  };
}

export async function getEntitlementForUserId(userId) {
  const user = await User.findById(userId)
    .select("role plan planExpiresAt reportCredits")
    .lean();
  return resolveEntitlement(user);
}

/**
 * Atomically reserve one report credit. Returns true if a credit was consumed.
 * Used only for non-admin / non-pro users — call resolveEntitlement first.
 */
export async function consumeReportCredit(userId) {
  const updated = await User.findOneAndUpdate(
    { _id: userId, reportCredits: { $gt: 0 } },
    { $inc: { reportCredits: -1 } },
    { new: true }
  )
    .select("reportCredits")
    .lean();
  return Boolean(updated);
}

/** Give a consumed credit back (e.g. the AI call failed after we reserved it). */
export async function refundReportCredit(userId) {
  await User.updateOne({ _id: userId }, { $inc: { reportCredits: 1 } });
}

/**
 * Apply a product's grant to a user. Subscriptions extend from the later of now or
 * the current expiry, so stacking months adds up instead of overwriting.
 */
export async function applyGrant(userId, product) {
  const grant = product?.grant || {};
  const update = {};

  if (grant.reportCredits) {
    update.$inc = { reportCredits: grant.reportCredits };
  }

  if (grant.planDays) {
    const user = await User.findById(userId).select("plan planExpiresAt").lean();
    const base =
      user?.plan === "pro" && user?.planExpiresAt && new Date(user.planExpiresAt) > new Date()
        ? new Date(user.planExpiresAt)
        : new Date();
    base.setDate(base.getDate() + grant.planDays);
    update.$set = { plan: "pro", planExpiresAt: base };
  }

  if (Object.keys(update).length === 0) return;
  await User.updateOne({ _id: userId }, update);
}
