import { Router } from 'express';

import { CollaboratorsController } from '../controllers/collaboratorsController.js';
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, requirePermission('collaborators.view'), CollaboratorsController.list);
router.get('/:collaboratorId', requireAuth, requirePermission('collaborators.view'), CollaboratorsController.show);
router.post('/', requireAuth, requirePermission('collaborators.create'), CollaboratorsController.create);

export default router;
