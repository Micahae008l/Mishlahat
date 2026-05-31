import jwt from "jsonwebtoken";

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
  } catch {
    return res
      .status(401)
      .json({ error: "Invalid or expired token", code: "ACCESS_TOKEN_INVALID" });
  }
}
