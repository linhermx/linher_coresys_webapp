import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";
import accessRoutes from "./accessRoutes.js";
import assetsRoutes from "./assetsRoutes.js";
import authRoutes from "./authRoutes.js";
import infrastructureRoutes from "./infrastructureRoutes.js";
import inventoryRoutes from "./inventoryRoutes.js";
import servicesRoutes from "./servicesRoutes.js";
import telephonyRoutes from "./telephonyRoutes.js";
import ticketsRoutes from "./ticketsRoutes.js";
import usersRoutes from "./usersRoutes.js";

const apiRoutes = Router();

apiRoutes.get("/health", getHealth);
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/users", usersRoutes);
apiRoutes.use("/tickets", ticketsRoutes);
apiRoutes.use("/inventory", inventoryRoutes);
apiRoutes.use("/telephony", telephonyRoutes);
apiRoutes.use("/services", servicesRoutes);
apiRoutes.use("/access", accessRoutes);
apiRoutes.use("/infrastructure", infrastructureRoutes);
apiRoutes.use("/assets", assetsRoutes);

export default apiRoutes;
