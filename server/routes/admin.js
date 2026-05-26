import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import {
  getAdminMe,
  getOverview,
  listUsers,
  updateUserRole,
  deleteUser,
} from "../controllers/adminController.js";

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get("/me", getAdminMe);
router.get("/overview", getOverview);
router.get("/users", listUsers);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

export default router;
