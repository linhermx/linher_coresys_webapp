import bcrypt from 'bcryptjs';

import pool from '../config/db.js';
import { signAuthTokens, validateAuthConfig, verifyAccessToken, verifyRefreshToken } from '../config/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthModel } from '../models/AuthModel.js';
import { AuditService } from './auditService.js';

const authModel = new AuthModel(pool);
const PASSWORD_MIN_LENGTH = 8;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const toBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';

const sanitizeSessionUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    photo_path: user.photo_path,
    must_change_password: Boolean(user.must_change_password),
    password_changed_at: user.password_changed_at,
    status: user.status,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
    roles: Array.isArray(user.roles) ? user.roles : [],
    role_keys: Array.isArray(user.role_keys) ? user.role_keys : [],
    primary_role_key: user.primary_role_key || null,
    permissions: Array.isArray(user.permissions) ? user.permissions : []
  };
};

const assertValidEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AppError('Debes indicar un correo válido.', {
      statusCode: 400,
      code: 'INVALID_EMAIL'
    });
  }

  return normalizedEmail;
};

const assertPassword = (password) => {
  const normalizedPassword = String(password || '');

  if (normalizedPassword.length < PASSWORD_MIN_LENGTH) {
    throw new AppError(
      `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
      {
        statusCode: 400,
        code: 'WEAK_PASSWORD'
      }
    );
  }

  return normalizedPassword;
};

const issueSession = async ({
  user,
  rememberMe = false,
  requestContext = {},
  auditAction = 'auth.login',
  auditDetails = {},
  touchLastLogin = false
}) => {
  const remember = toBoolean(rememberMe);
  const tokens = signAuthTokens({
    userId: user.id,
    roleKeys: user.role_keys
  }, remember);

  const refreshTokenId = await authModel.createRefreshToken({
    userId: user.id,
    token: tokens.refreshToken,
    expiresAt: tokens.refresh_expires_at
  });

  if (touchLastLogin) {
    await authModel.updateLastLoginAt(user.id);
  }

  await AuditService.record({
    operatorId: user.id,
    action: auditAction,
    entityType: 'refresh_tokens',
    entityId: refreshTokenId,
    afterSnapshot: {
      session_active: true,
      refresh_expires_at: tokens.refresh_expires_at
    },
    details: {
      email: user.email,
      remember_me: remember,
      ...auditDetails
    },
    requestContext
  });

  const sessionUser = touchLastLogin
    ? await authModel.getUserByIdWithAccess(user.id)
    : user;

  return {
    user: sanitizeSessionUser(sessionUser),
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    access_expires_at: tokens.access_expires_at,
    refresh_expires_at: tokens.refresh_expires_at
  };
};

export const AuthService = {
  getMap() {
    return {
      purpose: 'Autenticar usuarios de Coresys y controlar el acceso operativo al sistema.',
      problem: 'Evitar acceso no autorizado y mantener sesiones, roles, permisos y trazabilidad desde etapas tempranas.',
      root_entity: 'users',
      lifecycle: ['inactive', 'active', 'refreshed', 'revoked'],
      main_flow: ['login', 'me', 'refresh', 'logout'],
      critical_actions: ['login', 'refresh', 'logout', 'require_role', 'require_permission'],
      relationships: [
        'users -> user_roles -> roles',
        'roles -> role_permissions -> permissions',
        'users -> user_permissions -> permissions',
        'users -> refresh_tokens',
        'users -> audit_logs'
      ],
      traceability: [
        'auth.login',
        'auth.refresh',
        'auth.refresh_rotate',
        'auth.logout'
      ]
    };
  },

  async login({ email, password, rememberMe = false, requestContext = {} }) {
    validateAuthConfig();
    await authModel.revokeExpiredRefreshTokens();

    const normalizedEmail = assertValidEmail(email);
    const normalizedPassword = assertPassword(password);
    const userRecord = await authModel.findActiveUserByEmail(normalizedEmail);

    if (!userRecord?.password_hash) {
      throw new AppError('Correo o contraseña incorrectos.', {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS'
      });
    }

    const isPasswordValid = await bcrypt.compare(normalizedPassword, userRecord.password_hash)
      .catch(() => false);

    if (!isPasswordValid) {
      throw new AppError('Correo o contraseña incorrectos.', {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = await authModel.getUserByIdWithAccess(userRecord.id);
    if (!user || user.status !== 'active') {
      throw new AppError('La sesión no se pudo iniciar con este usuario.', {
        statusCode: 401,
        code: 'INVALID_SESSION'
      });
    }

    return issueSession({
      user,
      rememberMe,
      requestContext,
      auditAction: 'auth.login',
      touchLastLogin: true
    });
  },

  async refreshSession({ refreshToken, requestContext = {} }) {
    validateAuthConfig();
    await authModel.revokeExpiredRefreshTokens();

    const normalizedToken = String(refreshToken || '').trim();
    if (!normalizedToken) {
      throw new AppError('Debes indicar un refresh token.', {
        statusCode: 401,
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    let decodedToken;
    try {
      decodedToken = verifyRefreshToken(normalizedToken);
    } catch {
      throw new AppError('El refresh token no es válido.', {
        statusCode: 403,
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    const persistedToken = await authModel.findRefreshToken(normalizedToken);
    if (!persistedToken || persistedToken.revoked_at) {
      throw new AppError('El refresh token ya no está disponible.', {
        statusCode: 403,
        code: 'REFRESH_TOKEN_REVOKED'
      });
    }

    if (new Date(persistedToken.expires_at) <= new Date()) {
      await authModel.revokeRefreshToken(normalizedToken, 'expired');

      throw new AppError('El refresh token ya expiró.', {
        statusCode: 403,
        code: 'EXPIRED_REFRESH_TOKEN'
      });
    }

    const userId = Number(decodedToken?.sub || decodedToken?.id || persistedToken.user_id);
    const user = await authModel.getUserByIdWithAccess(userId);

    if (!user || user.status !== 'active') {
      await authModel.revokeRefreshToken(normalizedToken, 'invalid_user');

      throw new AppError('La sesión ya no corresponde a un usuario activo.', {
        statusCode: 403,
        code: 'INVALID_REFRESH_USER'
      });
    }

    await authModel.touchRefreshToken(normalizedToken);

    const nextSession = await issueSession({
      user,
      rememberMe: Boolean(decodedToken?.remember_me),
      requestContext,
      auditAction: 'auth.refresh'
    });

    await authModel.revokeRefreshToken(normalizedToken, 'rotated');

    await AuditService.record({
      operatorId: user.id,
      action: 'auth.refresh_rotate',
      entityType: 'refresh_tokens',
      entityId: persistedToken.id,
      beforeSnapshot: {
        revoked_at: null
      },
      afterSnapshot: {
        revoked_reason: 'rotated'
      },
      details: {
        next_refresh_expires_at: nextSession.refresh_expires_at
      },
      requestContext
    });

    return nextSession;
  },

  async logout({ refreshToken, authUser = null, requestContext = {} }) {
    const normalizedToken = String(refreshToken || '').trim();
    if (!normalizedToken) {
      throw new AppError('Debes indicar un refresh token.', {
        statusCode: 400,
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    const persistedToken = await authModel.findRefreshToken(normalizedToken);
    if (!persistedToken) {
      return {
        revoked: false
      };
    }

    const revoked = await authModel.revokeRefreshToken(normalizedToken, 'logout');
    const operatorId = authUser?.id || persistedToken.user_id || null;

    await AuditService.record({
      operatorId,
      action: 'auth.logout',
      entityType: 'refresh_tokens',
      entityId: persistedToken.id,
      beforeSnapshot: {
        revoked_at: persistedToken.revoked_at,
        revoked_reason: persistedToken.revoked_reason
      },
      afterSnapshot: {
        revoked_reason: revoked ? 'logout' : persistedToken.revoked_reason || 'already_revoked'
      },
      details: {
        revoked
      },
      requestContext
    });

    return {
      revoked
    };
  },

  async getCurrentUser(userId) {
    const user = await authModel.getUserByIdWithAccess(userId);
    if (!user || user.status !== 'active') {
      throw new AppError('La sesión ya no es válida.', {
        statusCode: 401,
        code: 'INVALID_SESSION'
      });
    }

    return sanitizeSessionUser(user);
  },

  async getUserFromAccessToken(token) {
    validateAuthConfig();

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new AppError('La sesión expiró o no es válida.', {
        statusCode: 401,
        code: 'INVALID_ACCESS_TOKEN'
      });
    }

    const userId = Number(payload?.sub || payload?.id);
    if (!userId) {
      throw new AppError('La sesión no contiene un usuario válido.', {
        statusCode: 401,
        code: 'INVALID_ACCESS_TOKEN'
      });
    }

    return this.getCurrentUser(userId);
  },

  async getRbacCatalog() {
    const [roles, permissions] = await Promise.all([
      authModel.listRoles(),
      authModel.listPermissions()
    ]);

    return {
      roles,
      permissions
    };
  }
};
