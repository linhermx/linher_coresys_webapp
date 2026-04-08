import { env } from '../config/env.js';
import { checkDatabaseConnection } from '../config/db.js';

const getLocalTimestamp = () => new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: env.timezone
}).format(new Date());

export const HealthService = {
  async getStatus({ includeDatabase = false } = {}) {
    const status = {
      service: 'coresys-api',
      status: 'ok',
      environment: env.nodeEnv,
      timezone: env.timezone,
      local_time: getLocalTimestamp(),
      uptime_seconds: Math.round(process.uptime())
    };

    if (includeDatabase) {
      status.database = await checkDatabaseConnection();
    }

    return status;
  }
};
