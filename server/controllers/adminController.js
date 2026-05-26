import mongoose from "mongoose";
import User from "../models/User.js";
import MilitaryStats from "../models/MilitaryStats.js";
import Preferences from "../models/Preferences.js";
import EmailOtp from "../models/EmailOtp.js";
import AiUsageLog from "../models/AiUsageLog.js";
import { computeAiProfileMissing } from "../utils/profileAiReady.js";
import { pricingMeta } from "../utils/openaiPricing.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function formatUsd(n) {
  const v = Number(n) || 0;
  return Math.round(v * 100) / 100;
}

export async function getAdminMe(req, res) {
  try {
    const u = req.adminUser;
    res.json({
      userId: String(u._id),
      email: u.email,
      preferredName: u.preferredName || "",
      role: u.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getOverview(req, res) {
  try {
    const [userCounts, usageAgg, recentUsage] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            adminUsers: {
              $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
            },
          },
        },
      ]),
      AiUsageLog.aggregate([
        {
          $group: {
            _id: null,
            totalCalls: { $sum: 1 },
            successCalls: {
              $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
            },
            promptTokens: { $sum: "$promptTokens" },
            completionTokens: { $sum: "$completionTokens" },
            totalTokens: { $sum: "$totalTokens" },
            estimatedCostUsd: { $sum: "$estimatedCostUsd" },
          },
        },
      ]),
      AiUsageLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("userEmail endpoint model totalTokens estimatedCostUsd status createdAt")
        .lean(),
    ]);

    const users = userCounts[0] || { totalUsers: 0, adminUsers: 0 };
    const usage = usageAgg[0] || {
      totalCalls: 0,
      successCalls: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
    };

    res.json({
      users: {
        total: users.totalUsers,
        admins: users.adminUsers,
      },
      openai: {
        totalCalls: usage.totalCalls,
        successCalls: usage.successCalls,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        estimatedCostUsd: formatUsd(usage.estimatedCostUsd),
        pricing: pricingMeta(),
      },
      recentUsage,
    });
  } catch (err) {
    console.error("[admin/overview]", err);
    res.status(500).json({ error: err.message });
  }
}

export async function listUsers(req, res) {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const skip = Math.max(0, Number(req.query.skip) || 0);

    const filter = {};
    if (q) {
      filter.$or = [
        { email: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
        { preferredName: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("email preferredName phone status role emailVerifiedAt createdAt updatedAt")
        .lean(),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((u) => u._id);
    const [statsList, prefsList, usageByUser] = await Promise.all([
      MilitaryStats.find({ userId: { $in: userIds } }).lean(),
      Preferences.find({ userId: { $in: userIds } }).lean(),
      AiUsageLog.aggregate([
        { $match: { userId: { $in: userIds } } },
        {
          $group: {
            _id: "$userId",
            callCount: { $sum: 1 },
            totalTokens: { $sum: "$totalTokens" },
            estimatedCostUsd: { $sum: "$estimatedCostUsd" },
            lastCallAt: { $max: "$createdAt" },
          },
        },
      ]),
    ]);

    const statsMap = new Map(statsList.map((s) => [String(s.userId), s]));
    const prefsMap = new Map(prefsList.map((p) => [String(p.userId), p]));
    const usageMap = new Map(usageByUser.map((u) => [String(u._id), u]));

    const rows = users.map((u) => {
      const id = String(u._id);
      const stats = statsMap.get(id) ?? null;
      const preferences = prefsMap.get(id) ?? null;
      const { ready: aiReady, missing: aiProfileMissing } = computeAiProfileMissing(stats, preferences);
      const usage = usageMap.get(id);
      return {
        id,
        email: u.email,
        preferredName: u.preferredName || "",
        phone: u.phone || "",
        status: u.status,
        role: u.role || "user",
        emailVerifiedAt: u.emailVerifiedAt,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        aiReady,
        aiProfileMissing,
        aiUsage: {
          callCount: usage?.callCount ?? 0,
          totalTokens: usage?.totalTokens ?? 0,
          estimatedCostUsd: formatUsd(usage?.estimatedCostUsd ?? 0),
          lastCallAt: usage?.lastCallAt ?? null,
        },
      };
    });

    res.json({ users: rows, total, skip, limit });
  } catch (err) {
    console.error("[admin/users]", err);
    res.status(500).json({ error: err.message });
  }
}

export async function updateUserRole(req, res) {
  try {
    const targetId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const role = String(req.body?.role || "").trim();
    if (role !== "user" && role !== "admin") {
      return res.status(400).json({ error: 'role must be "user" or "admin"' });
    }

    if (String(req.adminUser._id) === String(targetId) && role !== "admin") {
      return res.status(400).json({ error: "Cannot demote your own admin account" });
    }

    const user = await User.findByIdAndUpdate(targetId, { $set: { role } }, { new: true }).select(
      "email role preferredName"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: role === "admin" ? "User promoted to admin" : "User demoted to user",
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[admin/updateUserRole]", err);
    res.status(500).json({ error: err.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const targetId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    if (String(req.adminUser._id) === String(targetId)) {
      return res.status(400).json({ error: "Cannot delete your own admin account" });
    }

    const user = await User.findById(targetId).select("email");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const email = normalizeEmail(user.email);

    await Promise.all([
      MilitaryStats.deleteOne({ userId: targetId }),
      Preferences.deleteOne({ userId: targetId }),
      AiUsageLog.deleteMany({ userId: targetId }),
      EmailOtp.deleteMany({ email }),
      User.deleteOne({ _id: targetId }),
    ]);

    res.json({ message: "User and related data deleted", deletedUserId: targetId, email });
  } catch (err) {
    console.error("[admin/deleteUser]", err);
    res.status(500).json({ error: err.message });
  }
}
