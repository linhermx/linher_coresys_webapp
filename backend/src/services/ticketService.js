import { ticketModel } from "../models/ticketModel.js";

export const getTicketModuleBlueprint = () => ({
  model: ticketModel,
  queueStrategy: "pending-definition",
  workflows: ["new", "in_progress", "resolved", "closed"],
});

