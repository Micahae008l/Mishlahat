import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { matchRoles } from "../controllers/aiController.js";

const router = Router();

router.post("/match-roles", authenticateToken, matchRoles);

export default router;
