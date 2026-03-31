export const getAuthBlueprint = () => ({
  strategy: "jwt-refresh-blueprint",
  providers: ["local"],
  entities: [
    "users",
    "roles",
    "permissions",
    "role_permissions",
    "user_permissions",
    "refresh_tokens",
  ],
  sessionFields: [
    "token",
    "user_id",
    "expires_at",
    "created_at",
  ],
  notes: "La autenticación real se implementará en una iteración posterior.",
});
