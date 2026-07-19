import { Router } from "express";
import { getRole, listRoles } from "../controllers/rolesController.js";

const router = Router();

router.get("/", listRoles);
router.get("/:slugOrTitle", getRole);

export default router;
