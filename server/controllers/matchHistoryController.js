import MatchHistory from "../models/MatchHistory.js";

const MAX_MATCHES_PER_USER = 20;

export async function listMatchHistory(req, res) {
  try {
    const userId = req.userId;
    const limit = Math.min(50, Number(req.query.limit) || 10);

    const rows = await MatchHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("topRole topMatch confidence createdAt")
      .lean();

    res.json({
      matches: rows.map((r) => ({
        id: String(r._id),
        topRole: r.topRole || "",
        topMatch: r.topMatch ?? null,
        confidence: r.confidence || "medium",
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("[match-history/list]", err);
    res.status(500).json({ error: err.message });
  }
}

export async function getMatchHistory(req, res) {
  try {
    const row = await MatchHistory.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!row) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.json({
      id: String(row._id),
      roles: Array.isArray(row.roles) ? row.roles : [],
      confidence: row.confidence || "medium",
      confidenceNotes: Array.isArray(row.confidenceNotes) ? row.confidenceNotes : [],
      profileSnapshot: row.profileSnapshot ?? null,
      generatedAt: row.createdAt,
    });
  } catch (err) {
    console.error("[match-history/get]", err);
    res.status(500).json({ error: err.message });
  }
}

export async function deleteMatchHistory(req, res) {
  try {
    const deleted = await MatchHistory.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) {
      return res.status(404).json({ error: "Match not found" });
    }
    res.json({ message: "Match deleted", id: req.params.id });
  } catch (err) {
    console.error("[match-history/delete]", err);
    res.status(500).json({ error: err.message });
  }
}

/** Trim oldest match runs beyond cap (non-blocking). */
export async function trimUserMatchHistory(userId) {
  try {
    const count = await MatchHistory.countDocuments({ userId });
    if (count <= MAX_MATCHES_PER_USER) return;

    const excess = count - MAX_MATCHES_PER_USER;
    const oldest = await MatchHistory.find({ userId })
      .sort({ createdAt: 1 })
      .limit(excess)
      .select("_id")
      .lean();

    const ids = oldest.map((r) => r._id);
    if (ids.length) await MatchHistory.deleteMany({ _id: { $in: ids } });
  } catch (err) {
    console.error("[match-history/trim]", err);
  }
}
