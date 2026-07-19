/**
 * End-to-end consistency check for the v2 match engine.
 * Requires the API running locally with AI_MATCH_ENGINE=v2.
 *   AI_MATCH_ENGINE=v2 node index.js &
 *   node scripts/test-match-consistency.mjs
 * Picks a real aiReady user, runs match-roles 3x, and reports order/range +
 * title Jaccard overlap across runs.
 */
import "../env.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const API = process.env.TEST_API_URL || "http://localhost:3001";

await mongoose.connect(process.env.MONGODB_URI);
const AiUsageLog = (await import("../models/AiUsageLog.js")).default;
const row = await AiUsageLog.findOne({ status: "success", endpoint: "match-roles" })
  .sort({ createdAt: -1 })
  .select("userId userEmail");
if (!row) { console.log("no aiReady user found"); process.exit(1); }
const token = jwt.sign({ userId: String(row.userId) }, process.env.JWT_SECRET, { expiresIn: "10m" });
console.log("user:", row.userEmail);
await mongoose.disconnect();

async function runMatch() {
  const res = await fetch(`${API}/api/ai/match-roles`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
  });
  return { status: res.status, body: await res.json() };
}

const runs = [];
for (let i = 0; i < 3; i++) {
  const r = await runMatch();
  if (!r.body.roles) { console.log(`run ${i + 1} FAILED:`, r.status, JSON.stringify(r.body).slice(0, 300)); process.exit(1); }
  runs.push(r.body.roles);
}

const r1 = runs[0];
console.log("\n=== run 1 roles ===");
r1.forEach((x, i) => console.log(`  #${i + 1}  ${x.matchPercentage}%  ${x.roleTitle}`));
console.log("\n#1 description:\n ", r1[0].description);

console.log("\n=== checks ===");
console.log("count == 5:", r1.length === 5);
console.log("strictly descending:", r1.every((x, i) => i === 0 || x.matchPercentage < r1[i - 1].matchPercentage));
console.log("all in [40,96]:", r1.every((x) => x.matchPercentage >= 40 && x.matchPercentage <= 96));
console.log("#1 desc cites a number:", /\b\d{2}\b/.test(r1[0].description));

const titles = runs.map((r) => new Set(r.map((x) => x.roleTitle)));
const jaccard = (a, b) => [...a].filter((x) => b.has(x)).length / new Set([...a, ...b]).size;
console.log("\n=== consistency (title Jaccard across 3 runs) ===");
console.log("run1∩run2:", jaccard(titles[0], titles[1]).toFixed(2), "| run1∩run3:", jaccard(titles[0], titles[2]).toFixed(2));
