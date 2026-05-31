import { assertWithinTokenCap } from "../utils/tokenCap.js";

/** Blocks AI routes when the user has exhausted their lifetime token cap. */
export async function enforceTokenCap(req, res, next) {
  try {
    const result = await assertWithinTokenCap(req.userId);
    if (!result.ok) {
      return res.status(429).json({
        error: result.message,
        code: "TOKEN_CAP_EXCEEDED",
        used: result.used,
        cap: result.cap,
        remaining: result.remaining,
      });
    }
    req.tokenCapStatus = result;
    next();
  } catch (err) {
    console.error("[enforceTokenCap]", err);
    res.status(500).json({ error: err.message });
  }
}
