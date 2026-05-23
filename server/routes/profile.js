import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { updateProfile } from "../controllers/profileController.js";

const router = Router();

router.put("/update", authenticateToken, updateProfile);

export default router;
