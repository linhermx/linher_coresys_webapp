import { HealthService } from '../services/healthService.js';

const parseBoolean = (value) => value === true || value === 'true' || value === '1';

export const HealthController = {
  async show(req, res, next) {
    try {
      const data = await HealthService.getStatus({
        includeDatabase: parseBoolean(req.query.include_database)
      });

      res.success({
        message: 'API en línea.',
        data
      });
    } catch (error) {
      next(error);
    }
  }
};
