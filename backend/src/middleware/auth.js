import { createErrorResponse } from "../utils/apiResponse.js";
import { verifyAccessToken } from "../utils/authToken.js";
import { getUserByIdWithPermissions } from "../services/userService.js";

const isAdminUser = (user) =>
  String(user?.role_name ?? "").toLowerCase() === "admin" || Number(user?.role_id) === 1;

const parseBearerToken = (headerValue = "") => {
  const [scheme, token] = String(headerValue).trim().split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
};

const sendAuthError = (res, statusCode, code, message) =>
  res.status(statusCode).json(
    createErrorResponse({
      code,
      message,
    }),
  );

export const requireAuth = async (req, res, next) => {
  try {
    const token = parseBearerToken(req.headers.authorization);

    if (!token) {
      return sendAuthError(res, 401, "auth_required", "Autenticación requerida.");
    }

    const payload = verifyAccessToken(token);
    const userId = Number(payload?.sub ?? payload?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return sendAuthError(res, 401, "invalid_access_token", "Token de acceso inválido.");
    }

    const user = await getUserByIdWithPermissions(userId);

    if (!user || user.status !== "active") {
      return sendAuthError(res, 401, "invalid_session", "Sesión inválida o usuario inactivo.");
    }

    req.authUser = user;
    return next();
  } catch (_error) {
    return sendAuthError(res, 401, "expired_access_token", "Sesión expirada o inválida.");
  }
};

export const requirePermission = (permissionSlug) => (req, res, next) => {
  const user = req.authUser;

  if (!user) {
    return sendAuthError(res, 401, "auth_required", "Autenticación requerida.");
  }

  if (isAdminUser(user)) {
    return next();
  }

  const permissions = Array.isArray(user.permissions) ? user.permissions : [];

  if (!permissions.includes(permissionSlug)) {
    return sendAuthError(res, 403, "forbidden", "No autorizado para esta acción.");
  }

  return next();
};

export const requireAnyPermission = (permissionSlugs = []) => (req, res, next) => {
  const user = req.authUser;

  if (!user) {
    return sendAuthError(res, 401, "auth_required", "Autenticación requerida.");
  }

  if (isAdminUser(user)) {
    return next();
  }

  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  const hasPermission = permissionSlugs.some((permissionSlug) =>
    permissions.includes(permissionSlug),
  );

  if (!hasPermission) {
    return sendAuthError(res, 403, "forbidden", "No autorizado para esta acción.");
  }

  return next();
};
