import { Router } from "express";
import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  listProducts,
  getEntitlement,
  createCheckout,
  paymentWebhook,
  mockConfirm,
} from "../controllers/paymentsController.js";

const router = Router();

// Public
router.get("/products", listProducts);
// Processor callback — Grow posts form-encoded data, so parse it here (global json won't).
router.post("/webhook", express.urlencoded({ extended: false }), express.json(), paymentWebhook);

// Authenticated
router.get("/entitlement", authenticateToken, getEntitlement);
router.post("/checkout", authenticateToken, createCheckout);
router.post("/mock/confirm", authenticateToken, mockConfirm);

export default router;
