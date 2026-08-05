/** Safe 500 response — log the real error, never send it to the client. */
export function sendServerError(res, err, label = "[server]") {
  console.error(label, err);
  if (res.headersSent) return;
  return res.status(500).json({
    error: "שגיאת שרת. נסו שוב מאוחר יותר.",
    code: "SERVER_ERROR",
  });
}
