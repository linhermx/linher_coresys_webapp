import { Router } from "express";
import {
  getAccessStructure,
  getUserById,
  listUsers,
} from "../controllers/usersController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const usersRoutes = Router();

usersRoutes.get("/", requireAuth, requirePermission("users.view"), listUsers);
usersRoutes.get(
  "/meta/rbac",
  requireAuth,
  requirePermission("users.view"),
  getAccessStructure,
);
usersRoutes.get("/:userId", requireAuth, requirePermission("users.view"), getUserById);

export default usersRoutes;
