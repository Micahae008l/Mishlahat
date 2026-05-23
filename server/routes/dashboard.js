import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getStats } from "../controllers/dashboardController.js";

const router = Router();

router.get("/stats", authenticateToken, getStats);

export default router;
