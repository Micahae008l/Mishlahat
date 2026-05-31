import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { validateProfileUpdate } from "../validators/profile.js";
import { updateProfile } from "../controllers/profileController.js";

const router = Router();

router.put("/update", authenticateToken, validateRequest(validateProfileUpdate), updateProfile);

export default router;
