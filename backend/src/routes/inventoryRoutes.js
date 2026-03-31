import { Router } from "express";
import {
  createInventoryRecord,
  listInventory,
} from "../controllers/inventoryController.js";

const inventoryRoutes = Router();

inventoryRoutes.get("/", listInventory);
inventoryRoutes.post("/", createInventoryRecord);

export default inventoryRoutes;
