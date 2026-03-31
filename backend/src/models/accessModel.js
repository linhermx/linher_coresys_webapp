export const accessModel = {
  domain: "access",
  primaryEntity: "access_accounts",
  relatedEntities: ["audit_logs"],
  fields: ["system_name", "account_name", "status", "owner_name"],
  relations: ["users", "audit_logs"],
};
