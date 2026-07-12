import jwt from "jsonwebtoken";
import { logSecurityEvent } from "../utils/securityLog.js";

export function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.split(" ")[1]; // "Bearer <token>"

  if (!token || token.length > 4096) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    // Expired tokens are normal churn (refresh flow); anything else means the
    // token was tampered with or signed with the wrong key.
    if (err?.name !== "TokenExpiredError") {
      logSecurityEvent("invalid_token", req, {
        statusCode: 401,
        message: err?.message,
      });
    }
    return res
      .status(401)
      .json({ error: "Invalid or expired token", code: "ACCESS_TOKEN_INVALID" });
  }
}
