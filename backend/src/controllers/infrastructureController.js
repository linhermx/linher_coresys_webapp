import { buildAuditLogDraft } from "../services/auditService.js";
import { getInfrastructureBlueprint } from "../services/infrastructureService.js";
import { createSuccessResponse } from "../utils/apiResponse.js";

export const listInfrastructure = (req, res) => {
  res.json(
    createSuccessResponse({
      message: "Blueprint base de infraestructura disponible.",
      data: {
        items: [],
        blueprint: getInfrastructureBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "infrastructure.view",
          entityName: "network_devices",
          metadata: { source: "listInfrastructure", domain: "infrastructure" },
          requestContext: req.context,
        }),
      },
    }),
  );
};

export const createInfrastructureRecord = (req, res) => {
  res.status(202).json(
    createSuccessResponse({
      message: "Registro base de infraestructura pendiente de implementación.",
      data: {
        payload: req.body ?? {},
        blueprint: getInfrastructureBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "infrastructure.create",
          entityName: "network_devices",
          afterSnapshot: { stage: "blueprint", status: "draft" },
          metadata: {
            source: "createInfrastructureRecord",
            domain: "infrastructure",
          },
          requestContext: req.context,
        }),
      },
    }),
  );
};
