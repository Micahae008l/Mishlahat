import { Router } from "express";
import { getRole, listRoles } from "../controllers/rolesController.js";
import { listApprovedReviews, submitReview } from "../controllers/roleReviewsController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get("/", listRoles);
router.get("/:slugOrTitle/reviews", listApprovedReviews);
router.post("/:slugOrTitle/reviews", authenticateToken, authLimiter, submitReview);
router.get("/:slugOrTitle", getRole);

export default router;
