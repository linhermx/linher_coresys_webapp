import { buildAuditLogDraft } from "../services/auditService.js";
import { getInventoryBlueprint } from "../services/inventoryService.js";
import { createSuccessResponse } from "../utils/apiResponse.js";

export const listInventory = (req, res) => {
  res.json(
    createSuccessResponse({
      message: "Blueprint base de inventario disponible.",
      data: {
        items: [],
        blueprint: getInventoryBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "inventory.view",
          entityName: "assets",
          metadata: { source: "listInventory", domain: "inventory" },
          requestContext: req.context,
        }),
      },
    }),
  );
};

export const createInventoryRecord = (req, res) => {
  res.status(202).json(
    createSuccessResponse({
      message: "Registro base de inventario pendiente de implementación.",
      data: {
        payload: req.body ?? {},
        blueprint: getInventoryBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "inventory.create",
          entityName: "assets",
          afterSnapshot: { stage: "blueprint", status: "draft" },
          metadata: { source: "createInventoryRecord", domain: "inventory" },
          requestContext: req.context,
        }),
      },
    }),
  );
};
