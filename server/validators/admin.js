import mongoose from "mongoose";
import { fail, parseEnum, parsePagination, parseSearchQuery, requirePlainObject } from "../utils/sanitize.js";

export function validateAdminUsersQuery(req) {
  const qResult = parseSearchQuery(req.query?.q);
  if (!qResult.ok) return qResult;

  const page = parsePagination(req.query, { defaultLimit: 50, maxLimit: 100 });
  if (!page.ok) return page;

  req.query = {
    ...req.query,
    q: qResult.value,
    limit: String(page.value.limit),
    skip: String(page.value.skip),
  };
  return { ok: true };
}

export function validateAdminUserTokenCap(req) {
  const id = String(req.params?.id || "");
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return fail("Invalid user id");
  }

  const bodyResult = requirePlainObject(req.body, "body");
  if (!bodyResult.ok) return bodyResult;

  const allowed = ["tokenCap"];
  for (const key of Object.keys(bodyResult.value)) {
    if (!allowed.includes(key)) return fail(`Unknown field: ${key}`);
  }

  if (!("tokenCap" in bodyResult.value)) {
    return fail("tokenCap is required");
  }

  const raw = bodyResult.value.tokenCap;
  let tokenCap = null;
  if (raw !== null) {
    if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 0) {
      return fail("tokenCap must be a non-negative integer or null");
    }
    tokenCap = raw;
  }

  req.params = { ...req.params, id };
  req.body = { tokenCap };
  return { ok: true };
}

export function validateAdminUserRole(req) {
  const id = String(req.params?.id || "");
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return fail("Invalid user id");
  }

  const bodyResult = requirePlainObject(req.body, "body");
  if (!bodyResult.ok) return bodyResult;

  const allowed = ["role"];
  for (const key of Object.keys(bodyResult.value)) {
    if (!allowed.includes(key)) return fail(`Unknown field: ${key}`);
  }

  const roleResult = parseEnum(bodyResult.value.role, ["user", "admin"], { label: "role" });
  if (!roleResult.ok) return roleResult;

  req.params = { ...req.params, id };
  req.body = { role: roleResult.value };
  return { ok: true };
}

export function validateObjectIdParam(paramName = "id") {
  return (req) => {
    const id = String(req.params?.[paramName] || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(`Invalid ${paramName}`);
    }
    return { ok: true };
  };
}
