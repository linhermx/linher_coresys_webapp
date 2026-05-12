import { Router } from 'express';

import { AccessController } from '../controllers/accessController.js';
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/map', requireAuth, requirePermission('access.view'), AccessController.map);
router.get('/catalog', requireAuth, requirePermission('access.view'), AccessController.catalog);

router.get('/media', requireAuth, requirePermission('access.view'), AccessController.listMedia);
router.get('/media/:accessMediaId', requireAuth, requirePermission('access.view'), AccessController.getMediaDetail);
router.post('/media', requireAuth, requirePermission('access.create'), AccessController.createMedia);


export default router;

