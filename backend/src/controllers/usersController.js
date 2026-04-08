import { AuditService } from '../services/auditService.js';
import { UserService } from '../services/userService.js';

export const UsersController = {
  async list(req, res, next) {
    try {
      const data = await UserService.listUsers({
        search: req.query.search,
        status: req.query.status,
        roleKey: req.query.role_key,
        linked: req.query.linked
      });

      res.success({
        message: 'Catálogo de usuarios obtenido correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async show(req, res, next) {
    try {
      const data = await UserService.getUserById(req.params.userId);

      res.success({
        message: 'Detalle del usuario obtenido correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const data = await UserService.createUser({
        name: req.body?.name,
        email: req.body?.email,
        password: req.body?.password,
        roleKeys: req.body?.role_keys,
        collaboratorId: req.body?.collaborator_id,
        status: req.body?.status,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        statusCode: 201,
        message: 'Usuario registrado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  }
};
