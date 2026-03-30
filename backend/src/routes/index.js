import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";
import assetsRoutes from "./assetsRoutes.js";
import authRoutes from "./authRoutes.js";
import ticketsRoutes from "./ticketsRoutes.js";
import usersRoutes from "./usersRoutes.js";

const apiRoutes = Router();

apiRoutes.get("/health", getHealth);
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/users", usersRoutes);
apiRoutes.use("/tickets", ticketsRoutes);
apiRoutes.use("/assets", assetsRoutes);

export default apiRoutes;

