import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const SHORT_REFRESH_TOKEN_EXPIRES_IN = "8h";
const REMEMBER_REFRESH_TOKEN_EXPIRES_IN = "7d";
const MIN_SECRET_LENGTH = 24;

const readSecret = (key) => String(process.env[key] ?? "").trim();

const assertSecret = (key) => {
  const value = readSecret(key);

  if (!value) {
    const error = new Error(`Falta configurar ${key}.`);
    error.code = "missing_env";
    error.statusCode = 500;
    throw error;
  }

  if (value.length < MIN_SECRET_LENGTH) {
    const error = new Error(`${key} debe tener al menos ${MIN_SECRET_LENGTH} caracteres.`);
    error.code = "weak_env_secret";
    error.statusCode = 500;
    throw error;
  }

  return value;
};

const decodeTokenExpiry = (token) => {
  const decoded = jwt.decode(token);
  return decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null;
};

const toBoolean = (value) =>
  value === true ||
  value === "true" ||
  value === 1 ||
  value === "1" ||
  value === "on";

const getSecrets = () => ({
  accessSecret: assertSecret("JWT_SECRET"),
  refreshSecret: assertSecret("JWT_REFRESH_SECRET"),
});

export const signAuthTokens = ({ userId, roleName }, rememberMe = false) => {
  const { accessSecret, refreshSecret } = getSecrets();
  const remember = toBoolean(rememberMe);
  const normalizedRole = String(roleName ?? "").toLowerCase();
  const tokenId = randomUUID();

  const accessToken = jwt.sign(
    {
      sub: userId,
      id: userId,
      role: normalizedRole,
      jti: tokenId,
    },
    accessSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
  );

  const refreshToken = jwt.sign(
    {
      sub: userId,
      id: userId,
      jti: tokenId,
      remember_me: remember,
    },
    refreshSecret,
    {
      expiresIn: remember
        ? REMEMBER_REFRESH_TOKEN_EXPIRES_IN
        : SHORT_REFRESH_TOKEN_EXPIRES_IN,
    },
  );

  return {
    accessToken,
    refreshToken,
    access_expires_at: decodeTokenExpiry(accessToken),
    refresh_expires_at: decodeTokenExpiry(refreshToken),
  };
};

export const verifyAccessToken = (token) => {
  const { accessSecret } = getSecrets();
  return jwt.verify(token, accessSecret);
};

export const verifyRefreshToken = (token) => {
  const { refreshSecret } = getSecrets();
  return jwt.verify(token, refreshSecret);
};
