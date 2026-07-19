import RoleReview from "../models/RoleReview.js";
import User from "../models/User.js";
import { getRoleInsightBySlug, getRoleInsightByTitle, roleSlug } from "../utils/roleInsights.js";

const BODY_MAX = 1200;
const NAME_MAX = 40;

function resolveRole(slugOrTitle) {
  const key = decodeURIComponent(String(slugOrTitle || "").trim());
  if (!key) return null;
  return getRoleInsightBySlug(key) || getRoleInsightByTitle(key) || getRoleInsightBySlug(roleSlug(key));
}

function publicReview(doc) {
  return {
    id: String(doc._id),
    roleTitle: doc.roleTitle,
    roleSlug: doc.roleSlug,
    displayName: doc.displayName,
    body: doc.body,
    rating: doc.rating,
    servedInRole: Boolean(doc.servedInRole),
    createdAt: doc.createdAt,
  };
}

function adminReview(doc) {
  return {
    ...publicReview(doc),
    status: doc.status,
    userEmail: doc.userEmail || "",
    userId: doc.userId ? String(doc.userId) : null,
    rejectReason: doc.rejectReason || "",
    moderatedAt: doc.moderatedAt,
    updatedAt: doc.updatedAt,
  };
}

/** Approved reviews for a role (public). */
export async function listApprovedReviews(req, res) {
  try {
    const role = resolveRole(req.params.slugOrTitle);
    if (!role) return res.status(404).json({ error: "התפקיד לא נמצא", code: "ROLE_NOT_FOUND" });

    const reviews = await RoleReview.find({ roleSlug: role.slug, status: "approved" })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ roleSlug: role.slug, roleTitle: role.roleTitle, reviews: reviews.map(publicReview) });
  } catch (err) {
    console.error("[roles/reviews/list]", err);
    res.status(500).json({ error: err.message });
  }
}

/** Submit a review — requires login; always starts as pending. */
export async function submitReview(req, res) {
  try {
    const role = resolveRole(req.params.slugOrTitle);
    if (!role) return res.status(404).json({ error: "התפקיד לא נמצא", code: "ROLE_NOT_FOUND" });

    const userId = req.userId;
    const user = await User.findById(userId).select("email preferredName").lean();
    if (!user) return res.status(401).json({ error: "יש להתחבר", code: "UNAUTHORIZED" });

    const body = String(req.body?.body || "").trim();
    if (body.length < 20) {
      return res.status(400).json({ error: "הביקורת קצרה מדי (לפחות 20 תווים)", code: "VALIDATION_ERROR" });
    }
    if (body.length > BODY_MAX) {
      return res.status(400).json({ error: `הביקורת ארוכה מדי (עד ${BODY_MAX} תווים)`, code: "VALIDATION_ERROR" });
    }

    let displayName = String(req.body?.displayName || user.preferredName || "").trim();
    if (!displayName && user.email) displayName = user.email.split("@")[0];
    displayName = displayName.slice(0, NAME_MAX);
    if (!displayName) {
      return res.status(400).json({ error: "נא להזין שם לתצוגה", code: "VALIDATION_ERROR" });
    }

    let rating = null;
    if (req.body?.rating != null && req.body.rating !== "") {
      const n = Number(req.body.rating);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        return res.status(400).json({ error: "דירוג חייב להיות בין 1 ל־5", code: "VALIDATION_ERROR" });
      }
      rating = n;
    }

    const servedInRole = Boolean(req.body?.servedInRole);

    const existingPending = await RoleReview.findOne({
      userId,
      roleSlug: role.slug,
      status: "pending",
    }).lean();
    if (existingPending) {
      return res.status(409).json({
        error: "כבר יש ביקורת ממתינה לאישור על התפקיד הזה. המתינו לאישור לפני שליחה נוספת.",
        code: "REVIEW_PENDING",
      });
    }

    const doc = await RoleReview.create({
      roleTitle: role.roleTitle,
      roleSlug: role.slug,
      displayName,
      body,
      rating,
      servedInRole,
      status: "pending",
      userId,
      userEmail: user.email || "",
    });

    res.status(201).json({
      message: "הביקורת נשלחה וממתינה לאישור צוות. היא לא תופיע מיד באתר.",
      review: { id: String(doc._id), status: "pending" },
    });
  } catch (err) {
    console.error("[roles/reviews/submit]", err);
    res.status(500).json({ error: err.message });
  }
}

/** Admin: list reviews by status. */
export async function adminListReviews(req, res) {
  try {
    const status = String(req.query.status || "pending").trim();
    const allowed = new Set(["pending", "approved", "rejected", "all"]);
    if (!allowed.has(status)) {
      return res.status(400).json({ error: "status לא תקין" });
    }

    const filter = status === "all" ? {} : { status };
    const reviews = await RoleReview.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    const pendingCount = await RoleReview.countDocuments({ status: "pending" });

    res.json({
      pendingCount,
      reviews: reviews.map(adminReview),
    });
  } catch (err) {
    console.error("[admin/role-reviews/list]", err);
    res.status(500).json({ error: err.message });
  }
}

/** Admin: approve or reject. */
export async function adminModerateReview(req, res) {
  try {
    const id = String(req.params.id || "").trim();
    const action = String(req.body?.action || "").trim();
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "action חייב להיות approve או reject" });
    }

    const doc = await RoleReview.findById(id);
    if (!doc) return res.status(404).json({ error: "ביקורת לא נמצאה" });

    if (action === "approve") {
      doc.status = "approved";
      doc.rejectReason = "";
    } else {
      doc.status = "rejected";
      doc.rejectReason = String(req.body?.reason || "").trim().slice(0, 200);
    }
    doc.moderatedAt = new Date();
    doc.moderatedBy = req.userId;
    await doc.save();

    res.json({
      message: action === "approve" ? "הביקורת אושרה ופורסמה" : "הביקורת נדחתה",
      review: adminReview(doc),
    });
  } catch (err) {
    console.error("[admin/role-reviews/moderate]", err);
    res.status(500).json({ error: err.message });
  }
}
