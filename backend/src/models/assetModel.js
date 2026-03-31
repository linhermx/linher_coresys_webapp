// Entidad relacional base que respalda el dominio visible de inventory.
export const assetModel = {
  entity: "assets",
  primaryKey: "id",
  fields: [
    "id",
    "asset_tag",
    "name",
    "category",
    "status",
    "assigned_to",
    "created_at",
    "updated_at",
  ],
  relations: ["users", "audit_logs"],
};
