import {
  LIMITS,
  fail,
  ok,
  parseOptionalIntInRange,
  parseString,
  requirePlainObject,
} from "../utils/sanitize.js";

const REPORT_FORMATS = ["pdf", "html"];

function parseFitnessText(value, label) {
  if (value === undefined || value === null || value === "") return ok(undefined);
  const s = parseString(value, { maxLen: LIMITS.TEXT_MEDIUM, label, allowEmpty: true });
  if (!s.ok) return s;
  return ok(s.value || undefined);
}

function parseFitnessBody(fitnessRaw) {
  const fitnessResult = requirePlainObject(fitnessRaw, "fitness");
  if (!fitnessResult.ok) return fitnessResult;

  const allowed = ["run3km", "pullUps", "pushUps", "sitUps", "motivation", "interests", "languages", "notes"];
  for (const key of Object.keys(fitnessResult.value)) {
    if (!allowed.includes(key)) return fail(`Unknown fitness field: ${key}`);
  }

  const fitness = {};

  if (fitnessResult.value.run3km !== undefined) {
    const r = parseFitnessText(fitnessResult.value.run3km, "run3km");
    if (!r.ok) return r;
    fitness.run3km = r.value;
  }
  for (const numKey of ["pullUps", "pushUps", "sitUps"]) {
    if (fitnessResult.value[numKey] === undefined) continue;
    const n = parseOptionalIntInRange(fitnessResult.value[numKey], {
      min: 0,
      max: LIMITS.FITNESS_PULL_MAX,
      label: numKey,
    });
    if (!n.ok) return n;
    fitness[numKey] = n.value;
  }
  for (const textKey of ["motivation", "interests", "languages", "notes"]) {
    if (fitnessResult.value[textKey] === undefined) continue;
    const t = parseFitnessText(fitnessResult.value[textKey], textKey);
    if (!t.ok) return t;
    fitness[textKey] = t.value;
  }

  return ok(fitness);
}

function parseReportRole(roleRaw) {
  const roleResult = requirePlainObject(roleRaw, "role");
  if (!roleResult.ok) return roleResult;

  const allowed = [
    "roleTitle",
    "matchPercentage",
    "summary",
    "description",
    "tags",
    "fitReason",
    "riskNote",
    "serviceLength",
    "location",
  ];
  for (const key of Object.keys(roleResult.value)) {
    if (!allowed.includes(key)) return fail(`Unknown role field: ${key}`);
  }

  const title = parseString(roleResult.value.roleTitle, {
    maxLen: LIMITS.TEXT_SHORT,
    minLen: 1,
    label: "roleTitle",
  });
  if (!title.ok) return title;

  const match = parseOptionalIntInRange(roleResult.value.matchPercentage, {
    min: 0,
    max: 100,
    label: "matchPercentage",
  });
  if (!match.ok) return match;
  if (match.value == null) return fail("matchPercentage is required");

  const role = {
    roleTitle: title.value,
    matchPercentage: match.value,
    summary: "",
    description: "",
    tags: [],
    fitReason: "",
    riskNote: "",
  };

  for (const textKey of ["summary", "description", "fitReason", "riskNote", "serviceLength", "location"]) {
    if (roleResult.value[textKey] === undefined) continue;
    const t = parseString(roleResult.value[textKey], {
      maxLen: LIMITS.TEXT_MEDIUM,
      label: textKey,
      allowEmpty: true,
    });
    if (!t.ok) return t;
    role[textKey] = t.value;
  }

  if (roleResult.value.tags !== undefined) {
    if (!Array.isArray(roleResult.value.tags)) return fail("tags must be an array");
    if (roleResult.value.tags.length > LIMITS.REPORT_TAGS_MAX) return fail("too many tags");
    const tags = [];
    for (const tag of roleResult.value.tags) {
      const t = parseString(tag, { maxLen: LIMITS.REPORT_TAG_LEN, minLen: 1, label: "tag" });
      if (!t.ok) return t;
      tags.push(t.value);
    }
    role.tags = tags;
  }

  return ok(role);
}

function parseReportBody(reportRaw) {
  const reportResult = requirePlainObject(reportRaw, "report");
  if (!reportResult.ok) return reportResult;

  const allowed = [
    "direction",
    "directionExplanation",
    "strengths",
    "gaps",
    "roles",
    "actionPlan",
    "disclaimer",
  ];
  for (const key of Object.keys(reportResult.value)) {
    if (!allowed.includes(key)) return fail(`Unknown report field: ${key}`);
  }

  const direction = parseString(reportResult.value.direction, {
    maxLen: LIMITS.TEXT_SHORT,
    minLen: 1,
    label: "direction",
  });
  if (!direction.ok) return direction;

  const report = { direction: direction.value, roles: [] };

  if (reportResult.value.directionExplanation !== undefined) {
    const t = parseString(reportResult.value.directionExplanation, {
      maxLen: LIMITS.TEXT_LONG,
      label: "directionExplanation",
      allowEmpty: true,
    });
    if (!t.ok) return t;
    report.directionExplanation = t.value;
  }

  for (const listKey of ["strengths", "gaps", "actionPlan"]) {
    if (reportResult.value[listKey] === undefined) continue;
    if (!Array.isArray(reportResult.value[listKey])) return fail(`${listKey} must be an array`);
    if (reportResult.value[listKey].length > LIMITS.REPORT_STRENGTHS_MAX) {
      return fail(`${listKey} is too long`);
    }
    const items = [];
    for (const item of reportResult.value[listKey]) {
      const s = parseString(item, { maxLen: LIMITS.TEXT_MEDIUM, minLen: 1, label: listKey });
      if (!s.ok) return s;
      items.push(s.value);
    }
    report[listKey] = items;
  }

  if (reportResult.value.disclaimer !== undefined) {
    const d = parseString(reportResult.value.disclaimer, {
      maxLen: LIMITS.TEXT_MEDIUM,
      label: "disclaimer",
      allowEmpty: true,
    });
    if (!d.ok) return d;
    report.disclaimer = d.value;
  }

  if (reportResult.value.roles === undefined) return fail("report.roles is required");
  if (!Array.isArray(reportResult.value.roles)) return fail("roles must be an array");
  if (reportResult.value.roles.length === 0 || reportResult.value.roles.length > LIMITS.REPORT_ROLES_MAX) {
    return fail("roles count is invalid");
  }

  const roles = [];
  for (const roleRaw of reportResult.value.roles) {
    const role = parseReportRole(roleRaw);
    if (!role.ok) return role;
    roles.push(role.value);
  }
  report.roles = roles;

  return ok(report);
}

export function validateFitnessBody(req) {
  const bodyResult = requirePlainObject(req.body, "body");
  if (!bodyResult.ok) return bodyResult;

  const allowedTop = ["fitness"];
  for (const key of Object.keys(bodyResult.value)) {
    if (!allowedTop.includes(key)) return fail(`Unknown field: ${key}`);
  }

  const fitness = parseFitnessBody(bodyResult.value.fitness ?? {});
  if (!fitness.ok) return fitness;

  req.body = { fitness: fitness.value };
  return { ok: true };
}

export function validateReportPdfBody(req) {
  const bodyResult = requirePlainObject(req.body, "body");
  if (!bodyResult.ok) return bodyResult;

  const allowedTop = ["report", "userName"];
  for (const key of Object.keys(bodyResult.value)) {
    if (!allowedTop.includes(key)) return fail(`Unknown field: ${key}`);
  }

  const report = parseReportBody(bodyResult.value.report);
  if (!report.ok) return report;

  let userName = "משתמש";
  if (bodyResult.value.userName !== undefined) {
    const name = parseString(bodyResult.value.userName, {
      maxLen: LIMITS.NAME_MAX,
      label: "userName",
      allowEmpty: true,
    });
    if (!name.ok) return name;
    userName = name.value || "משתמש";
  }

  const formatRaw = req.query?.format;
  let format = "pdf";
  if (formatRaw !== undefined && formatRaw !== "") {
    const f = parseString(formatRaw, { maxLen: 8, label: "format" });
    if (!f.ok) return f;
    if (!REPORT_FORMATS.includes(f.value.toLowerCase())) return fail("format is invalid");
    format = f.value.toLowerCase();
  }

  req.body = { report: report.value, userName };
  req.query = { ...req.query, format };
  return { ok: true };
}
