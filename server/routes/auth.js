import { Router } from "express";
import { login, register, requestOtp, verifyOtp } from "../controllers/authController.js";

const router = Router();

router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", register);
router.post("/login", login);

export default router;
