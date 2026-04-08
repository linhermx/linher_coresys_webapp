import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const DEFAULT_TIMEZONE = 'America/Mexico_City';

const parseInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const toOrigin = (urlValue) => {
  if (!urlValue) {
    return null;
  }

  try {
    return new URL(urlValue).origin;
  } catch {
    return String(urlValue).replace(/\/+$/, '');
  }
};

const splitOrigins = (value) => (
  String(value || '')
    .split(',')
    .map((origin) => toOrigin(origin.trim()))
    .filter(Boolean)
);

const timezone = process.env.APP_TIMEZONE || process.env.TZ || DEFAULT_TIMEZONE;
process.env.TZ = timezone;

const frontendOrigin = toOrigin(process.env.FRONTEND_URL || process.env.FRONTEND_APP_URL);

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInteger(process.env.PORT, 3000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  timezone,
  frontendOrigin,
  corsAllowedOrigins: [
    frontendOrigin,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...splitOrigins(process.env.CORS_ALLOWED_ORIGINS)
  ].filter(Boolean),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInteger(process.env.DB_PORT, 3306),
    name: process.env.DB_NAME || 'linher_coresys',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    connectionLimit: parseInteger(process.env.DB_CONNECTION_LIMIT, 10)
  }
});
