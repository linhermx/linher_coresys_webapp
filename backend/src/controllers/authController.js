import { AuthService } from '../services/authService.js';
import { AuditService } from '../services/auditService.js';

const parseBoolean = (value) => value === true || value === 'true' || value === '1';

export const AuthController = {
  async login(req, res, next) {
    try {
      const data = await AuthService.login({
        email: req.body?.email,
        password: req.body?.password,
        rememberMe: parseBoolean(req.body?.remember_me),
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'Sesión iniciada correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req, res, next) {
    try {
      const data = await AuthService.refreshSession({
        refreshToken: req.body?.refresh_token,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'La sesión se actualizó correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      const data = await AuthService.logout({
        refreshToken: req.body?.refresh_token,
        authUser: req.authUser || null,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'La sesión se cerró correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      const data = await AuthService.getCurrentUser(req.authUser.id);

      res.success({
        message: 'Sesión actual obtenida correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async catalog(req, res, next) {
    try {
      const data = await AuthService.getRbacCatalog();

      res.success({
        message: 'Catálogo RBAC obtenido correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  }
};
