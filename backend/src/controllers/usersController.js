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
      message: "Modulo base de usuarios listo para modelado.",
      data: {
        items: [],
        blueprint: getUsersBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "users.read",
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
      message: "Catalogo RBAC disponible.",
      data: getRbacBlueprint(),
    }),
  );
};

