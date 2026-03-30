import { Router } from "express";
import { getSession, login, logout } from "../controllers/authController.js";

const authRoutes = Router();

authRoutes.get("/session", getSession);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);

export default authRoutes;

