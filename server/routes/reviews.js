import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { validateCreateReview } from "../validators/reviews.js";
import RoleReview from "../models/RoleReview.js";

const router = Router();

/** GET /api/reviews?roleSlug=xxx — public, no auth required */
router.get("/", async (req, res) => {
  try {
    const { roleSlug } = req.query;
    const filter = {};
    if (roleSlug && typeof roleSlug === "string") {
      filter.roleSlug = roleSlug.trim().toLowerCase();
    }
    const reviews = await RoleReview.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .select("-userId")
      .lean();
    res.json({ reviews });
  } catch (err) {
    console.error("[reviews] GET error:", err);
    res.status(500).json({ error: "שגיאה בטעינת ביקורות" });
  }
});

/** GET /api/reviews/stats?roleSlug=xxx — aggregate stats for a role */
router.get("/stats", async (req, res) => {
  try {
    const { roleSlug } = req.query;
    if (!roleSlug || typeof roleSlug !== "string") {
      return res.json({ stats: null });
    }
    const slug = roleSlug.trim().toLowerCase();
    const pipeline = [
      { $match: { roleSlug: slug } },
      {
        $group: {
          _id: "$roleSlug",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          avgDifficulty: { $avg: "$difficulty" },
          recommendCount: {
            $sum: { $cond: ["$wouldRecommend", 1, 0] },
          },
        },
      },
    ];
    const [result] = await RoleReview.aggregate(pipeline);
    if (!result) {
      return res.json({ stats: null });
    }
    res.json({
      stats: {
        count: result.count,
        avgRating: Math.round(result.avgRating * 10) / 10,
        avgDifficulty: Math.round(result.avgDifficulty * 10) / 10,
        recommendPct: Math.round((result.recommendCount / result.count) * 100),
      },
    });
  } catch (err) {
    console.error("[reviews] stats error:", err);
    res.status(500).json({ error: "שגיאה בטעינת סטטיסטיקות" });
  }
});

/** GET /api/reviews/all-stats — aggregate stats for all roles at once */
router.get("/all-stats", async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: "$roleSlug",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          avgDifficulty: { $avg: "$difficulty" },
          recommendCount: {
            $sum: { $cond: ["$wouldRecommend", 1, 0] },
          },
        },
      },
    ];
    const results = await RoleReview.aggregate(pipeline);
    const statsMap = {};
    for (const r of results) {
      statsMap[r._id] = {
        count: r.count,
        avgRating: Math.round(r.avgRating * 10) / 10,
        avgDifficulty: Math.round(r.avgDifficulty * 10) / 10,
        recommendPct: Math.round((r.recommendCount / r.count) * 100),
      };
    }
    res.json({ stats: statsMap });
  } catch (err) {
    console.error("[reviews] all-stats error:", err);
    res.status(500).json({ error: "שגיאה בטעינת סטטיסטיקות" });
  }
});

/** POST /api/reviews — create a review (auth required, one per user per role) */
router.post(
  "/",
  authenticateToken,
  validateRequest(validateCreateReview),
  async (req, res) => {
    try {
      const userId = req.userId;
      const { roleSlug, roleTitle, rating, difficulty, wouldRecommend, pros, cons, tip } =
        req.body;

      const existing = await RoleReview.findOne({ userId, roleSlug });
      if (existing) {
        existing.roleTitle = roleTitle;
        existing.rating = rating;
        existing.difficulty = difficulty;
        existing.wouldRecommend = wouldRecommend;
        existing.pros = pros;
        existing.cons = cons;
        existing.tip = tip;
        await existing.save();
        return res.json({ message: "הביקורת עודכנה", review: stripUserId(existing) });
      }

      const review = await RoleReview.create({
        userId,
        roleSlug,
        roleTitle,
        rating,
        difficulty,
        wouldRecommend,
        pros,
        cons,
        tip,
      });
      res.status(201).json({ message: "הביקורת נשמרה", review: stripUserId(review) });
    } catch (err) {
      console.error("[reviews] POST error:", err);
      res.status(500).json({ error: "שגיאה בשמירת ביקורת" });
    }
  },
);

/** DELETE /api/reviews/:id — delete own review */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const review = await RoleReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "ביקורת לא נמצאה" });
    }
    if (review.userId.toString() !== req.userId) {
      return res.status(403).json({ error: "אין הרשאה למחוק ביקורת זו" });
    }
    await review.deleteOne();
    res.json({ message: "הביקורת נמחקה" });
  } catch (err) {
    console.error("[reviews] DELETE error:", err);
    res.status(500).json({ error: "שגיאה במחיקת ביקורת" });
  }
});

function stripUserId(doc) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.userId;
  return obj;
}

export default router;
