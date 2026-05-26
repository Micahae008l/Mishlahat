import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { matchRoles } from "../controllers/aiController.js";
import { generateReport, downloadReportPdf } from "../controllers/reportController.js";

const router = Router();

router.post("/match-roles", authenticateToken, matchRoles);
router.post("/full-report", authenticateToken, generateReport);
router.post("/report-pdf", authenticateToken, downloadReportPdf);

export default router;
