import User from "../models/User.js";
import { logSecurityEvent } from "../utils/securityLog.js";

/** Requires authenticateToken first — sets req.adminUser when role is admin. */
export async function requireAdmin(req, res, next) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Access token required" });
    }

    const user = await User.findById(req.userId).select("email role preferredName");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.role !== "admin") {
      logSecurityEvent("admin_denied", req, {
        statusCode: 403,
        email: user.email,
        userId: user._id,
        message: "non-admin attempted admin endpoint",
      });
      return res.status(403).json({ error: "Admin access required" });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    console.error("[admin/requireAdmin]", err);
    res.status(500).json({ error: err?.message || "Server error" });
  }
}
