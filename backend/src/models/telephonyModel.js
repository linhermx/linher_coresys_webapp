export const telephonyModel = {
  domain: "telephony",
  primaryEntity: "phone_lines",
  relatedEntities: ["sim_cards", "recharge_events"],
  fields: ["line_number", "carrier", "status", "assigned_to"],
  relations: ["users", "audit_logs"],
};
