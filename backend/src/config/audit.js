export const AUDIT_LOG_BLUEPRINT = {
  entity: "audit_logs",
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
  requiredFields: ["module_name", "action_key", "entity_name", "created_at"],
};

export const AUDIT_ACTIONS = [
  "auth.login",
  "auth.logout",
  "users.view",
  "users.update",
  "tickets.view",
  "tickets.create",
  "tickets.update",
  "tickets.assign",
  "assets.view",
  "assets.create",
  "assets.update",
  "assets.assign",
];
