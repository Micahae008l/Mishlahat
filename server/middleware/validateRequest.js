/**
 * @param {(req: import("express").Request) => { ok: true } | { ok: false, status?: number, error: string, code?: string }} validator
 */
export function validateRequest(validator) {
  return (req, res, next) => {
    const result = validator(req);
    if (!result.ok) {
      return res.status(result.status ?? 400).json({
        error: result.error,
        code: result.code ?? "VALIDATION_ERROR",
      });
    }
    next();
  };
}
