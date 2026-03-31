export const serviceModel = {
  domain: "services",
  primaryEntity: "services",
  relatedEntities: ["service_renewals"],
  fields: ["service_key", "name", "status", "vendor_name", "renewal_date"],
  relations: ["audit_logs"],
};
