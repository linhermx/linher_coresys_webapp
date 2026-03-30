export const userModel = {
  entity: "users",
  primaryKey: "id",
  fields: [
    "id",
    "employee_code",
    "name",
    "email",
    "status",
    "created_at",
    "updated_at",
  ],
  relations: ["user_roles", "audit_logs"],
};

