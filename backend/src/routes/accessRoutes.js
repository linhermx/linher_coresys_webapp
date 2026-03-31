import { Router } from "express";
import {
  createAccessRecord,
  listAccess,
} from "../controllers/accessController.js";

const accessRoutes = Router();

accessRoutes.get("/", listAccess);
accessRoutes.post("/", createAccessRecord);

export default accessRoutes;
