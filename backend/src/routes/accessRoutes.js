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
  '/grants',
  requireAuth,
  requirePermission('access.assign'),
  requirePermission('access.create'),
  AccessController.grantAccess
);
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

router.get('/enrollments', requireAuth, requirePermission('access.view'), AccessController.listEnrollments);
router.post('/enrollments', requireAuth, requirePermission('access.create'), AccessController.createEnrollment);
router.patch(
  '/enrollments/:accessEnrollmentId/status',
  requireAuth,
  requirePermission('access.update'),
  AccessController.updateEnrollmentStatus
);
router.post(
  '/collaborators/:collaboratorId/offboard',
  requireAuth,
  requirePermission('access.assign'),
  AccessController.offboardCollaborator
);

router.get('/events', requireAuth, requirePermission('access.view'), AccessController.listEvents);

export default router;

