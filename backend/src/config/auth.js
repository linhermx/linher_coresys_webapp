import crypto from 'node:crypto';

import jwt from 'jsonwebtoken';

import { env } from './env.js';

const MIN_SECRET_LENGTH = 24;
const BLOCKED_SECRETS = new Set([
  '',
  'change-this-secret',
  'change-this-refresh-secret',
  'replace-with-a-strong-secret',
  'replace-with-a-strong-refresh-secret'
]);

const assertSecret = (value, key) => {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  if (normalizedValue.length < MIN_SECRET_LENGTH || BLOCKED_SECRETS.has(normalizedValue)) {
    throw new Error(
      `${key} must contain a strong secret with at least ${MIN_SECRET_LENGTH} characters.`
    );
  }

  return normalizedValue;
};

const decodeTokenExpiry = (token) => {
  const decoded = jwt.decode(token);
  return decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null;
};

const normalizeRoleKeys = (roleKeys = []) => (
  Array.from(new Set(
    (Array.isArray(roleKeys) ? roleKeys : [roleKeys])
      .map((roleKey) => String(roleKey || '').trim().toLowerCase())
      .filter(Boolean)
  ))
);

const toBoolean = (value) => (
  value === true
  || value === 'true'
  || value === 1
  || value === '1'
);

const readSecrets = () => ({
  accessSecret: assertSecret(env.auth.accessSecret, 'JWT_SECRET'),
  refreshSecret: assertSecret(env.auth.refreshSecret, 'JWT_REFRESH_SECRET')
});

export const validateAuthConfig = () => {
  readSecrets();
  return true;
};

export const resolveRefreshTokenExpiry = (rememberMe = false) => (
  toBoolean(rememberMe)
    ? env.auth.refreshRememberExpiresIn
    : env.auth.refreshExpiresIn
);

export const signAuthTokens = ({ userId, roleKeys = [] }, rememberMe = false) => {
  const { accessSecret, refreshSecret } = readSecrets();
  const normalizedRoleKeys = normalizeRoleKeys(roleKeys);
  const primaryRoleKey = normalizedRoleKeys[0] || null;
  const remember = toBoolean(rememberMe);
  const tokenId = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString('hex');

  const accessToken = jwt.sign(
    {
      sub: userId,
      id: userId,
      role: primaryRoleKey,
      roles: normalizedRoleKeys,
      jti: tokenId
    },
    accessSecret,
    {
      expiresIn: env.auth.accessExpiresIn
    }
  );

  const refreshToken = jwt.sign(
    {
      sub: userId,
      id: userId,
      jti: tokenId,
      remember_me: remember
    },
    refreshSecret,
    {
      expiresIn: resolveRefreshTokenExpiry(remember)
    }
  );

  return {
    accessToken,
    refreshToken,
    access_expires_at: decodeTokenExpiry(accessToken),
    refresh_expires_at: decodeTokenExpiry(refreshToken)
  };
};

export const verifyAccessToken = (token) => {
  const { accessSecret } = readSecrets();
  return jwt.verify(token, accessSecret);
};

export const verifyRefreshToken = (token) => {
  const { refreshSecret } = readSecrets();
  return jwt.verify(token, refreshSecret);
};
