import { Router } from "express";
import {
  createAsset,
  listAssets,
} from "../controllers/assetsController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const assetsRoutes = Router();

assetsRoutes.get("/", requireAuth, requirePermission("inventory.view"), listAssets);
assetsRoutes.post("/", requireAuth, requirePermission("inventory.create"), createAsset);

export default assetsRoutes;
