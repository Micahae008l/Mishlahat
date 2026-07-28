/**
 * Untested candidates (no דפ"ר, no פרופיל רפואי) must not be scored as if they
 * scored zero. Run: node server/utils/roleScoring.untested.test.mjs
 */
import assert from "node:assert/strict";
import { scoreRole, buildProfileNotice } from "./roleScoring.js";
import { preFilterRoles } from "./rolePreFilter.js";

// physicalDemand is required: normalizeRoleV3 always sets it, and leaving it
// out makes prefFit null, which is a broken fixture rather than a real case.
const combatRole = {
  roleTitle: "לוחם חי\"ר",
  category: "לחימה",
  combat: true,
  physicalDemand: 5,
  medicalFloor: 82,
  daparFloor: 50,
  preferenceTags: ["combat", "fieldwork"],
  enrichment: { status: "reviewed" },
};

const prefsOnly = {
  combatPreference: "Kravi",
  focus: "Physical",
  physicalActivityLevel: "High",
  yom: null,
};

const untested = { ...prefsOnly, daparScore: null, medicalProfile: null };
const lowProfile = { ...prefsOnly, daparScore: 40, medicalProfile: 45 };

// 1. An untested candidate keeps combat roles on the table.
const u = scoreRole(combatRole, untested);
assert.equal(u.eligible, true, "untested candidate must not be hard-failed off combat roles");
assert.deepEqual(u.hardFailReasons, [], "no hard-fail reasons when scores are unknown");

// 2. Someone who actually tested low is still correctly excluded.
const l = scoreRole(combatRole, lowProfile);
assert.equal(l.eligible, false, "profile 45 must still be blocked from combat");

// 3. Unknown scores are neutral, not maximal: a strong tested candidate outranks.
const strong = scoreRole(combatRole, { ...prefsOnly, daparScore: 80, medicalProfile: 97 });
assert.ok(strong.base01 > u.base01, "a tested strong profile should outrank an unknown one");
assert.ok(u.base01 > 0, "unknown scores should not collapse the base score to zero");

// 4. Pre-filter keeps combat roles for untested candidates and drops them for low profiles.
const pool = preFilterRoles([combatRole], untested, prefsOnly, null);
assert.equal(pool.length, 1, "pre-filter must keep combat roles when profile is unknown");
assert.equal(
  preFilterRoles([combatRole], { daparScore: 40, medicalProfile: 45 }, prefsOnly, null).length,
  0,
  "pre-filter must still drop combat roles for a tested profile of 45",
);

// 5. The user is told the match is preference-only.
assert.match(buildProfileNotice(untested), /ההעדפות שלכם בלבד/, "untested users must get the caveat");
assert.doesNotMatch(
  buildProfileNotice({ ...prefsOnly, daparScore: 80, medicalProfile: 97 }),
  /ההעדפות שלכם בלבד/,
  "fully tested users must not get the untested caveat",
);

console.log("roleScoring untested-candidate checks passed");
