import { Router } from "express";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  validateAdminUserRole,
  validateAdminUserTokenCap,
  validateAdminUsersQuery,
  validateObjectIdParam,
} from "../validators/admin.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import {
  getAdminMe,
  getOverview,
  listUsers,
  updateUserRole,
  updateUserTokenCap,
  deleteUser,
} from "../controllers/adminController.js";

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get("/me", getAdminMe);
router.get("/overview", getOverview);
router.get("/users", validateRequest(validateAdminUsersQuery), listUsers);
router.patch("/users/:id/role", validateRequest(validateAdminUserRole), updateUserRole);
router.patch(
  "/users/:id/token-cap",
  validateRequest(validateAdminUserTokenCap),
  updateUserTokenCap
);
router.delete("/users/:id", validateRequest(validateObjectIdParam("id")), deleteUser);

export default router;
