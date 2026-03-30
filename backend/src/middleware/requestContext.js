import { randomUUID } from "node:crypto";
import env from "../config/env.js";

const requestContext = (req, _res, next) => {
  req.context = {
    requestId: randomUUID(),
    receivedAt: new Date().toISOString(),
    timezone: env.app.timezone,
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? null,
  };

  next();
};

export default requestContext;
