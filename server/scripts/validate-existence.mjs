/**
 * Bulk existence check: fuzzy-match every catalog roleTitle against the official
 * mitgaisim role list (data/mitgaisim-roles-reference.txt). Read-only, no cost.
 *   node scripts/validate-existence.mjs
 * Matches confirm the role is real; the un-matched list is the (much smaller)
 * set that needs a deeper per-role web search.
 */
import "../env.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getIdfRoleCatalogParsed } from "../utils/idfRoleCatalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Normalize: drop quotes, gender suffixes, common prefixes, parens, punctuation → token set.
const STOP = new Set(["מסלול", "תכנית", "מיזם", "מערך", "קורס", "לוחם", "לוחמת", "של", "בחיל", "חיל", "ב"]);
function norm(s) {
  return String(s)
    .replace(/["'״׳()]/g, "")
    .replace(/\//g, " ")
    .replace(/\b(ת|ית|ה)\b/g, "")
    .split(/[\s-]+/)
    .map((w) => w.replace(/ת$/, ""))
    .filter((w) => w.length > 1 && !STOP.has(w));
}

const refRaw = fs.readFileSync(path.join(__dirname, "../data/mitgaisim-roles-reference.txt"), "utf8");
const refTitles = refRaw.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
const refTokens = refTitles.map((t) => new Set(norm(t)));
const refNorm = refTitles.map((t) => norm(t).join(" "));

function bestMatch(title) {
  const tks = norm(title);
  if (!tks.length) return 0;
  const nj = tks.join(" ");
  let best = 0;
  for (let i = 0; i < refTitles.length; i++) {
    if (refNorm[i].includes(nj) || nj.includes(refNorm[i])) return 1; // substring = strong
    const inter = tks.filter((w) => refTokens[i].has(w)).length;
    best = Math.max(best, inter / tks.length);
  }
  return best;
}

const roles = getIdfRoleCatalogParsed()?.roles || [];
const matched = [];
const unmatched = [];
for (const r of roles) {
  const score = bestMatch(r.roleTitle);
  (score >= 0.6 ? matched : unmatched).push({ title: r.roleTitle, score: score.toFixed(2) });
}

console.log(`catalog roles: ${roles.length}  |  reference titles: ${refTitles.length}`);
console.log(`matched (likely real): ${matched.length}  (${Math.round((matched.length / roles.length) * 100)}%)`);
console.log(`unmatched (need deeper check): ${unmatched.length}\n`);
console.log("=== unmatched (top 40) — candidates for per-role web search ===");
unmatched.slice(0, 40).forEach((u) => console.log(`  ${u.score}  ${u.title}`));
