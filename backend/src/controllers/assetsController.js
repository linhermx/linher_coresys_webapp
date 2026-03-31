import { buildAuditLogDraft } from "../services/auditService.js";
import { getAssetModuleBlueprint } from "../services/assetService.js";
import { createSuccessResponse } from "../utils/apiResponse.js";

export const listAssets = (req, res) => {
  res.json(
    createSuccessResponse({
      message: "Endpoint base de activos listo sin consultas reales.",
      data: {
        items: [],
        blueprint: getAssetModuleBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "assets.view",
          entityName: "assets",
          metadata: { source: "listAssets" },
          requestContext: req.context,
        }),
      },
    }),
  );
};

export const createAsset = (req, res) => {
  res.status(202).json(
    createSuccessResponse({
      message: "Registro de activos pendiente de implementación.",
      data: {
        payload: req.body ?? {},
        blueprint: getAssetModuleBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "assets.create",
          entityName: "assets",
          afterSnapshot: { stage: "blueprint", status: "draft" },
          metadata: { source: "createAsset", stage: "blueprint" },
          requestContext: req.context,
        }),
      },
    }),
  );
};
