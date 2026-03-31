import { buildAuditLogDraft } from "../services/auditService.js";
import { getServicesBlueprint } from "../services/servicesService.js";
import { createSuccessResponse } from "../utils/apiResponse.js";

export const listServices = (req, res) => {
  res.json(
    createSuccessResponse({
      message: "Blueprint base de servicios disponible.",
      data: {
        items: [],
        blueprint: getServicesBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "services.view",
          entityName: "services",
          metadata: { source: "listServices", domain: "services" },
          requestContext: req.context,
        }),
      },
    }),
  );
};

export const createServiceRecord = (req, res) => {
  res.status(202).json(
    createSuccessResponse({
      message: "Registro base de servicios pendiente de implementación.",
      data: {
        payload: req.body ?? {},
        blueprint: getServicesBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "services.create",
          entityName: "services",
          afterSnapshot: { stage: "blueprint", status: "draft" },
          metadata: { source: "createServiceRecord", domain: "services" },
          requestContext: req.context,
        }),
      },
    }),
  );
};
