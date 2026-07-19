import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getIdfRoleCatalogParsed } from "./idfRoleCatalog.js";
import { YOM_HAMEAH_12_KEYS } from "./yomHameah12Keys.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cachedOverrides;
/** Web-validated per-role enrichment, keyed by exact roleTitle. Grows over time. */
function loadEnrichmentOverrides() {
  if (cachedOverrides !== undefined) return cachedOverrides;
  try {
    const raw = fs.readFileSync(path.join(__dirname, "../data/role-enrichment-v3.json"), "utf8");
    cachedOverrides = JSON.parse(raw)?.overrides || {};
  } catch {
    cachedOverrides = {};
  }
  return cachedOverrides;
}

/**
 * Schema-v3 loader shim. v3 adds structured per-role fields (floors, day-to-day,
 * intensities, keyDimensions, enrichment status). This module normalizes ANY role
 * — a legacy v2 role or an enriched v3 role — into a complete v3 shape, deriving
 * sensible defaults from the v2 tags/flags when the enriched fields are absent.
 * That lets the scoring engine (roleScoring.js) run on today's v2 catalog and
 * improve automatically as roles get enriched — no code change needed.
 */

const YOM = new Set(YOM_HAMEAH_12_KEYS);

/** preferenceTag → the מא"ה dimensions that role tends to exercise. */
export const TAG_TO_DIMENSIONS = {
  coding: ["technicalActivation", "dataProcessing"],
  software: ["technicalActivation", "dataProcessing"],
  cyber: ["technicalActivation", "dataProcessing", "disciplineMaturity"],
  ai: ["technicalActivation", "dataProcessing"],
  data: ["dataProcessing", "sustainedAttention"],
  it: ["technicalActivation"],
  networks: ["technicalActivation"],
  electronics: ["technicalActivation", "speedAndAccuracy"],
  hardware: ["technicalActivation"],
  mechanics: ["technicalActivation", "spatialPerception"],
  devops: ["technicalActivation", "managementOrganization"],
  qa: ["sustainedAttention", "speedAndAccuracy"],
  intelligence: ["dataProcessing", "sustainedAttention", "disciplineMaturity"],
  research: ["dataProcessing", "diligencePersistence"],
  maps: ["spatialPerception", "dataProcessing"],
  "visual-analysis": ["sustainedAttention", "spatialPerception"],
  math: ["dataProcessing"],
  physics: ["dataProcessing", "technicalActivation"],
  "attention-to-detail": ["sustainedAttention", "speedAndAccuracy"],
  leadership: ["command"],
  teaching: ["instruction"],
  instruction: ["instruction"],
  "helping-people": ["interpersonalCare"],
  welfare: ["interpersonalCare"],
  psychology: ["interpersonalCare", "dataProcessing"],
  hr: ["interpersonalCare", "managementOrganization"],
  interviewing: ["interpersonalCare", "dataProcessing"],
  medicine: ["interpersonalCare", "diligencePersistence"],
  emergency: ["interpersonalCare", "speedAndAccuracy"],
  operations: ["managementOrganization", "sustainedAttention"],
  "war-room": ["sustainedAttention", "managementOrganization"],
  logistics: ["managementOrganization"],
  admin: ["managementOrganization", "dataProcessing"],
  fieldwork: ["spatialPerception"],
  combat: ["spatialPerception", "disciplineMaturity"],
  driving: ["spatialPerception", "speedAndAccuracy"],
  rescue: ["interpersonalCare", "spatialPerception"],
};

const TECH_TAGS = new Set([
  "coding", "software", "cyber", "ai", "data", "it", "networks",
  "electronics", "hardware", "devops", "qa", "physics",
]);
const PEOPLE_TAGS = new Set([
  "helping-people", "welfare", "psychology", "hr", "interviewing",
  "medicine", "emergency", "teaching", "instruction",
]);

function clampInt(n, lo, hi, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

/** Derive 2-4 key מא"ה dimensions from preference tags (fallback when not enriched). */
export function deriveKeyDimensions(tags = []) {
  const counts = new Map();
  for (const t of tags) {
    for (const dim of TAG_TO_DIMENSIONS[t] || []) {
      counts.set(dim, (counts.get(dim) || 0) + 1);
    }
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([d]) => d);
  return ranked.slice(0, 4);
}

function deriveTechIntensity(tags = []) {
  const hits = tags.filter((t) => TECH_TAGS.has(t)).length;
  return clampInt(1 + hits * 1.3, 1, 5, 2);
}

function derivePeopleIntensity(tags = []) {
  const hits = tags.filter((t) => PEOPLE_TAGS.has(t)).length;
  return clampInt(1 + hits * 1.5, 1, 5, 2);
}

const VALID_COMPETITIVENESS = new Set(["low", "medium", "high", "very_high"]);
const VALID_POPULARITY = new Set(["famous", "known", "niche"]);
const VALID_ENRICH_STATUS = new Set(["none", "ai_draft", "reviewed", "verified"]);
const VALID_DAPAR = new Set([10, 20, 30, 40, 50, 60, 70, 80, 90]);
const VALID_MEDICAL = new Set([21, 45, 64, 72, 82, 97]);

function pickEnum(value, allowed, fallback) {
  return allowed.has(value) ? value : fallback;
}

/** Fill a complete v3 shape from any role (v2 or partially/fully enriched). Non-mutating. */
export function normalizeRoleV3(role) {
  const tags = Array.isArray(role.preferenceTags) ? role.preferenceTags : [];
  const enrichment = role.enrichment && typeof role.enrichment === "object" ? role.enrichment : {};

  const keyDimensions = Array.isArray(role.keyDimensions)
    ? role.keyDimensions.filter((d) => YOM.has(d)).slice(0, 4)
    : [];

  return {
    ...role,
    // eligibility floors — null means "unknown, no hard gate"
    daparFloor: VALID_DAPAR.has(role.daparFloor) ? role.daparFloor : null,
    medicalFloor: VALID_MEDICAL.has(role.medicalFloor) ? role.medicalFloor : null,
    // service + location (empty until enriched; report Phase-4 kill-switch reads these)
    serviceLengthMonths: Number.isFinite(role.serviceLengthMonths) ? role.serviceLengthMonths : null,
    serviceLengthLabel: typeof role.serviceLengthLabel === "string" ? role.serviceLengthLabel : "",
    locations: Array.isArray(role.locations) ? role.locations : [],
    dayToDay: typeof role.dayToDay === "string" ? role.dayToDay : "",
    requirements: Array.isArray(role.requirements) ? role.requirements : [],
    // intensities — derived from tags/flags when not enriched
    physicalDemand: clampInt(role.physicalDemand, 1, 5, role.combat ? 4 : 2),
    techIntensity: clampInt(role.techIntensity, 1, 5, deriveTechIntensity(tags)),
    peopleIntensity: clampInt(role.peopleIntensity, 1, 5, derivePeopleIntensity(tags)),
    competitiveness: pickEnum(role.competitiveness, VALID_COMPETITIVENESS, role.selective ? "high" : "medium"),
    keyDimensions: keyDimensions.length ? keyDimensions : deriveKeyDimensions(tags),
    popularity: pickEnum(role.popularity, VALID_POPULARITY, "known"),
    enrichment: {
      status: pickEnum(enrichment.status, VALID_ENRICH_STATUS, "none"),
      confidence: enrichment.confidence || "low",
      enrichedAt: enrichment.enrichedAt || null,
    },
  };
}

let cachedV3;

/** Parsed catalog with every role normalized to complete v3 shape. Cached. */
export function getIdfRoleCatalogV3() {
  if (cachedV3 !== undefined) return cachedV3;
  const parsed = getIdfRoleCatalogParsed();
  if (!parsed?.roles?.length) {
    cachedV3 = parsed ? { ...parsed, roles: [] } : null;
    return cachedV3;
  }
  const overrides = loadEnrichmentOverrides();
  let enrichedCount = 0;
  const roles = parsed.roles.map((r) => {
    const ov = overrides[r.roleTitle];
    if (ov) enrichedCount++;
    return normalizeRoleV3(ov ? { ...r, ...ov } : r);
  });
  cachedV3 = {
    ...parsed,
    // Reflects that output is v3 (also namespaces the match cache via profileHash).
    schemaVersion: "idf-role-preference-recommender-v3",
    enrichedCount,
    roles,
  };
  return cachedV3;
}

/** Test/enrichment helper — clears the memoized v3 catalog. */
export function _resetV3Cache() {
  cachedV3 = undefined;
}
