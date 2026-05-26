import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getSession, login, register, requestOtp, verifyOtp } from "../controllers/authController.js";

const router = Router();

router.get("/me", authenticateToken, getSession);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", register);
router.post("/login", login);

export default router;
