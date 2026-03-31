export const refreshTokenModel = {
  entity: "refresh_tokens",
  primaryKey: "id",
  fields: ["id", "user_id", "token", "expires_at", "created_at"],
  relations: ["users"],
};
