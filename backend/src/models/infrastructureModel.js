export const infrastructureModel = {
  domain: "infrastructure",
  primaryEntity: "network_devices",
  relatedEntities: ["network_segments", "ip_assignments"],
  fields: ["device_name", "device_type", "status", "location_name"],
  relations: ["tickets", "services", "audit_logs"],
};
