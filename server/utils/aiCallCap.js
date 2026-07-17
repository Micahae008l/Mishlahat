import mongoose from "mongoose";
import User from "../models/User.js";
import AiUsageLog from "../models/AiUsageLog.js";

const DEFAULT_CALL_CAP = 5;

/** Lifetime AI-call cap from env (AI_CALL_CAP); falls back to 5. 0 = block all, negative/invalid = default. */
export function getDefaultCallCap() {
  const raw = process.env.AI_CALL_CAP;
  if (raw == null || String(raw).trim() === "") return DEFAULT_CALL_CAP;
  const n = Number.parseInt(String(raw).trim(), 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_CALL_CAP;
}

/** Effective cap for a user: null = unlimited. Admins are always unlimited. */
export function resolveCallCap(user) {
  if (user?.role === "admin") return null;
  return getDefaultCallCap();
}

/** Count successful match-roles runs only (the user-visible "free uses"). Reports use token cap separately. */
export async function getUserCallCount(userId) {
  const oid = new mongoose.Types.ObjectId(String(userId));
  const n = await AiUsageLog.countDocuments({
    userId: oid,
    status: "success",
    endpoint: "match-roles",
  });
  return Math.max(0, Number(n) || 0);
}

/**
 * @returns {{ used: number, cap: number | null, remaining: number | null, unlimited: boolean, capped: boolean }}
 */
export function buildCallCapStatus(used, cap) {
  const normalizedUsed = Math.max(0, Number(used) || 0);
  if (cap == null) {
    return { used: normalizedUsed, cap: null, remaining: null, unlimited: true, capped: false };
  }
  const normalizedCap = Math.max(0, Math.floor(cap));
  const remaining = Math.max(0, normalizedCap - normalizedUsed);
  return {
    used: normalizedUsed,
    cap: normalizedCap,
    remaining,
    unlimited: false,
    capped: normalizedUsed >= normalizedCap,
  };
}

export async function getCallCapStatusForUserId(userId) {
  const user = await User.findById(userId).select("role").lean();
  const used = await getUserCallCount(userId);
  const cap = resolveCallCap(user);
  return buildCallCapStatus(used, cap);
}

export async function assertWithinCallCap(userId) {
  const status = await getCallCapStatusForUserId(userId);
  if (!status.capped) {
    return { ok: true, ...status };
  }
  return {
    ok: false,
    ...status,
    message: `השתמשתם בכל ${status.cap} השימושים החינמיים ביועץ ה-AI. בקרוב יתאפשר לפתוח שימושים נוספים.`,
  };
}
