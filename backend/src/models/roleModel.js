export const roleModel = {
  entity: "roles",
  primaryKey: "id",
  fields: ["id", "key", "label", "description", "created_at", "updated_at"],
  relations: ["role_permissions"],
};

