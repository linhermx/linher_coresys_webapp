export const auditLogModel = {
  entity: "audit_logs",
  primaryKey: "id",
  fields: [
    "id",
    "actor_id",
    "actor_role",
    "module_name",
    "action_key",
    "target_type",
    "target_id",
    "metadata",
    "ip_address",
    "user_agent",
    "created_at",
  ],
};
