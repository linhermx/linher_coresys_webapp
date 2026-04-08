import pool from '../config/db.js';

const serializeJson = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  return JSON.stringify(value);
};

const normalizeIpAddress = (rawValue) => {
  if (!rawValue) {
    return null;
  }

  const firstIp = String(rawValue).split(',')[0].trim();
  return firstIp.replace(/^::ffff:/, '');
};

export const AuditService = {
  buildRequestContext(req = {}) {
    const forwardedFor = req.headers?.['x-forwarded-for'];
    const ipAddress = normalizeIpAddress(forwardedFor || req.ip || req.socket?.remoteAddress);
    const userAgent = req.get ? req.get('user-agent') : req.headers?.['user-agent'];

    return {
      requestId: req.requestId || null,
      ipAddress,
      userAgent: userAgent || null
    };
  },

  async record({
    operatorId = null,
    action,
    entityType = 'system_event',
    entityId = null,
    beforeSnapshot = null,
    afterSnapshot = null,
    details = null,
    requestContext = {}
  }) {
    const [result] = await pool.query(`
      INSERT INTO audit_logs (
        operator_id,
        action,
        entity_type,
        entity_id,
        before_snapshot,
        after_snapshot,
        details,
        request_id,
        ip_address,
        user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      operatorId,
      action,
      entityType,
      entityId,
      serializeJson(beforeSnapshot),
      serializeJson(afterSnapshot),
      serializeJson(details),
      requestContext.requestId || null,
      requestContext.ipAddress || null,
      requestContext.userAgent || null
    ]);

    return Number(result.insertId);
  }
};
