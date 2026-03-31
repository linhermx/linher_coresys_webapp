import { Router } from "express";
import {
  createServiceRecord,
  listServices,
} from "../controllers/servicesController.js";

const servicesRoutes = Router();

servicesRoutes.get("/", listServices);
servicesRoutes.post("/", createServiceRecord);

export default servicesRoutes;
