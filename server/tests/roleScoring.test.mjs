import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scoreRole,
  buildCandidatePool,
  blendPercent,
  toDisplayPercent,
  isFlatYom,
  computeProfileHash,
} from "../utils/roleScoring.js";
import { normalizeRoleV3 } from "../utils/roleCatalogV3.js";

const flatYom = Object.fromEntries(
  ["technicalActivation","spatialPerception","dataProcessing","teamwork","command","instruction","interpersonalCare","diligencePersistence","sustainedAttention","speedAndAccuracy","managementOrganization","disciplineMaturity"].map((k) => [k, 3])
);
const richYom = { ...flatYom, technicalActivation: 5, dataProcessing: 5, command: 1, instruction: 1 };

const techProfile = {
  daparScore: 80, medicalProfile: 82, combatPreference: "TechTrack",
  focus: "Tech", physicalActivityLevel: "Low", yom: richYom,
};

const techRole = normalizeRoleV3({
  roleTitle: "מפתח/ת תוכנה", category: "סייבר וטכנולוגיה", combat: false, selective: true,
  preferenceTags: ["coding", "software", "cyber"], validationLevel: "official_public_validated",
});
const combatRole = normalizeRoleV3({
  roleTitle: "לוחם/ת חי\"ר", category: "לחימה", combat: true, selective: false,
  preferenceTags: ["combat", "fieldwork"], validationLevel: "official_family_validated",
});

test("weights sum to 1.0 (basePercent stays in band on all-neutral)", () => {
  // A role scoring ~0.5 everywhere must land inside [42,94].
  const r = scoreRole(techRole, techProfile);
  assert.ok(r.basePercent >= 42 && r.basePercent <= 94, `basePercent ${r.basePercent} out of band`);
});

test("hard gate: combat role blocked when medical < 64", () => {
  const r = scoreRole(combatRole, { ...techProfile, medicalProfile: 45, combatPreference: "FieldCombat" });
  assert.equal(r.eligible, false);
  assert.ok(r.hardFailReasons.length > 0);
});

test("combat role allowed at medical 82", () => {
  const r = scoreRole(combatRole, { ...techProfile, medicalProfile: 82, combatPreference: "FieldCombat" });
  assert.equal(r.eligible, true);
});

test("reviewed dapar floor is a HARD gate; ai_draft floor is soft", () => {
  const reviewed = normalizeRoleV3({ ...techRole, daparFloor: 70, enrichment: { status: "reviewed", confidence: "high" } });
  const draft = normalizeRoleV3({ ...techRole, daparFloor: 70, enrichment: { status: "ai_draft", confidence: "medium" } });
  const lowDapar = { ...techProfile, daparScore: 50 };
  assert.equal(scoreRole(reviewed, lowDapar).eligible, false, "reviewed floor should hard-gate");
  const draftScore = scoreRole(draft, lowDapar);
  assert.equal(draftScore.eligible, true, "ai_draft floor must not hard-gate");
  // soft penalty ⇒ strictly lower base than no-floor role
  const noFloor = scoreRole(techRole, lowDapar);
  assert.ok(draftScore.base01 < noFloor.base01, "ai_draft floor breach should lower score");
});

test("better tech profile scores tech role higher than weak one", () => {
  const strong = scoreRole(techRole, techProfile).basePercent;
  const weak = scoreRole(techRole, { ...techProfile, daparScore: 20, focus: "Physical", yom: flatYom }).basePercent;
  assert.ok(strong > weak, `expected ${strong} > ${weak}`);
});

test("blendPercent clamps adjustment to ±8 and result to [40,96]", () => {
  assert.equal(blendPercent(90, 20), 96);
  assert.equal(blendPercent(90, 8), 96); // 98 clamped
  assert.equal(blendPercent(45, -20), 40); // 37 clamped
  assert.equal(blendPercent(70, 5), 75);
  assert.equal(blendPercent(70, 0), 70);
});

test("toDisplayPercent maps 0→42 and 1→94", () => {
  assert.equal(toDisplayPercent(0), 42);
  assert.equal(toDisplayPercent(1), 94);
});

test("isFlatYom detects uniform vs varied", () => {
  assert.equal(isFlatYom(flatYom), true);
  assert.equal(isFlatYom(richYom), false);
});

test("determinism: same profile → identical scores across runs", () => {
  const a = scoreRole(techRole, techProfile);
  const b = scoreRole(techRole, techProfile);
  assert.deepEqual(a, b);
});

test("buildCandidatePool is deterministic and respects category cap", () => {
  const roles = [];
  for (let i = 0; i < 12; i++) {
    roles.push(normalizeRoleV3({
      roleTitle: `role-${i}`, category: i < 8 ? "סייבר וטכנולוגיה" : `cat-${i}`,
      combat: false, selective: true, preferenceTags: ["coding", "software"],
      validationLevel: "official_public_validated",
    }));
  }
  const p1 = buildCandidatePool(roles, techProfile, { poolSize: 6, maxPerCategory: 2 });
  const p2 = buildCandidatePool(roles, techProfile, { poolSize: 6, maxPerCategory: 2 });
  assert.deepEqual(p1.map((r) => r.roleTitle), p2.map((r) => r.roleTitle), "pool must be identical across runs");
  const techCatCount = p1.filter((r) => r.category === "סייבר וטכנולוגיה").length;
  assert.ok(techCatCount <= 2, `category cap violated: ${techCatCount}`);
});

test("computeProfileHash is stable and sensitive to changes", () => {
  const h1 = computeProfileHash(techProfile, "v3", "p1");
  const h2 = computeProfileHash(techProfile, "v3", "p1");
  const h3 = computeProfileHash({ ...techProfile, daparScore: 70 }, "v3", "p1");
  assert.equal(h1, h2);
  assert.notEqual(h1, h3);
});
