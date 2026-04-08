import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(message, {
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    details = null,
    expose = statusCode < 500
  } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.expose = expose;
  }
}

const getStatusCode = (error) => {
  if (Number.isInteger(error.statusCode)) {
    return error.statusCode;
  }

  if (Number.isInteger(error.status)) {
    return error.status;
  }

  return 500;
};

const getPublicMessage = (error, statusCode) => {
  if (statusCode === 400 && error.type === 'entity.parse.failed') {
    return 'La solicitud contiene JSON inválido.';
  }

  if (error.expose || statusCode < 500) {
    return error.message;
  }

  return 'Ocurrió un error interno.';
};

export const notFoundHandler = (req, res, next) => {
  next(new AppError('Ruta no encontrada.', {
    statusCode: 404,
    code: 'ROUTE_NOT_FOUND',
    details: {
      method: req.method,
      path: req.originalUrl
    }
  }));
};

export const errorHandler = (error, req, res, _next) => {
  const statusCode = getStatusCode(error);
  const code = error.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');
  const details = env.isProduction ? null : error.details || null;
  const message = getPublicMessage(error, statusCode);
  const shouldExposeStack = !env.isProduction && statusCode >= 500;

  if (statusCode >= 500) {
    console.error(`[${req.requestId || 'no-request-id'}]`, error);
  }

  if (typeof res.fail === 'function') {
    res.fail({
      statusCode,
      message,
      code,
      details,
      meta: shouldExposeStack ? { stack: error.stack } : {}
    });
    return;
  }

  res.status(statusCode).json({
    ok: false,
    message,
    error: {
      code,
      details
    },
    meta: {
      request_id: req.requestId || null,
      ...(shouldExposeStack ? { stack: error.stack } : {})
    }
  });
};
