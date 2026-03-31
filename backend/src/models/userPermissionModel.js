export const userPermissionModel = {
  entity: "user_permissions",
  primaryKey: null,
  fields: ["user_id", "permission_id", "granted"],
  relations: ["users", "permissions"],
};
