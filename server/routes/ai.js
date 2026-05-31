import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { enforceTokenCap } from "../middleware/enforceTokenCap.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { validateFitnessBody, validateReportPdfBody } from "../validators/ai.js";
import { matchRoles } from "../controllers/aiController.js";
import { generateReport, downloadReportPdf } from "../controllers/reportController.js";

const router = Router();

router.post("/match-roles", authenticateToken, enforceTokenCap, matchRoles);
router.post("/full-report", authenticateToken, enforceTokenCap, validateRequest(validateFitnessBody), generateReport);
router.post("/report-pdf", authenticateToken, validateRequest(validateReportPdfBody), downloadReportPdf);

export default router;
