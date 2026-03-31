import { AUDIT_ACTIONS, AUDIT_LOG_BLUEPRINT } from "../config/audit.js";

const resolveModuleName = (action) => action.split(".")[0] ?? "system";

export const buildAuditLogDraft = ({
  action,
  operatorId = null,
  operatorRole = null,
  entityId = null,
  entityName = "system_event",
  beforeSnapshot = null,
  afterSnapshot = null,
  metadata = {},
  requestContext = {},
}) => ({
  operator_id: operatorId,
  operator_role: operatorRole,
  module_name: resolveModuleName(action),
  action_key: action,
  entity_name: entityName,
  entity_id: entityId,
  before_snapshot: beforeSnapshot,
  after_snapshot: afterSnapshot,
  metadata,
  ip_address: requestContext.ipAddress ?? null,
  user_agent: requestContext.userAgent ?? null,
  created_at: new Date().toISOString(),
});

export const getAuditBlueprint = () => ({
  ...AUDIT_LOG_BLUEPRINT,
  supportedActions: AUDIT_ACTIONS,
});
