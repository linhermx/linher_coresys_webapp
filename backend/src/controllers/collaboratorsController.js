import { CollaboratorService } from '../services/collaboratorService.js';
import { AuditService } from '../services/auditService.js';

export const CollaboratorsController = {
  async list(req, res, next) {
    try {
      const data = await CollaboratorService.listCollaborators({
        search: req.query.search,
        status: req.query.status,
        linked: req.query.linked
      });

      res.success({
        message: 'Directorio operativo obtenido correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async show(req, res, next) {
    try {
      const data = await CollaboratorService.getCollaboratorById(req.params.collaboratorId);

      res.success({
        message: 'Detalle del colaborador obtenido correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const data = await CollaboratorService.createCollaborator({
        employeeId: req.body?.employee_id,
        firstName: req.body?.first_name,
        lastName: req.body?.last_name,
        areaName: req.body?.area_name,
        status: req.body?.status,
        operatorId: req.authUser?.id || null,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        statusCode: 201,
        message: 'Colaborador registrado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  }
};
