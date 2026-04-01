import { Router } from "express";
import {
  createInventoryRecord,
  listInventory,
} from "../controllers/inventoryController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const inventoryRoutes = Router();

inventoryRoutes.get("/", requireAuth, requirePermission("inventory.view"), listInventory);
inventoryRoutes.post(
  "/",
  requireAuth,
  requirePermission("inventory.create"),
  createInventoryRecord,
);

export default inventoryRoutes;
