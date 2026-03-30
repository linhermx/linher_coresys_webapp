export const AUDIT_LOG_BLUEPRINT = {
  entity: "audit_logs",
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
  requiredFields: ["module_name", "action_key", "created_at"],
};

export const AUDIT_ACTIONS = [
  "auth.login",
  "auth.logout",
  "users.read",
  "tickets.read",
  "tickets.write",
  "assets.read",
  "assets.write",
];
