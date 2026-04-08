import crypto from 'node:crypto';

const createRequestId = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return crypto.randomBytes(16).toString('hex');
};

const getOperatorIdFromRequest = (req) => (
  req.headers['x-operator-id']
  || req.query?.operator_id
  || req.body?.operator_id
  || null
);

export const requestContextMiddleware = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || createRequestId();
  req.operatorId = getOperatorIdFromRequest(req);
  res.setHeader('x-request-id', req.requestId);
  next();
};
