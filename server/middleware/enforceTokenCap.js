import { assertWithinTokenCap } from "../utils/tokenCap.js";
import { assertWithinCallCap } from "../utils/aiCallCap.js";

/** Blocks AI routes when the user has exhausted their lifetime AI-call or token cap. */
export async function enforceTokenCap(req, res, next) {
  try {
    // Lifetime call cap (the user-visible "5 free uses") is checked first.
    const callResult = await assertWithinCallCap(req.userId);
    if (!callResult.ok) {
      return res.status(429).json({
        error: callResult.message,
        code: "AI_CALL_CAP_EXCEEDED",
        used: callResult.used,
        cap: callResult.cap,
        remaining: callResult.remaining,
      });
    }

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
    req.callCapStatus = callResult;
    next();
  } catch (err) {
    console.error("[enforceTokenCap]", err);
    res.status(500).json({ error: err.message });
  }
}
