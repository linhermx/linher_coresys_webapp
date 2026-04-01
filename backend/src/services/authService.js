import bcrypt from "bcryptjs";
import { getPool } from "../config/database.js";
import { buildAuditLogDraft, recordAuditLog } from "./auditService.js";
import { getUserByIdWithPermissions } from "./userService.js";
import { signAuthTokens, verifyRefreshToken } from "../utils/authToken.js";

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
  notes: "Sesión JWT con refresh token y usuario actual disponible.",
});

export const findActiveUserByEmail = async (email) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.password,
        u.role_id,
        u.photo_path,
        u.status,
        u.created_at,
        u.updated_at,
        r.name AS role_name
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.email = ? AND u.status = 'active'
      LIMIT 1
    `,
    [String(email ?? "").trim().toLowerCase()],
  );

  return rows[0] ?? null;
};

export const saveRefreshToken = async (userId, token, expiresAt) => {
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `,
    [userId, token, expiresAt],
  );
};

export const findPersistedRefreshToken = async (token) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `
      SELECT id, user_id, token, expires_at, created_at
      FROM refresh_tokens
      WHERE token = ?
      LIMIT 1
    `,
    [token],
  );

  return rows[0] ?? null;
};

export const deleteRefreshToken = async (token) => {
  const pool = getPool();
  const [result] = await pool.query("DELETE FROM refresh_tokens WHERE token = ?", [token]);
  return result.affectedRows > 0;
};

export const deleteExpiredRefreshTokens = async () => {
  const pool = getPool();
  await pool.query("DELETE FROM refresh_tokens WHERE expires_at < NOW()");
};

export const authenticateUser = async ({
  email,
  password,
  rememberMe = false,
  requestContext = {},
}) => {
  const user = await findActiveUserByEmail(email);

  if (!user) {
    const error = new Error("Usuario no encontrado o inactivo.");
    error.code = "invalid_credentials";
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(String(password ?? ""), user.password).catch(() => false);

  if (!isMatch) {
    const error = new Error("Correo o contraseña incorrectos.");
    error.code = "invalid_credentials";
    error.statusCode = 401;
    throw error;
  }

  const fullUser = await getUserByIdWithPermissions(user.id);

  if (!fullUser || fullUser.status !== "active") {
    const error = new Error("Sesión inválida o usuario inactivo.");
    error.code = "invalid_session";
    error.statusCode = 401;
    throw error;
  }

  const tokens = signAuthTokens(
    {
      userId: fullUser.id,
      roleName: fullUser.role_name,
    },
    rememberMe,
  );

  await deleteExpiredRefreshTokens();
  await saveRefreshToken(fullUser.id, tokens.refreshToken, tokens.refresh_expires_at);

  await recordAuditLog(
    buildAuditLogDraft({
      action: "auth.login",
      operatorId: fullUser.id,
      operatorRole: fullUser.role_name ?? null,
      entityName: "refresh_tokens",
      entityId: fullUser.id,
      afterSnapshot: {
        session_started: true,
        remember_me: rememberMe === true,
      },
      metadata: {
        email: fullUser.email,
      },
      requestContext,
    }),
  );

  return {
    user: fullUser,
    ...tokens,
  };
};

export const rotateSession = async ({ refreshToken, requestContext = {} }) => {
  if (!refreshToken) {
    const error = new Error("Refresh token requerido.");
    error.code = "refresh_token_required";
    error.statusCode = 401;
    throw error;
  }

  const decoded = verifyRefreshToken(refreshToken);
  const persistedToken = await findPersistedRefreshToken(refreshToken);

  if (!persistedToken) {
    const error = new Error("Refresh token inválido.");
    error.code = "invalid_refresh_token";
    error.statusCode = 403;
    throw error;
  }

  if (new Date(persistedToken.expires_at) < new Date()) {
    await deleteRefreshToken(refreshToken);

    const error = new Error("Refresh token expirado.");
    error.code = "expired_refresh_token";
    error.statusCode = 403;
    throw error;
  }

  const userId = Number(decoded?.sub ?? decoded?.id ?? persistedToken.user_id);
  const fullUser = await getUserByIdWithPermissions(userId);

  if (!fullUser || fullUser.status !== "active") {
    await deleteRefreshToken(refreshToken);

    const error = new Error("Usuario no encontrado o inactivo.");
    error.code = "invalid_refresh_user";
    error.statusCode = 403;
    throw error;
  }

  const tokens = signAuthTokens(
    {
      userId: fullUser.id,
      roleName: fullUser.role_name,
    },
    decoded?.remember_me === true,
  );

  await deleteRefreshToken(refreshToken);
  await saveRefreshToken(fullUser.id, tokens.refreshToken, tokens.refresh_expires_at);

  await recordAuditLog(
    buildAuditLogDraft({
      action: "auth.refresh",
      operatorId: fullUser.id,
      operatorRole: fullUser.role_name ?? null,
      entityName: "refresh_tokens",
      entityId: fullUser.id,
      afterSnapshot: {
        rotated: true,
      },
      requestContext,
    }),
  );

  return {
    user: fullUser,
    ...tokens,
  };
};

export const revokeSession = async ({ refreshToken, authUser = null, requestContext = {} }) => {
  if (!refreshToken) {
    const error = new Error("Refresh token requerido.");
    error.code = "refresh_token_required";
    error.statusCode = 400;
    throw error;
  }

  await deleteRefreshToken(refreshToken);

  if (authUser?.id) {
    await recordAuditLog(
      buildAuditLogDraft({
        action: "auth.logout",
        operatorId: authUser.id,
        operatorRole: authUser.role_name ?? null,
        entityName: "refresh_tokens",
        entityId: authUser.id,
        beforeSnapshot: {
          session_active: true,
        },
        afterSnapshot: {
          session_active: false,
        },
        requestContext,
      }),
    );
  }

  return true;
};
