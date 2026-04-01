import { AUDIT_ACTIONS, AUDIT_LOG_BLUEPRINT } from "../config/audit.js";
import { getPool } from "../config/database.js";

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

export const recordAuditLog = async (entry) => {
  const pool = getPool();
  const payload = {
    ...entry,
    before_snapshot:
      entry.before_snapshot === undefined ? null : entry.before_snapshot,
    after_snapshot: entry.after_snapshot === undefined ? null : entry.after_snapshot,
    metadata: entry.metadata === undefined ? null : entry.metadata,
  };

  const [result] = await pool.query(
    `
      INSERT INTO audit_logs (
        operator_id,
        operator_role,
        module_name,
        action_key,
        entity_name,
        entity_id,
        before_snapshot,
        after_snapshot,
        metadata,
        ip_address,
        user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.operator_id,
      payload.operator_role,
      payload.module_name,
      payload.action_key,
      payload.entity_name,
      payload.entity_id,
      payload.before_snapshot ? JSON.stringify(payload.before_snapshot) : null,
      payload.after_snapshot ? JSON.stringify(payload.after_snapshot) : null,
      payload.metadata ? JSON.stringify(payload.metadata) : null,
      payload.ip_address,
      payload.user_agent,
    ],
  );

  return result.insertId;
};
