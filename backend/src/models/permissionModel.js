export const permissionModel = {
  entity: "permissions",
  primaryKey: "id",
  fields: ["id", "key", "label", "description", "created_at"],
  relations: ["role_permissions"],
};

