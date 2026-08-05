import { logSecurityEvent } from "../utils/securityLog.js";

/**
 * Production-only: reject requests whose Host is not in ALLOWED_HOSTS.
 * Stops casual hits to *.onrender.com / raw IPs when DNS only advertises api.kachkivun.com.
 *
 * Set e.g. ALLOWED_HOSTS=api.kachkivun.com
 */
export function hostAllowlist(req, res, next) {
  if (process.env.NODE_ENV !== "production") return next();

  const allowed = (process.env.ALLOWED_HOSTS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return next();

  const host = String(req.hostname || "")
    .trim()
    .toLowerCase();
  if (allowed.includes(host)) return next();

  logSecurityEvent("host_rejected", req, {
    statusCode: 404,
    message: `host=${host || "(empty)"}`,
  });
  return res.status(404).json({ error: "Not found" });
}
