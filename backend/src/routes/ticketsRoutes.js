import { Router } from 'express';

import { TicketsController } from '../controllers/ticketsController.js';
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js';
import { ticketAttachmentUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/', requireAuth, requirePermission('tickets.view'), TicketsController.list);
router.get('/catalog', requireAuth, requirePermission('tickets.view'), TicketsController.catalog);
router.post('/', requireAuth, requirePermission('tickets.create'), TicketsController.create);
router.patch('/:ticketId', requireAuth, requirePermission('tickets.update'), TicketsController.update);
router.patch('/:ticketId/status', requireAuth, requirePermission('tickets.assign'), TicketsController.updateStatus);
router.post('/:ticketId/comments', requireAuth, requirePermission('tickets.update'), TicketsController.addComment);
router.post(
  '/:ticketId/attachments',
  requireAuth,
  requirePermission('tickets.update'),
  ticketAttachmentUpload,
  TicketsController.addAttachment
);

export default router;
