import { Router } from 'express';

import authRoutes from './authRoutes.js';
import collaboratorsRoutes from './collaboratorsRoutes.js';
import healthRoutes from './healthRoutes.js';
import usersRoutes from './usersRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/collaborators', collaboratorsRoutes);
router.use('/health', healthRoutes);
router.use('/users', usersRoutes);

export default router;
