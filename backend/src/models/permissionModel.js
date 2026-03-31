export const permissionModel = {
  entity: "permissions",
  primaryKey: "id",
  fields: [
    "id",
    "resource_key",
    "action_key",
    "permission_key",
    "label",
    "description",
    "created_at",
  ],
  relations: ["role_permissions"],
};
