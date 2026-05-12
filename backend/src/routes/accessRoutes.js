import { Router } from 'express';

import { AccessController } from '../controllers/accessController.js';
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/map', requireAuth, requirePermission('access.view'), AccessController.map);
router.get('/catalog', requireAuth, requirePermission('access.view'), AccessController.catalog);

router.get('/media', requireAuth, requirePermission('access.view'), AccessController.listMedia);
router.get('/media/:accessMediaId', requireAuth, requirePermission('access.view'), AccessController.getMediaDetail);
router.post('/media', requireAuth, requirePermission('access.create'), AccessController.createMedia);

router.get('/media-assignments', requireAuth, requirePermission('access.view'), AccessController.listMediaAssignments);
router.post('/media-assignments', requireAuth, requirePermission('access.assign'), AccessController.assignMedia);
router.post(
  '/media-assignments/:accessMediaAssignmentId/return',
  requireAuth,
  requirePermission('access.assign'),
  AccessController.returnMediaAssignment
);
router.post(
  '/media-assignments/:accessMediaAssignmentId/not-returned',
  requireAuth,
  requirePermission('access.assign'),
  AccessController.markMediaAssignmentNotReturned
);


export default router;

