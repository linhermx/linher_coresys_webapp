import { buildAuditLogDraft, getAuditBlueprint } from "../services/auditService.js";
import { getAuthBlueprint } from "../services/authService.js";
import { createSuccessResponse } from "../utils/apiResponse.js";

export const getSession = (req, res) => {
  res.json(
    createSuccessResponse({
      message: "Blueprint de sesión disponible.",
      data: {
        session: {
          authenticated: false,
          user: null,
        },
        auth: getAuthBlueprint(),
      },
      meta: {
        requestId: req.context.requestId,
      },
    }),
  );
};

export const login = (req, res) => {
  res.status(202).json(
    createSuccessResponse({
      message: "Endpoint base de login creado sin lógica real.",
      data: {
        identifier: req.body?.username ?? req.body?.email ?? null,
        auth: getAuthBlueprint(),
        auditDraft: buildAuditLogDraft({
          action: "auth.login",
          entityName: "refresh_tokens",
          afterSnapshot: { stage: "blueprint", status: "issued" },
          metadata: { stage: "blueprint" },
          requestContext: req.context,
        }),
      },
      meta: getAuditBlueprint(),
    }),
  );
};

export const logout = (req, res) => {
  res.status(202).json(
    createSuccessResponse({
      message: "Endpoint base de logout creado sin invalidación real.",
      data: {
        auditDraft: buildAuditLogDraft({
          action: "auth.logout",
          entityName: "refresh_tokens",
          beforeSnapshot: { stage: "blueprint", status: "active" },
          afterSnapshot: { stage: "blueprint", status: "revoked" },
          metadata: { stage: "blueprint" },
          requestContext: req.context,
        }),
      },
    }),
  );
};
