import { Router } from "express";
import {
  getAccessStructure,
  getUserById,
  listUsers,
} from "../controllers/usersController.js";

const usersRoutes = Router();

usersRoutes.get("/", listUsers);
usersRoutes.get("/meta/rbac", getAccessStructure);
usersRoutes.get("/:userId", getUserById);

export default usersRoutes;

