import { Router } from "express";
import {
  createTelephonyRecord,
  listTelephony,
} from "../controllers/telephonyController.js";

const telephonyRoutes = Router();

telephonyRoutes.get("/", listTelephony);
telephonyRoutes.post("/", createTelephonyRecord);

export default telephonyRoutes;
