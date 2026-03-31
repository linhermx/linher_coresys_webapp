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
          action: "tickets.view",
          entityName: "tickets",
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
      message: "Creación de tickets pendiente de lógica de negocio.",
      data: {
        payload: req.body ?? {},
        blueprint: getTicketModuleBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "tickets.create",
          entityName: "tickets",
          afterSnapshot: { stage: "blueprint", status: "draft" },
          metadata: { source: "createTicket", stage: "blueprint" },
          requestContext: req.context,
        }),
      },
    }),
  );
};
