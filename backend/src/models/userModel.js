export const userModel = {
  entity: "users",
  primaryKey: "id",
  fields: [
    "id",
    "name",
    "email",
    "role_id",
    "photo_path",
    "status",
    "created_at",
    "updated_at",
  ],
  relations: ["roles", "user_permissions", "refresh_tokens", "audit_logs"],
};
