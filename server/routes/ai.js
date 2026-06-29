import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { enforceTokenCap } from "../middleware/enforceTokenCap.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { validateFitnessBody, validateReportPdfBody } from "../validators/ai.js";
import { matchRoles } from "../controllers/aiController.js";
import { generateReport, downloadReportPdf } from "../controllers/reportController.js";
import { validateObjectIdParam } from "../validators/admin.js";
import {
  listMatchHistory,
  getMatchHistory,
  deleteMatchHistory,
} from "../controllers/matchHistoryController.js";

const router = Router();

router.post("/match-roles", authenticateToken, enforceTokenCap, matchRoles);
router.post("/full-report", authenticateToken, enforceTokenCap, validateRequest(validateFitnessBody), generateReport);
router.post("/report-pdf", authenticateToken, validateRequest(validateReportPdfBody), downloadReportPdf);

router.get("/match-history", authenticateToken, listMatchHistory);
router.get("/match-history/:id", authenticateToken, validateRequest(validateObjectIdParam("id")), getMatchHistory);
router.delete("/match-history/:id", authenticateToken, validateRequest(validateObjectIdParam("id")), deleteMatchHistory);

export default router;
