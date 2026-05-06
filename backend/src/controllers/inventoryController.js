import { AuditService } from '../services/auditService.js';
import { InventoryService } from '../services/inventoryService.js';

export const InventoryController = {
  async map(_req, res, next) {
    try {
      const data = InventoryService.getMap();

      res.success({
        message: 'MAP operativo de inventario obtenido correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async catalog(_req, res, next) {
    try {
      const data = await InventoryService.getCatalog();

      res.success({
        message: 'Catálogo operativo de inventario obtenido correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async listCatalogAssetTypes(req, res, next) {
    try {
      const data = await InventoryService.listCatalogAssetTypes({
        query: req.query
      });

      res.success({
        message: 'Tipos de activo obtenidos correctamente.',
        data,
        meta: {
          total: data.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async createCatalogAssetType(req, res, next) {
    try {
      const data = await InventoryService.createCatalogAssetType({
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        statusCode: 201,
        message: 'Tipo de activo creado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async updateCatalogAssetType(req, res, next) {
    try {
      const data = await InventoryService.updateCatalogAssetType({
        assetTypeId: req.params.assetTypeId,
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'Tipo de activo actualizado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async deactivateCatalogAssetType(req, res, next) {
    try {
      const data = await InventoryService.deactivateCatalogAssetType({
        assetTypeId: req.params.assetTypeId,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'Tipo de activo desactivado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async reactivateCatalogAssetType(req, res, next) {
    try {
      const data = await InventoryService.reactivateCatalogAssetType({
        assetTypeId: req.params.assetTypeId,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'Tipo de activo reactivado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async listCatalogLocationTypes(req, res, next) {
    try {
      const data = await InventoryService.listCatalogLocationTypes({
        query: req.query
      });

      res.success({
        message: 'Tipos de ubicación obtenidos correctamente.',
        data,
        meta: {
          total: data.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async createCatalogLocationType(req, res, next) {
    try {
      const data = await InventoryService.createCatalogLocationType({
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        statusCode: 201,
        message: 'Tipo de ubicación creado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async updateCatalogLocationType(req, res, next) {
    try {
      const data = await InventoryService.updateCatalogLocationType({
        locationTypeId: req.params.locationTypeId,
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'Tipo de ubicación actualizado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async deactivateCatalogLocationType(req, res, next) {
    try {
      const data = await InventoryService.deactivateCatalogLocationType({
        locationTypeId: req.params.locationTypeId,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'Tipo de ubicación desactivado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async reactivateCatalogLocationType(req, res, next) {
    try {
      const data = await InventoryService.reactivateCatalogLocationType({
        locationTypeId: req.params.locationTypeId,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'Tipo de ubicación reactivado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async listAssets(req, res, next) {
    try {
      const data = await InventoryService.listAssets({
        query: req.query
      });

      res.success({
        message: 'Activos de inventario obtenidos correctamente.',
        data,
        meta: {
          total: data.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async listLocations(req, res, next) {
    try {
      const data = await InventoryService.listLocations({
        query: req.query
      });

      res.success({
        message: 'Ubicaciones de inventario obtenidas correctamente.',
        data,
        meta: {
          total: data.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async listMovements(req, res, next) {
    try {
      const data = await InventoryService.listMovements({
        query: req.query
      });

      res.success({
        message: 'Movimientos de inventario obtenidos correctamente.',
        data,
        meta: {
          total: data.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getAssetDetail(req, res, next) {
    try {
      const data = await InventoryService.getAssetDetail(req.params.assetId, {
        movementLimit: req.query?.movement_limit
      });

      res.success({
        message: 'Detalle de activo obtenido correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async listAssetUnits(req, res, next) {
    try {
      const data = await InventoryService.listAssetUnits(req.params.assetId);

      res.success({
        message: 'Unidades serializadas obtenidas correctamente.',
        data,
        meta: {
          total: data.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async listAvailableAssetUnits(req, res, next) {
    try {
      const data = await InventoryService.listAvailableAssetUnits({
        query: req.query
      });

      res.success({
        message: 'Unidades de inventario obtenidas correctamente.',
        data,
        meta: {
          total: data.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async createAsset(req, res, next) {
    try {
      const data = await InventoryService.createAsset({
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        statusCode: 201,
        message: 'Activo de inventario creado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async updateAsset(req, res, next) {
    try {
      const data = await InventoryService.updateAsset({
        assetId: req.params.assetId,
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'Activo de inventario actualizado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async createLocation(req, res, next) {
    try {
      const data = await InventoryService.createLocation({
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        statusCode: 201,
        message: 'Ubicación creada correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async updateLocation(req, res, next) {
    try {
      const data = await InventoryService.updateLocation({
        locationId: req.params.locationId,
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'Ubicación actualizada correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async registerMovement(req, res, next) {
    try {
      const data = await InventoryService.registerMovement({
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        statusCode: 201,
        message: 'Movimiento de inventario registrado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async createAssetUnits(req, res, next) {
    try {
      const data = await InventoryService.createAssetUnits({
        assetId: req.params.assetId,
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        statusCode: 201,
        message: 'Unidades serializadas registradas correctamente.',
        data,
        meta: {
          total: data.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async listAssignments(req, res, next) {
    try {
      const data = await InventoryService.listAssignments({
        query: req.query
      });

      res.success({
        message: 'Resguardos obtenidos correctamente.',
        data,
        meta: {
          total: data.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async createAssignment(req, res, next) {
    try {
      const data = await InventoryService.createAssignment({
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        statusCode: 201,
        message: 'Resguardo generado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async closeAssignment(req, res, next) {
    try {
      const data = await InventoryService.closeAssignment({
        assignmentId: req.params.assignmentId,
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'Resguardo cerrado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async updateAssetUnitStatus(req, res, next) {
    try {
      const data = await InventoryService.updateAssetUnitStatus({
        assetUnitId: req.params.assetUnitId,
        payload: req.body,
        authUser: req.authUser,
        requestContext: AuditService.buildRequestContext(req)
      });

      res.success({
        message: 'Estado de la unidad actualizado correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async getAssetUnitLabel(req, res, next) {
    try {
      const data = await InventoryService.getAssetUnitLabel(req.params.assetUnitId);

      res.success({
        message: 'Etiqueta de unidad obtenida correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async getLocationLabel(req, res, next) {
    try {
      const data = await InventoryService.getLocationLabel(req.params.locationId);

      res.success({
        message: 'Etiqueta de ubicación obtenida correctamente.',
        data
      });
    } catch (error) {
      next(error);
    }
  }
};
