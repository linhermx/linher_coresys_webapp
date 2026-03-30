import { buildAuditLogDraft } from "../services/auditService.js";
import { getTicketModuleBlueprint } from "../services/ticketService.js";
import { createSuccessResponse } from "../utils/apiResponse.js";

export const listTickets = (req, res) => {
  res.json(
    createSuccessResponse({
      message: "Endpoint base de tickets listo sin persistencia.",
      data: {
        items: [],
        blueprint: getTicketModuleBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "tickets.read",
          metadata: { source: "listTickets" },
          requestContext: req.context,
        }),
      },
    }),
  );
};

export const createTicket = (req, res) => {
  res.status(202).json(
    createSuccessResponse({
      message: "Creacion de tickets pendiente de logica de negocio.",
      data: {
        payload: req.body ?? {},
        blueprint: getTicketModuleBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "tickets.write",
          metadata: { source: "createTicket", stage: "blueprint" },
          requestContext: req.context,
        }),
      },
    }),
  );
};

