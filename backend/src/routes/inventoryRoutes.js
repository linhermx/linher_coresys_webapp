import { Router } from 'express';

import { InventoryController } from '../controllers/inventoryController.js';
import { requireAuth, requirePermission } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/map', requireAuth, requirePermission('inventory.view'), InventoryController.map);
router.get('/catalog', requireAuth, requirePermission('inventory.view'), InventoryController.catalog);
router.get('/catalog/asset-types', requireAuth, requirePermission('inventory.view'), InventoryController.listCatalogAssetTypes);
router.post('/catalog/asset-types', requireAuth, requirePermission('inventory.update'), InventoryController.createCatalogAssetType);
router.patch('/catalog/asset-types/:assetTypeId', requireAuth, requirePermission('inventory.update'), InventoryController.updateCatalogAssetType);
router.post('/catalog/asset-types/:assetTypeId/deactivate', requireAuth, requirePermission('inventory.update'), InventoryController.deactivateCatalogAssetType);
router.post('/catalog/asset-types/:assetTypeId/reactivate', requireAuth, requirePermission('inventory.update'), InventoryController.reactivateCatalogAssetType);
router.get('/catalog/location-types', requireAuth, requirePermission('inventory.view'), InventoryController.listCatalogLocationTypes);
router.post('/catalog/location-types', requireAuth, requirePermission('inventory.update'), InventoryController.createCatalogLocationType);
router.patch('/catalog/location-types/:locationTypeId', requireAuth, requirePermission('inventory.update'), InventoryController.updateCatalogLocationType);
router.post('/catalog/location-types/:locationTypeId/deactivate', requireAuth, requirePermission('inventory.update'), InventoryController.deactivateCatalogLocationType);
router.post('/catalog/location-types/:locationTypeId/reactivate', requireAuth, requirePermission('inventory.update'), InventoryController.reactivateCatalogLocationType);
router.get('/assets', requireAuth, requirePermission('inventory.view'), InventoryController.listAssets);
router.get('/assets/:assetId', requireAuth, requirePermission('inventory.view'), InventoryController.getAssetDetail);
router.get('/assets/:assetId/units', requireAuth, requirePermission('inventory.view'), InventoryController.listAssetUnits);
router.get('/asset-units', requireAuth, requirePermission('inventory.view'), InventoryController.listAvailableAssetUnits);
router.post('/assets/:assetId/units', requireAuth, requirePermission('inventory.create'), InventoryController.createAssetUnits);
router.patch('/assets/:assetId', requireAuth, requirePermission('inventory.update'), InventoryController.updateAsset);
router.get('/locations', requireAuth, requirePermission('inventory.view'), InventoryController.listLocations);
router.get('/locations/:locationId/label', requireAuth, requirePermission('inventory.view'), InventoryController.getLocationLabel);
router.get('/movements', requireAuth, requirePermission('inventory.view'), InventoryController.listMovements);
router.get('/assignments', requireAuth, requirePermission('inventory.view'), InventoryController.listAssignments);
router.post('/assets', requireAuth, requirePermission('inventory.create'), InventoryController.createAsset);
router.post('/locations', requireAuth, requirePermission('inventory.create'), InventoryController.createLocation);
router.post('/movements', requireAuth, requirePermission('inventory.update'), InventoryController.registerMovement);
router.post('/assignments', requireAuth, requirePermission('inventory.assign'), InventoryController.createAssignment);
router.post('/assignments/:assignmentId/close', requireAuth, requirePermission('inventory.assign'), InventoryController.closeAssignment);
router.patch('/locations/:locationId', requireAuth, requirePermission('inventory.update'), InventoryController.updateLocation);
router.patch('/units/:assetUnitId/status', requireAuth, requirePermission('inventory.update'), InventoryController.updateAssetUnitStatus);
router.get('/units/:assetUnitId/label', requireAuth, requirePermission('inventory.view'), InventoryController.getAssetUnitLabel);

export default router;
