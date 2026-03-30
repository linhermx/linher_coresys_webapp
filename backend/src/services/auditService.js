import { AUDIT_ACTIONS, AUDIT_LOG_BLUEPRINT } from "../config/audit.js";

const resolveModuleName = (action) => action.split(".")[0] ?? "system";

export const buildAuditLogDraft = ({
  action,
  actorId = null,
  actorRole = null,
  metadata = {},
  requestContext = {},
  targetId = null,
  targetType = null,
}) => ({
  actor_id: actorId,
  actor_role: actorRole,
  module_name: resolveModuleName(action),
  action_key: action,
  target_type: targetType,
  target_id: targetId,
  metadata,
  ip_address: requestContext.ipAddress ?? null,
  user_agent: requestContext.userAgent ?? null,
  created_at: new Date().toISOString(),
});

export const getAuditBlueprint = () => ({
  ...AUDIT_LOG_BLUEPRINT,
  supportedActions: AUDIT_ACTIONS,
});
