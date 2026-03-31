export const authSessionModel = {
  entity: "auth_sessions",
  primaryKey: "id",
  fields: [
    "id",
    "user_id",
    "session_token",
    "ip_address",
    "user_agent",
    "issued_at",
    "expires_at",
    "revoked_at",
    "created_at",
  ],
  relations: ["users"],
};
