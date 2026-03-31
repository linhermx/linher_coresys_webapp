export const userModel = {
  entity: "users",
  primaryKey: "id",
  fields: [
    "id",
    "user_key",
    "employee_code",
    "first_name",
    "last_name",
    "display_name",
    "email",
    "status",
    "timezone",
    "last_login_at",
    "created_at",
    "updated_at",
  ],
  relations: ["user_roles", "auth_sessions", "audit_logs"],
};
