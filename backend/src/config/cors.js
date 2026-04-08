import { env } from './env.js';

const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1):517\d$/;
const allowedOrigins = new Set(env.corsAllowedOrigins);

export const corsOptions = {
  origin(origin, callback) {
    const isAllowed = !origin
      || allowedOrigins.has(origin)
      || (!env.isProduction && localDevOriginPattern.test(origin));

    if (isAllowed) {
      callback(null, true);
      return;
    }

    const error = new Error('Origen no permitido por CORS.');
    error.code = 'CORS_NOT_ALLOWED';
    error.statusCode = 403;
    callback(error);
  },
  credentials: true
};
