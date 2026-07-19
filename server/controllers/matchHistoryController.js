import MatchGeneration from "../models/MatchGeneration.js";
import AiMatchResult from "../models/AiMatchResult.js";

function summarize(doc) {
  const roles = Array.isArray(doc.roles) ? doc.roles : [];
  const top = roles[0];
  return {
    id: String(doc._id),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    engineVersion: doc.engineVersion || "",
    topRole: doc.topRole || top?.roleTitle || "",
    topMatch: doc.topMatch ?? top?.matchPercentage ?? null,
    roleCount: roles.length,
    roleTitles: roles.slice(0, 5).map((r) => r.roleTitle).filter(Boolean),
  };
}

/** List recent match generations for the signed-in user. */
export async function listMatchHistory(req, res) {
  try {
    const userId = req.userId;
    let docs = await MatchGeneration.find({ userId }).sort({ createdAt: -1 }).limit(30).lean();

    // Backfill view from cache docs if the user has older AiMatchResult rows only.
    if (docs.length === 0) {
      const cached = await AiMatchResult.find({ userId, endpoint: "match-roles" })
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean();
      docs = cached.map((c) => ({
        _id: c._id,
        createdAt: c.createdAt || c.updatedAt,
        updatedAt: c.updatedAt,
        engineVersion: c.engineVersion,
        roles: c.roles,
        topRole: c.roles?.[0]?.roleTitle || "",
        topMatch: c.roles?.[0]?.matchPercentage ?? null,
        _fromCache: true,
      }));
    }

    res.json({ generations: docs.map(summarize) });
  } catch (err) {
    console.error("[ai/match-history/list]", err);
    res.status(500).json({ error: err.message });
  }
}

/** Load one generation's full role list. */
export async function getMatchHistory(req, res) {
  try {
    const userId = req.userId;
    const id = String(req.params.id || "").trim();
    let doc = await MatchGeneration.findOne({ _id: id, userId }).lean();
    if (!doc) {
      doc = await AiMatchResult.findOne({ _id: id, userId }).lean();
    }
    if (!doc?.roles?.length) {
      return res.status(404).json({ error: "ההפעלה לא נמצאה", code: "NOT_FOUND" });
    }
    res.json({
      generation: {
        ...summarize(doc),
        roles: doc.roles,
      },
    });
  } catch (err) {
    console.error("[ai/match-history/get]", err);
    res.status(500).json({ error: err.message });
  }
}

export async function deleteMatchHistory(req, res) {
  try {
    const userId = req.userId;
    const id = String(req.params.id || "").trim();
    const deleted = await MatchGeneration.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      const cached = await AiMatchResult.findOneAndDelete({ _id: id, userId });
      if (!cached) return res.status(404).json({ error: "ההפעלה לא נמצאה" });
    }
    res.json({ message: "נמחק מההיסטוריה", id });
  } catch (err) {
    console.error("[ai/match-history/delete]", err);
    res.status(500).json({ error: err.message });
  }
}
