import { AuditService } from '../services/auditService.js';
import { AccessService } from '../services/accessService.js';

export const AccessController = {
  async map(_req, res, next) {
    try {
      const data = AccessService.getMap();

      res.success({
        message: 'MAP operativo de Access obtenido correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async catalog(_req, res, next) {
    try {
      const data = await AccessService.getCatalog();

      res.success({
        message: 'Catalogo operativo de Access obtenido correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async listMedia(req, res, next) {
    try {
      const data = await AccessService.listAccessMedia({
        query: req.query
      });

      res.success({
        message: 'Medios de acceso obtenidos correctamente.',
        data,
        meta: {
          total: data.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getMediaDetail(req, res, next) {
    try {
      const data = await AccessService.getAccessMediaById(req.params.accessMediaId);

      res.success({
        message: 'Detalle del medio de acceso obtenido correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async createMedia(req, res, next) {
    try {
      const data = await AccessService.createAccessMedia({
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        statusCode: 201,
        message: 'Medio de acceso creado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async listMediaAssignments(req, res, next) {
    try {
      const data = await AccessService.listAccessMediaAssignments({
        query: req.query
      });

      res.success({
        message: 'Asignaciones de medios de acceso obtenidas correctamente.',
        data,
        meta: {
          total: data.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async assignMedia(req, res, next) {
    try {
      const data = await AccessService.assignAccessMedia({
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        statusCode: 201,
        message: 'Medio de acceso asignado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async returnMediaAssignment(req, res, next) {
    try {
      const data = await AccessService.returnAccessMediaAssignment({
        accessMediaAssignmentId: req.params.accessMediaAssignmentId,
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'Asignacion del medio de acceso cerrada con devolucion correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async markMediaAssignmentNotReturned(req, res, next) {
    try {
      const data = await AccessService.markAccessMediaAssignmentNotReturned({
        accessMediaAssignmentId: req.params.accessMediaAssignmentId,
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'Asignacion del medio marcada como no devuelta correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

};

