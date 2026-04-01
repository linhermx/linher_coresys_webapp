import { Router } from "express";
import {
  createTelephonyRecord,
  listTelephony,
} from "../controllers/telephonyController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const telephonyRoutes = Router();

telephonyRoutes.get("/", requireAuth, requirePermission("telephony.view"), listTelephony);
telephonyRoutes.post(
  "/",
  requireAuth,
  requirePermission("telephony.create"),
  createTelephonyRecord,
);

export default telephonyRoutes;
