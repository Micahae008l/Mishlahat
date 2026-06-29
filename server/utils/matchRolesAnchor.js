/** Max roles returned per match-roles run — keep in sync with prompt + frontend copy. */
export const MATCH_ROLE_COUNT = 7;

/** How many pre-screened candidates the AI gets to choose from. */
export const CANDIDATE_POOL_SIZE = 24;

export function normalizeRoleTitle(s) {
  return String(s || "")
    .replace(/["'״׳()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Fallback percentage when the AI didn't supply one (only used for top-ups).
 * Same profile + same catalog → same number.
 */
export function deterministicMatchPct(rankIndex, score, scores) {
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const span = max - min || 1;
  const rel = (score - min) / span;
  const rankBase = 94 - rankIndex * 5;
  const scorePct = 58 + rel * 37;
  const blended = Math.round(rankBase * 0.65 + scorePct * 0.35);
  return Math.min(95, Math.max(58, blended));
}

/** Match an AI-returned title back to a real candidate row (exact, then loose). */
function findCandidate(pool, title) {
  const target = normalizeRoleTitle(title);
  if (!target) return null;
  let best = null;
  for (const r of pool) {
    const cand = normalizeRoleTitle(r.roleTitle);
    if (!cand) continue;
    if (cand === target) return r;
    if (!best && (cand.includes(target) || target.includes(cand))) best = r;
  }
  return best;
}

function clampPct(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return null;
  return Math.min(97, Math.max(50, v));
}

function buildEntry(cand, ai, matchPercentage) {
  const description = String(ai?.description || cand.aiRecommendationHint || cand.bestFor || "").trim();
  let summary = String(ai?.summary || "").trim();
  if (!summary && description) {
    const first = description.split(/(?<=[.!?])\s+/)[0]?.trim();
    summary = first && first.length <= 140 ? first : `${description.slice(0, 120).trim()}…`;
  }
  if (!summary) summary = `תפקיד ${cand.roleTitle} — התאמה לפי הפרופיל וההעדפות שלכם.`;

  const aiTags = Array.isArray(ai?.tags)
    ? ai.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 6)
    : [];
  const catalogTags = (cand.preferenceTags || [])
    .slice(0, 4)
    .map((t) => String(t).trim())
    .filter(Boolean);

  return {
    roleTitle: String(cand.roleTitle || "").trim(),
    matchPercentage,
    summary,
    description: description || summary,
    tags: aiTags.length ? aiTags : catalogTags.length ? catalogTags : ["צה״ל"],
    matchFactors: cand._factors?.length ? cand._factors : [],
  };
}

/**
 * The AI SELECTS and RANKS roles from the candidate pool. We:
 *  - validate every returned title against the real pool (drop hallucinations),
 *  - keep the AI's ranking + match%,
 *  - and, if the AI returned too few valid picks, top up from the pre-filter ranking
 *    so the user always gets a usable list.
 */
export function reconcileAiSelectedRoles(candidatePool, aiRoles, targetCount = MATCH_ROLE_COUNT) {
  const used = new Set();
  const out = [];

  for (const ai of Array.isArray(aiRoles) ? aiRoles : []) {
    const cand = findCandidate(candidatePool, ai?.roleTitle);
    if (!cand) continue; // hallucinated / not in pool → drop
    const key = normalizeRoleTitle(cand.roleTitle);
    if (used.has(key)) continue; // dedupe
    used.add(key);
    out.push(buildEntry(cand, ai, clampPct(ai?.matchPercentage) ?? 70));
    if (out.length >= targetCount) break;
  }

  // Top up from the deterministic pre-filter ranking if the AI under-delivered.
  if (out.length < Math.min(targetCount, candidatePool.length)) {
    const scores = candidatePool.map((r) => r._score ?? 0);
    candidatePool.forEach((cand, idx) => {
      if (out.length >= targetCount) return;
      const key = normalizeRoleTitle(cand.roleTitle);
      if (used.has(key)) return;
      used.add(key);
      out.push(buildEntry(cand, null, deterministicMatchPct(idx, cand._score ?? 0, scores)));
    });
  }

  out.sort((a, b) => b.matchPercentage - a.matchPercentage);
  return out.slice(0, targetCount);
}
