/**
 * Role-catalog gap analysis. Read-only; no AI, no cost.
 *   node scripts/gap-analysis-roles.mjs
 * Reports where the catalog is thin or low-confidence so a human can research
 * and add specific sub-roles/tracks (against mitgaisim.gov.il). Never invents roles.
 */
import "../env.js";
import { getIdfRoleCatalogParsed } from "../utils/idfRoleCatalog.js";

const cat = getIdfRoleCatalogParsed();
const roles = cat?.roles || [];
console.log(`catalog: ${roles.length} roles, schema ${cat?.schemaVersion}\n`);

// 1. Category distribution — thin categories are expansion candidates.
const byCat = new Map();
for (const r of roles) byCat.set(r.category, (byCat.get(r.category) || 0) + 1);
const sortedCats = [...byCat.entries()].sort((a, b) => a[1] - b[1]);
console.log(`=== categories: ${byCat.size} total ===`);
console.log("thinnest (≤2 roles) — candidates for more sub-roles:");
for (const [c, n] of sortedCats.filter(([, n]) => n <= 2)) console.log(`  ${n}  ${c}`);

// 2. Low-confidence roles (seed) — need verification/replacement.
const seed = roles.filter((r) => r.validationLevel === "seed_normalized");
console.log(`\n=== low-confidence (seed_normalized): ${seed.length} roles ===`);
console.log("(prioritize these for human review / replacement)");

// 3. Roles whose source explicitly asks to verify the exact title.
const toVerify = roles.filter((r) => /verify|וודא|לוודא/i.test(r.validationSource || ""));
console.log(`\n=== validationSource says "verify": ${toVerify.length} roles ===`);

// 4. Famous families that likely have sub-tracks worth adding.
const FAMILIES = [
  ["8200 / מודיעין טכנולוגי", /8200|סיגינט|יחידה טכנולוגית/],
  ["תקשוב / סייבר הגנתי", /תקשוב|סייבר|גאמ|בזק/],
  ["חיל האוויר — טכני", /חיל האוויר|טכנאי טיס|חימוש אווירי|בקר/],
  ["חובשים / רפואה", /חובש|רפוא|פרמדיק/],
  ["מודיעין שדה", /מודיעין|איסוף|חמ"ן/],
  ["הנדסה קרבית", /הנדסה|חבלן|יהל/],
];
console.log(`\n=== famous families (current coverage — expand where low) ===`);
for (const [name, re] of FAMILIES) {
  const n = roles.filter((r) => re.test(r.roleTitle) || re.test(r.category)).length;
  console.log(`  ${String(n).padStart(2)}  ${name}`);
}

console.log(`\nNext: research specific sub-roles for the thin categories/families on`);
console.log(`mitgaisim.gov.il, then add them to the catalog with validationLevel`);
console.log(`"official_public_validated" once confirmed.`);
