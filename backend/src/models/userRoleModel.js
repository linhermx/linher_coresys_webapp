export const userRoleModel = {
  entity: "user_roles",
  primaryKey: "id",
  fields: [
    "id",
    "user_id",
    "role_id",
    "assigned_at",
    "assigned_by",
    "created_at",
  ],
  relations: ["users", "roles"],
};
