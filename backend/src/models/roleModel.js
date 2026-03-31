export const roleModel = {
  entity: "roles",
  primaryKey: "id",
  fields: ["id", "name", "description", "created_at"],
  relations: ["role_permissions", "users"],
};
