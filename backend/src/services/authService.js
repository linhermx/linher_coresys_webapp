export const getAuthBlueprint = () => ({
  strategy: "session-local-blueprint",
  providers: ["local"],
  entities: [
    "users",
    "roles",
    "permissions",
    "user_roles",
    "role_permissions",
    "auth_sessions",
  ],
  sessionFields: [
    "session_token",
    "user_id",
    "issued_at",
    "expires_at",
    "revoked_at",
  ],
  notes: "La autenticación real se implementará en una iteración posterior.",
});
