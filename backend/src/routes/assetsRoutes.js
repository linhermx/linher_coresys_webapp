import { Router } from "express";
import {
  createAsset,
  listAssets,
} from "../controllers/assetsController.js";

const assetsRoutes = Router();

assetsRoutes.get("/", listAssets);
assetsRoutes.post("/", createAsset);

export default assetsRoutes;
