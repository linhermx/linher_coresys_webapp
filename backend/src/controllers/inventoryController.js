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
  }
};
