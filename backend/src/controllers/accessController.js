import { buildAuditLogDraft } from "../services/auditService.js";
import { getAccessBlueprint } from "../services/accessService.js";
import { createSuccessResponse } from "../utils/apiResponse.js";

export const listAccess = (req, res) => {
  res.json(
    createSuccessResponse({
      message: "Blueprint base de accesos disponible.",
      data: {
        items: [],
        blueprint: getAccessBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "access.view_sensitive",
          entityName: "access_accounts",
          metadata: { source: "listAccess", domain: "access" },
          requestContext: req.context,
        }),
      },
    }),
  );
};

export const createAccessRecord = (req, res) => {
  res.status(202).json(
    createSuccessResponse({
      message: "Registro base de accesos pendiente de implementación.",
      data: {
        payload: req.body ?? {},
        blueprint: getAccessBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "access.create",
          entityName: "access_accounts",
          afterSnapshot: { stage: "blueprint", status: "draft" },
          metadata: { source: "createAccessRecord", domain: "access" },
          requestContext: req.context,
        }),
      },
    }),
  );
};
