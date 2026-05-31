import ReportHistory from "../models/ReportHistory.js";

const MAX_REPORTS_PER_USER = 30;

export async function listReportHistory(req, res) {
  try {
    const userId = req.userId;
    const limit = Number(req.query.limit) || 20;

    const rows = await ReportHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("userName direction topRole topMatch createdAt updatedAt")
      .lean();

    res.json({
      reports: rows.map((r) => ({
        id: String(r._id),
        userName: r.userName || "",
        direction: r.direction || "",
        topRole: r.topRole || "",
        topMatch: r.topMatch ?? null,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("[reports/list]", err);
    res.status(500).json({ error: err.message });
  }
}

export async function getReportHistory(req, res) {
  try {
    const id = req.params.id;
    const row = await ReportHistory.findOne({ _id: id, userId: req.userId }).lean();
    if (!row) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({
      id: String(row._id),
      report: row.report,
      userName: row.userName || "",
      direction: row.direction || "",
      generatedAt: row.createdAt,
    });
  } catch (err) {
    console.error("[reports/get]", err);
    res.status(500).json({ error: err.message });
  }
}

export async function deleteReportHistory(req, res) {
  try {
    const id = req.params.id;
    const deleted = await ReportHistory.findOneAndDelete({ _id: id, userId: req.userId });
    if (!deleted) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ message: "Report deleted", id });
  } catch (err) {
    console.error("[reports/delete]", err);
    res.status(500).json({ error: err.message });
  }
}

/** Trim oldest reports beyond cap (non-blocking). */
export async function trimUserReportHistory(userId) {
  try {
    const count = await ReportHistory.countDocuments({ userId });
    if (count <= MAX_REPORTS_PER_USER) return;

    const excess = count - MAX_REPORTS_PER_USER;
    const oldest = await ReportHistory.find({ userId })
      .sort({ createdAt: 1 })
      .limit(excess)
      .select("_id")
      .lean();

    const ids = oldest.map((r) => r._id);
    if (ids.length) await ReportHistory.deleteMany({ _id: { $in: ids } });
  } catch (err) {
    console.error("[reports/trim]", err);
  }
}
