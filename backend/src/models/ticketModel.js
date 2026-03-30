export const ticketModel = {
  entity: "tickets",
  primaryKey: "id",
  fields: [
    "id",
    "folio",
    "title",
    "status",
    "priority",
    "requester_id",
    "assignee_id",
    "created_at",
    "updated_at",
  ],
  relations: ["users", "audit_logs"],
};

