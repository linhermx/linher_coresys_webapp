import { buildAuditLogDraft, recordAuditLog } from "../services/auditService.js";
import {
  createTicket as createTicketRecord,
  getTicketModuleBlueprint,
  getTicketSummary,
  listTicketCatalogs,
  listTickets as listTicketItems,
} from "../services/ticketService.js";
import { createSuccessResponse } from "../utils/apiResponse.js";

export const listTickets = async (req, res, next) => {
  try {
    const [items, catalogs, summary] = await Promise.all([
      listTicketItems({
        search: req.query.search ?? "",
        statusId: req.query.statusId ?? "",
        priorityId: req.query.priorityId ?? "",
      }),
      listTicketCatalogs(),
      getTicketSummary(),
    ]);

    await recordAuditLog(
      buildAuditLogDraft({
        action: "tickets.view",
        operatorId: req.authUser?.id ?? null,
        operatorRole: req.authUser?.role_name ?? null,
        entityName: "tickets",
        metadata: {
          source: "listTickets",
          total: items.length,
        },
        requestContext: req.context,
      }),
    );

    res.json(
      createSuccessResponse({
        message: "Bandeja de tickets disponible.",
        data: {
          items,
          catalogs,
          summary,
          blueprint: getTicketModuleBlueprint(),
        },
        meta: {
          requestId: req.context.requestId,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const createTicket = async (req, res, next) => {
  try {
    const ticket = await createTicketRecord({
      title: req.body?.title,
      description: req.body?.description,
      requesterName: req.body?.requesterName,
      requesterEmail: req.body?.requesterEmail,
      requesterArea: req.body?.requesterArea,
      priorityId: req.body?.priorityId,
      categoryId: req.body?.categoryId,
      assigneeUserId: req.body?.assigneeUserId,
      dueAt: req.body?.dueAt,
      authUser: req.authUser ?? null,
      requestContext: req.context,
    });

    res.status(201).json(
      createSuccessResponse({
        message: "Ticket registrado correctamente.",
        data: {
          item: ticket,
        },
        meta: {
          requestId: req.context.requestId,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};
