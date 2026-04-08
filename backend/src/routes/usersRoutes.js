import { Router } from 'express';

import { UsersController } from '../controllers/usersController.js';
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, requirePermission('users.view'), UsersController.list);
router.get('/:userId', requireAuth, requirePermission('users.view'), UsersController.show);
router.post('/', requireAuth, requirePermission('users.create'), UsersController.create);

export default router;
