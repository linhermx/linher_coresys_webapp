export const inventoryModel = {
  domain: "inventory",
  primaryEntity: "assets",
  relatedEntities: ["asset_assignments"],
  fields: [
    "asset_tag",
    "name",
    "category",
    "status",
    "assigned_to",
  ],
  relations: ["users", "audit_logs"],
};
