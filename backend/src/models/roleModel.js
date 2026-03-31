export const roleModel = {
  entity: "roles",
  primaryKey: "id",
  fields: [
    "id",
    "role_key",
    "label",
    "description",
    "status",
    "created_at",
    "updated_at",
  ],
  relations: ["role_permissions", "user_roles"],
};
