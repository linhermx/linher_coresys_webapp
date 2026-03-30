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
          action: "assets.read",
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
      message: "Registro de activos pendiente de implementacion.",
      data: {
        payload: req.body ?? {},
        blueprint: getAssetModuleBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "assets.write",
          metadata: { source: "createAsset", stage: "blueprint" },
          requestContext: req.context,
        }),
      },
    }),
  );
};

