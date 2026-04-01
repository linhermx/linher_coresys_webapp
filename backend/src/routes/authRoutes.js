import { Router } from "express";
import {
  getCurrentUser,
  getSession,
  login,
  logout,
  refresh,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const authRoutes = Router();

authRoutes.get("/session", requireAuth, getSession);
authRoutes.get("/me", requireAuth, getCurrentUser);
authRoutes.post("/login", login);
authRoutes.post("/refresh", refresh);
authRoutes.post("/logout", requireAuth, logout);

export default authRoutes;
