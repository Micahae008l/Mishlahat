import BlockedIp from "../models/BlockedIp.js";
import { getClientIp, logSecurityEvent } from "../utils/securityLog.js";

const CACHE_TTL_MS = 30 * 1000;

let blockedSet = new Set();
let lastRefreshAt = 0;
let refreshing = null;

/** Reload the blocked-IP cache from MongoDB. Safe to call before connect. */
export async function refreshBlockedIpCache() {
  if (refreshing) return refreshing;
  refreshing = BlockedIp.find()
    .select("ip")
    .lean()
    .then((rows) => {
      blockedSet = new Set(rows.map((r) => r.ip));
      lastRefreshAt = Date.now();
    })
    .catch((err) => {
      console.error("[security/ipBlock] cache refresh failed:", err?.message);
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/**
 * Rejects requests from blocked IPs with 403. Lookup is an in-memory Set so
 * the hot path stays cheap; the cache refreshes in the background every 30s.
 */
export function ipBlockGuard(req, res, next) {
  if (Date.now() - lastRefreshAt > CACHE_TTL_MS) {
    void refreshBlockedIpCache();
  }

  const ip = getClientIp(req);
  if (!ip || !blockedSet.has(ip)) return next();

  logSecurityEvent("blocked_ip_hit", req, { statusCode: 403 });
  BlockedIp.updateOne(
    { ip },
    { $inc: { hitCount: 1 }, $set: { lastHitAt: new Date() } }
  ).catch(() => {});

  return res.status(403).json({
    error: "הגישה נחסמה",
    code: "IP_BLOCKED",
  });
}
