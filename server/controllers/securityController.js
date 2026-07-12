import SecurityEvent from "../models/SecurityEvent.js";
import BlockedIp from "../models/BlockedIp.js";
import { refreshBlockedIpCache } from "../middleware/ipBlock.js";
import { getClientIp } from "../utils/securityLog.js";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const TIMELINE_HOURS = 48;

function eventRow(e) {
  return {
    id: String(e._id),
    type: e.type,
    severity: e.severity,
    ip: e.ip || "",
    method: e.method || "",
    path: e.path || "",
    userAgent: e.userAgent || "",
    email: e.email || "",
    statusCode: e.statusCode ?? null,
    message: e.message || "",
    createdAt: e.createdAt,
  };
}

function blockedIpRow(b) {
  return {
    id: String(b._id),
    ip: b.ip,
    reason: b.reason || "",
    blockedBy: b.blockedBy || "",
    hitCount: b.hitCount || 0,
    lastHitAt: b.lastHitAt || null,
    createdAt: b.createdAt,
  };
}

/** Hour bucket key in UTC, e.g. "2026-07-11T14". */
function hourKey(date) {
  return date.toISOString().slice(0, 13);
}

export async function getSecurityOverview(req, res) {
  try {
    const now = Date.now();
    const since24h = new Date(now - DAY_MS);
    const since7d = new Date(now - 7 * DAY_MS);
    const sinceTimeline = new Date(now - TIMELINE_HOURS * HOUR_MS);

    const [last24h, last7d, allTime, blockedIpCount, byType, bySeverity, timelineAgg, topIpsAgg, recent] =
      await Promise.all([
        SecurityEvent.countDocuments({ createdAt: { $gte: since24h } }),
        SecurityEvent.countDocuments({ createdAt: { $gte: since7d } }),
        SecurityEvent.estimatedDocumentCount(),
        BlockedIp.countDocuments(),
        SecurityEvent.aggregate([
          { $match: { createdAt: { $gte: since7d } } },
          {
            $group: {
              _id: "$type",
              count: { $sum: 1 },
              lastAt: { $max: "$createdAt" },
            },
          },
          { $sort: { count: -1 } },
        ]),
        SecurityEvent.aggregate([
          { $match: { createdAt: { $gte: since7d } } },
          { $group: { _id: "$severity", count: { $sum: 1 } } },
        ]),
        SecurityEvent.aggregate([
          { $match: { createdAt: { $gte: sinceTimeline } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%dT%H", date: "$createdAt" },
              },
              count: { $sum: 1 },
              severe: {
                $sum: {
                  $cond: [{ $in: ["$severity", ["high", "critical"]] }, 1, 0],
                },
              },
            },
          },
        ]),
        SecurityEvent.aggregate([
          { $match: { createdAt: { $gte: since7d }, ip: { $ne: "" } } },
          {
            $group: {
              _id: "$ip",
              count: { $sum: 1 },
              severe: {
                $sum: {
                  $cond: [{ $in: ["$severity", ["high", "critical"]] }, 1, 0],
                },
              },
              types: { $addToSet: "$type" },
              lastAt: { $max: "$createdAt" },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        SecurityEvent.find().sort({ createdAt: -1 }).limit(20).lean(),
      ]);

    // Continuous hourly buckets so the chart has no gaps.
    const bucketMap = new Map(timelineAgg.map((b) => [b._id, b]));
    const timeline = [];
    for (let i = TIMELINE_HOURS - 1; i >= 0; i--) {
      const bucketStart = new Date(Math.floor(now / HOUR_MS) * HOUR_MS - i * HOUR_MS);
      const key = hourKey(bucketStart);
      const bucket = bucketMap.get(key);
      timeline.push({
        hour: bucketStart.toISOString(),
        count: bucket?.count ?? 0,
        severe: bucket?.severe ?? 0,
      });
    }

    const topIpAddresses = topIpsAgg.map((r) => r._id);
    const blockedDocs = topIpAddresses.length
      ? await BlockedIp.find({ ip: { $in: topIpAddresses } })
          .select("ip")
          .lean()
      : [];
    const blockedSet = new Set(blockedDocs.map((b) => b.ip));

    res.json({
      totals: { last24h, last7d, allTime },
      blockedIpCount,
      byType: byType.map((t) => ({ type: t._id, count: t.count, lastAt: t.lastAt })),
      bySeverity: bySeverity.map((s) => ({ severity: s._id, count: s.count })),
      timeline,
      topIps: topIpsAgg.map((r) => ({
        ip: r._id,
        count: r.count,
        severe: r.severe,
        types: r.types,
        lastAt: r.lastAt,
        blocked: blockedSet.has(r._id),
      })),
      recentEvents: recent.map(eventRow),
    });
  } catch (err) {
    console.error("[admin/security/overview]", err);
    res.status(500).json({ error: err.message });
  }
}

export async function listSecurityEvents(req, res) {
  try {
    const limit = Number(req.query.limit) || 50;
    const skip = Number(req.query.skip) || 0;

    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.ip) filter.ip = req.query.ip;

    const [events, total] = await Promise.all([
      SecurityEvent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SecurityEvent.countDocuments(filter),
    ]);

    res.json({ events: events.map(eventRow), total, skip, limit });
  } catch (err) {
    console.error("[admin/security/events]", err);
    res.status(500).json({ error: err.message });
  }
}

export async function listBlockedIps(req, res) {
  try {
    const rows = await BlockedIp.find().sort({ createdAt: -1 }).limit(200).lean();
    res.json({ blockedIps: rows.map(blockedIpRow) });
  } catch (err) {
    console.error("[admin/security/blocked-ips]", err);
    res.status(500).json({ error: err.message });
  }
}

export async function blockIp(req, res) {
  try {
    const { ip, reason } = req.body;

    if (ip === getClientIp(req)) {
      return res.status(400).json({
        error: "אי אפשר לחסום את הכתובת שממנה אתם מחוברים כרגע",
        code: "CANNOT_BLOCK_SELF",
      });
    }

    const doc = await BlockedIp.findOneAndUpdate(
      { ip },
      {
        $setOnInsert: { ip, hitCount: 0 },
        $set: { reason: reason || "", blockedBy: req.adminUser?.email || "" },
      },
      { upsert: true, new: true },
    );
    await refreshBlockedIpCache();

    res.json({ message: "כתובת ה-IP נחסמה", blockedIp: blockedIpRow(doc) });
  } catch (err) {
    console.error("[admin/security/block-ip]", err);
    res.status(500).json({ error: err.message });
  }
}

export async function unblockIp(req, res) {
  try {
    const doc = await BlockedIp.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: "החסימה לא נמצאה" });
    }
    await refreshBlockedIpCache();

    res.json({ message: "החסימה הוסרה", ip: doc.ip });
  } catch (err) {
    console.error("[admin/security/unblock-ip]", err);
    res.status(500).json({ error: err.message });
  }
}
