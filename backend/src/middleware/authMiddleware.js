import { SYSTEM_ADMIN_ROLE_KEY } from '../config/rbac.js';
import { AuthService } from '../services/authService.js';
import { AppError } from './errorHandler.js';

const parseBearerToken = (authorizationHeader = '') => {
  const [scheme, token] = String(authorizationHeader || '').trim().split(/\s+/);

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
};

export const hasRole = (user, roleKey) => {
  const expectedRoleKey = String(roleKey || '').trim().toLowerCase();
  return Array.isArray(user?.role_keys) && user.role_keys.includes(expectedRoleKey);
};

export const hasPermission = (user, permissionKey) => (
  hasRole(user, SYSTEM_ADMIN_ROLE_KEY)
  || (Array.isArray(user?.permissions) && user.permissions.includes(String(permissionKey || '').trim()))
);

export const requireAuth = async (req, _res, next) => {
  try {
    const token = parseBearerToken(req.headers.authorization);

    if (!token) {
      throw new AppError('Debes iniciar sesión para continuar.', {
        statusCode: 401,
        code: 'AUTH_REQUIRED'
      });
    }

    const authUser = await AuthService.getUserFromAccessToken(token);
    req.authUser = authUser;
    req.operatorId = authUser.id;

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req, _res, next) => {
  try {
    const token = parseBearerToken(req.headers.authorization);

    if (!token) {
      next();
      return;
    }

    const authUser = await AuthService.getUserFromAccessToken(token);
    req.authUser = authUser;
    req.operatorId = authUser.id;
    next();
  } catch {
    next();
  }
};

export const requireRole = (roleKey) => (req, _res, next) => {
  if (!req.authUser) {
    next(new AppError('Debes iniciar sesión para continuar.', {
      statusCode: 401,
      code: 'AUTH_REQUIRED'
    }));
    return;
  }

  if (!hasRole(req.authUser, roleKey)) {
    next(new AppError('No cuentas con el rol requerido para esta acción.', {
      statusCode: 403,
      code: 'FORBIDDEN_ROLE',
      details: {
        required_role: roleKey
      }
    }));
    return;
  }

  next();
};

export const requirePermission = (permissionKey) => (req, _res, next) => {
  if (!req.authUser) {
    next(new AppError('Debes iniciar sesión para continuar.', {
      statusCode: 401,
      code: 'AUTH_REQUIRED'
    }));
    return;
  }

  if (!hasPermission(req.authUser, permissionKey)) {
    next(new AppError('No cuentas con permiso para realizar esta acción.', {
      statusCode: 403,
      code: 'FORBIDDEN_PERMISSION',
      details: {
        required_permission: permissionKey
      }
    }));
    return;
  }

  next();
};

export const requireAnyPermission = (permissionKeys = []) => (req, _res, next) => {
  if (!req.authUser) {
    next(new AppError('Debes iniciar sesión para continuar.', {
      statusCode: 401,
      code: 'AUTH_REQUIRED'
    }));
    return;
  }

  const expectedPermissions = Array.isArray(permissionKeys) ? permissionKeys : [permissionKeys];
  const hasAnyPermission = expectedPermissions.some((permissionKey) => (
    hasPermission(req.authUser, permissionKey)
  ));

  if (!hasAnyPermission) {
    next(new AppError('No cuentas con permisos suficientes para esta acción.', {
      statusCode: 403,
      code: 'FORBIDDEN_PERMISSION',
      details: {
        required_permissions: expectedPermissions
      }
    }));
    return;
  }

  next();
};
