import mongoose from "mongoose";
import User from "../models/User.js";
import AiUsageLog from "../models/AiUsageLog.js";

/** Lifetime token cap from env; unset or invalid = unlimited default for regular users. */
export function getDefaultTokenCap() {
  const raw = process.env.DEFAULT_USER_TOKEN_CAP;
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number.parseInt(String(raw).trim(), 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Effective cap for a user document: null = unlimited. Admins are always unlimited. */
export function resolveTokenCap(user) {
  if (!user) return getDefaultTokenCap();
  if (user.role === "admin") return null;
  if (user.tokenCap != null && Number.isFinite(user.tokenCap)) {
    return Math.max(0, Math.floor(user.tokenCap));
  }
  return getDefaultTokenCap();
}

export async function getUserTokenUsage(userId) {
  const oid = new mongoose.Types.ObjectId(String(userId));
  const agg = await AiUsageLog.aggregate([
    { $match: { userId: oid } },
    { $group: { _id: null, totalTokens: { $sum: "$totalTokens" } } },
  ]);
  return Math.max(0, Number(agg[0]?.totalTokens) || 0);
}

/**
 * @returns {{ used: number, cap: number | null, remaining: number | null, unlimited: boolean, capped: boolean }}
 */
export function buildTokenCapStatus(used, cap) {
  const normalizedUsed = Math.max(0, Number(used) || 0);
  if (cap == null) {
    return {
      used: normalizedUsed,
      cap: null,
      remaining: null,
      unlimited: true,
      capped: false,
    };
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

export async function getTokenCapStatusForUserId(userId) {
  const user = await User.findById(userId).select("role tokenCap").lean();
  const used = await getUserTokenUsage(userId);
  const cap = resolveTokenCap(user);
  return buildTokenCapStatus(used, cap);
}

export async function assertWithinTokenCap(userId) {
  const status = await getTokenCapStatusForUserId(userId);
  if (!status.capped) {
    return { ok: true, ...status };
  }
  return {
    ok: false,
    ...status,
    message:
      "הגעתם למכסת הטוקנים שלכם לשימוש ביועץ AI. פנו למנהל המערכת להגדלת המכסה.",
  };
}
