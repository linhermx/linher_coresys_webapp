import { AuditService } from '../services/auditService.js';
import { TicketService } from '../services/ticketService.js';

export const TicketsController = {
  async list(_req, res, next) {
    try {
      const data = await TicketService.listTickets();

      res.success({
        message: 'Bandeja de tickets obtenida correctamente.',
        data,
        meta: {
          total: data.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async catalog(_req, res, next) {
    try {
      const data = await TicketService.getCatalog();

      res.success({
        message: 'Catálogo operativo de tickets obtenido correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const data = await TicketService.createTicket({
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        statusCode: 201,
        message: 'Ticket creado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const data = await TicketService.updateTicket({
        ticketId: req.params.ticketId,
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'Ticket actualizado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const data = await TicketService.updateTicketStatus({
        ticketId: req.params.ticketId,
        status: req.body?.status,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'Estado de ticket actualizado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async addAttachment(req, res, next) {
    try {
      const data = await TicketService.addAttachment({
        ticketId: req.params.ticketId,
        file: req.file,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        statusCode: 201,
        message: 'Adjunto agregado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async addComment(req, res, next) {
    try {
      const data = await TicketService.addComment({
        ticketId: req.params.ticketId,
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        statusCode: 201,
        message: 'Comentario agregado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  }
};
