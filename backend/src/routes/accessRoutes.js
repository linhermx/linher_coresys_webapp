import { Router } from "express";
import {
  createAccessRecord,
  listAccess,
} from "../controllers/accessController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const accessRoutes = Router();

accessRoutes.get("/", requireAuth, requirePermission("access.view_sensitive"), listAccess);
accessRoutes.post("/", requireAuth, requirePermission("access.create"), createAccessRecord);

export default accessRoutes;
