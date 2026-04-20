import { Router } from 'express';

import { InventoryController } from '../controllers/inventoryController.js';
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/map', requireAuth, requirePermission('inventory.view'), InventoryController.map);
router.get('/catalog', requireAuth, requirePermission('inventory.view'), InventoryController.catalog);
router.get('/assets', requireAuth, requirePermission('inventory.view'), InventoryController.listAssets);
router.get('/assets/:assetId', requireAuth, requirePermission('inventory.view'), InventoryController.getAssetDetail);
router.post('/assets', requireAuth, requirePermission('inventory.create'), InventoryController.createAsset);
router.post('/movements', requireAuth, requirePermission('inventory.update'), InventoryController.registerMovement);

export default router;
