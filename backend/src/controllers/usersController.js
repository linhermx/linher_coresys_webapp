import { buildAuditLogDraft, recordAuditLog } from "../services/auditService.js";
import { getRbacBlueprint } from "../services/rbacService.js";
import {
  getUserByIdWithPermissions,
  getUserProfileBlueprint,
  getUsersBlueprint,
  listUsersCatalog,
} from "../services/userService.js";
import { createSuccessResponse } from "../utils/apiResponse.js";

export const listUsers = async (req, res, next) => {
  try {
    const items = await listUsersCatalog({
      search: req.query.search ?? "",
      status: req.query.status ?? "",
    });

    await recordAuditLog(
      buildAuditLogDraft({
        action: "users.view",
        operatorId: req.authUser?.id ?? null,
        operatorRole: req.authUser?.role_name ?? null,
        entityName: "users",
        metadata: {
          source: "listUsers",
          total: items.length,
        },
        requestContext: req.context,
      }),
    );

    res.json(
      createSuccessResponse({
        message: "Catálogo de usuarios disponible.",
        data: {
          items,
          blueprint: getUsersBlueprint(),
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

export const getUserById = async (req, res, next) => {
  try {
    const user = await getUserByIdWithPermissions(Number(req.params.userId));

    if (!user) {
      const error = new Error("Usuario no encontrado.");
      error.code = "user_not_found";
      error.statusCode = 404;
      throw error;
    }

    res.json(
      createSuccessResponse({
        message: "Detalle de usuario disponible.",
        data: {
          ...getUserProfileBlueprint(req.params.userId),
          profile: user,
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

export const getAccessStructure = (_req, res) => {
  res.json(
    createSuccessResponse({
      message: "Catálogo RBAC disponible.",
      data: getRbacBlueprint(),
    }),
  );
};
