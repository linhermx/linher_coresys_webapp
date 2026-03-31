export const auditLogModel = {
  entity: "audit_logs",
  primaryKey: "id",
  fields: [
    "id",
    "operator_id",
    "operator_role",
    "module_name",
    "action_key",
    "entity_name",
    "entity_id",
    "before_snapshot",
    "after_snapshot",
    "metadata",
    "ip_address",
    "user_agent",
    "created_at",
  ],
};
