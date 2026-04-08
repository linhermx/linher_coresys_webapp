const withRequestMeta = (req, meta = {}) => ({
  request_id: req.requestId || null,
  ...meta
});

export const responseMiddleware = (req, res, next) => {
  res.success = ({
    statusCode = 200,
    message = 'Operación completada.',
    data = null,
    meta = {}
  } = {}) => res.status(statusCode).json({
    ok: true,
    message,
    data,
    meta: withRequestMeta(req, meta)
  });

  res.fail = ({
    statusCode = 500,
    message = 'No fue posible completar la operación.',
    code = 'INTERNAL_ERROR',
    details = null,
    meta = {}
  } = {}) => res.status(statusCode).json({
    ok: false,
    message,
    error: {
      code,
      details
    },
    meta: withRequestMeta(req, meta)
  });

  next();
};
