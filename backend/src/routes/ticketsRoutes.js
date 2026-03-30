import { Router } from "express";
import {
  createTicket,
  listTickets,
} from "../controllers/ticketsController.js";

const ticketsRoutes = Router();

ticketsRoutes.get("/", listTickets);
ticketsRoutes.post("/", createTicket);

export default ticketsRoutes;

