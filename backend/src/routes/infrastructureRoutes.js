import { Router } from "express";
import {
  createInfrastructureRecord,
  listInfrastructure,
} from "../controllers/infrastructureController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const infrastructureRoutes = Router();

infrastructureRoutes.get(
  "/",
  requireAuth,
  requirePermission("infrastructure.view"),
  listInfrastructure,
);
infrastructureRoutes.post(
  "/",
  requireAuth,
  requirePermission("infrastructure.create"),
  createInfrastructureRecord,
);

export default infrastructureRoutes;
