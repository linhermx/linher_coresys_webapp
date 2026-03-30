export const getAuthBlueprint = () => ({
  strategy: "session-placeholder",
  providers: ["local"],
  sessionFields: ["user_id", "role", "issued_at", "expires_at"],
  notes: "La autenticacion real se implementara en una iteracion posterior.",
});

