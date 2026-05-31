import { LIMITS } from "../utils/sanitize.js";

/** Reject absurdly long URLs before routing. */
export function rejectOversizedUrl(req, res, next) {
  const len = (req.originalUrl || req.url || "").length;
  if (len > LIMITS.QUERY_STRING_MAX) {
    return res.status(414).json({
      error: "כתובת הבקשה ארוכה מדי",
      code: "URI_TOO_LONG",
    });
  }
  next();
}

/** JSON parse / body size errors from express.json */
export function jsonErrorHandler(err, req, res, next) {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      error: "גוף הבקשה גדול מדי",
      code: "PAYLOAD_TOO_LARGE",
    });
  }
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "JSON לא תקין",
      code: "INVALID_JSON",
    });
  }
  next(err);
}
