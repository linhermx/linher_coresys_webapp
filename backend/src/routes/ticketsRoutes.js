import { Router } from "express";
import {
  createTicket,
  listTickets,
} from "../controllers/ticketsController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const ticketsRoutes = Router();

ticketsRoutes.get("/", requireAuth, requirePermission("tickets.view"), listTickets);
ticketsRoutes.post("/", requireAuth, requirePermission("tickets.create"), createTicket);

export default ticketsRoutes;
