import { Router } from 'express';

import { AuthController } from '../controllers/authController.js';
import { optionalAuth, requireAuth, requirePermission } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', optionalAuth, AuthController.logout);
router.get('/me', requireAuth, AuthController.me);
router.get('/catalog', requireAuth, requirePermission('view_sensitive'), AuthController.catalog);

export default router;
