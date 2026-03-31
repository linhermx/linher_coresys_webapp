import { Router } from "express";
import {
  createInfrastructureRecord,
  listInfrastructure,
} from "../controllers/infrastructureController.js";

const infrastructureRoutes = Router();

infrastructureRoutes.get("/", listInfrastructure);
infrastructureRoutes.post("/", createInfrastructureRecord);

export default infrastructureRoutes;
