import { parsePagination } from "../utils/sanitize.js";

export function validateReportHistoryListQuery(req) {
  const page = parsePagination(req.query, { defaultLimit: 20, maxLimit: 50 });
  if (!page.ok) return page;

  req.query = {
    ...req.query,
    limit: String(page.value.limit),
    skip: String(page.value.skip),
  };
  return { ok: true };
}
