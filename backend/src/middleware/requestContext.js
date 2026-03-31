import { randomUUID } from "node:crypto";

const APP_TIMEZONE = "America/Mexico_City";

const requestContext = (req, _res, next) => {
  req.context = {
    requestId: randomUUID(),
    receivedAt: new Date().toISOString(),
    timezone: APP_TIMEZONE,
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? null,
  };

  next();
};

export default requestContext;
