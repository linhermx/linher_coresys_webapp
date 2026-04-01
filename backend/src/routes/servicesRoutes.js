import { Router } from "express";
import {
  createServiceRecord,
  listServices,
} from "../controllers/servicesController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const servicesRoutes = Router();

servicesRoutes.get("/", requireAuth, requirePermission("services.view"), listServices);
servicesRoutes.post("/", requireAuth, requirePermission("services.create"), createServiceRecord);

export default servicesRoutes;
