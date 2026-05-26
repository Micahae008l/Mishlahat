import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  listReportHistory,
  getReportHistory,
  deleteReportHistory,
} from "../controllers/reportHistoryController.js";

const router = Router();

router.use(authenticateToken);

router.get("/", listReportHistory);
router.get("/:id", getReportHistory);
router.delete("/:id", deleteReportHistory);

export default router;
