import User from "../models/User.js";
import { applyUserPatch, applyStatsPatch, applyPreferencesPatch } from "../utils/profileApply.js";

export async function updateProfile(req, res) {
  try {
    const { status, stats, preferences, user: userPatch } = req.body;
    const userId = req.userId;

    if (userPatch && typeof userPatch === "object" && Object.keys(userPatch).length > 0) {
      await applyUserPatch(userId, userPatch);
    }
    if (status) {
      await User.findByIdAndUpdate(userId, { status });
    }

    if (stats && typeof stats === "object") {
      await applyStatsPatch(userId, stats);
    }

    if (preferences && typeof preferences === "object") {
      await applyPreferencesPatch(userId, preferences);
    }

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
