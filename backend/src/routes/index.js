import { Router } from 'express';

import accessRoutes from './accessRoutes.js';
import authRoutes from './authRoutes.js';
import collaboratorsRoutes from './collaboratorsRoutes.js';
import healthRoutes from './healthRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import ticketsRoutes from './ticketsRoutes.js';
import usersRoutes from './usersRoutes.js';

const router = Router();

router.use('/access', accessRoutes);
router.use('/auth', authRoutes);
router.use('/collaborators', collaboratorsRoutes);
router.use('/health', healthRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/users', usersRoutes);

export default router;
