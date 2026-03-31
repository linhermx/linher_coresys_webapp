export const permissionModel = {
  entity: "permissions",
  primaryKey: "id",
  fields: ["id", "slug", "name", "created_at"],
  relations: ["role_permissions", "user_permissions"],
};
