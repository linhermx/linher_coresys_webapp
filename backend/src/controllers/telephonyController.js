import { buildAuditLogDraft } from "../services/auditService.js";
import { getTelephonyBlueprint } from "../services/telephonyService.js";
import { createSuccessResponse } from "../utils/apiResponse.js";

export const listTelephony = (req, res) => {
  res.json(
    createSuccessResponse({
      message: "Blueprint base de telefonía disponible.",
      data: {
        items: [],
        blueprint: getTelephonyBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "telephony.view",
          entityName: "phone_lines",
          metadata: { source: "listTelephony", domain: "telephony" },
          requestContext: req.context,
        }),
      },
    }),
  );
};

export const createTelephonyRecord = (req, res) => {
  res.status(202).json(
    createSuccessResponse({
      message: "Registro base de telefonía pendiente de implementación.",
      data: {
        payload: req.body ?? {},
        blueprint: getTelephonyBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "telephony.create",
          entityName: "phone_lines",
          afterSnapshot: { stage: "blueprint", status: "draft" },
          metadata: { source: "createTelephonyRecord", domain: "telephony" },
          requestContext: req.context,
        }),
      },
    }),
  );
};
