import { buildAuditLogDraft } from "../services/auditService.js";
import { getRbacBlueprint } from "../services/rbacService.js";
import {
  getUserProfileBlueprint,
  getUsersBlueprint,
} from "../services/userService.js";
import { createSuccessResponse } from "../utils/apiResponse.js";

export const listUsers = (req, res) => {
  res.json(
    createSuccessResponse({
      message: "Módulo base de usuarios listo para modelado.",
      data: {
        items: [],
        blueprint: getUsersBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "users.view",
          entityName: "users",
          metadata: { source: "listUsers" },
          requestContext: req.context,
        }),
      },
    }),
  );
};

export const getUserById = (req, res) => {
  res.json(
    createSuccessResponse({
      message: "Detalle placeholder de usuario disponible.",
      data: getUserProfileBlueprint(req.params.userId),
    }),
  );
};

export const getAccessStructure = (_req, res) => {
  res.json(
    createSuccessResponse({
      message: "Catálogo RBAC disponible.",
      data: getRbacBlueprint(),
    }),
  );
};
