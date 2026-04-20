import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { InventoryModel } from '../models/InventoryModel.js';
import { AuditService } from './auditService.js';

const inventoryModel = new InventoryModel(pool);

const normalizeText = (value) => String(value || '').trim();

const normalizeId = (value) => {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    return null;
  }

  return normalized;
};

const normalizeDecimal = (value, { allowZero = false } = {}) => {
  const normalized = Number(value);

  if (!Number.isFinite(normalized)) {
    return null;
  }

  if (allowZero) {
    return normalized >= 0 ? normalized : null;
  }

  return normalized > 0 ? normalized : null;
};

const normalizeDateTime = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return `${parsed.toISOString().slice(0, 19).replace('T', ' ')}`;
};

const normalizeStatus = (value, fallback = 'active') => {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) {
    return fallback;
  }

  return normalized;
};

const normalizeReferenceType = (value) => {
  const normalized = normalizeText(value).toLowerCase();
  return normalized || null;
};

const assertRequiredText = (value, fieldLabel) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    throw new AppError(`Debes indicar ${fieldLabel}.`, {
      statusCode: 400,
      code: 'INVALID_INVENTORY_FIELD',
      details: {
        field: fieldLabel
      }
    });
  }

  return normalized;
};

const toAssetResponse = (row) => ({
  id: Number(row.id),
  asset_type_id: Number(row.asset_type_id),
  type_key: row.type_key,
  type_name: row.type_name,
  asset_category_id: Number(row.asset_category_id),
  category_key: row.category_key,
  category_name: row.category_name,
  tracking_mode_id: Number(row.tracking_mode_id),
  tracking_mode_key: row.tracking_mode_key,
  tracking_mode_name: row.tracking_mode_name,
  asset_name: row.asset_name,
  internal_code: row.internal_code || null,
  brand: row.brand || null,
  model: row.model || null,
  min_quantity: Number(row.min_quantity || 0),
  status: row.status,
  description: row.description || null,
  created_at: row.created_at,
  updated_at: row.updated_at,
  units_count: Number(row.units_count || 0),
  stock_quantity: Number(row.stock_quantity || 0)
});

const toAssetUnitResponse = (row) => ({
  id: Number(row.id),
  asset_id: Number(row.asset_id),
  asset_tag: row.asset_tag,
  serial_number: row.serial_number || null,
  asset_unit_status_id: Number(row.asset_unit_status_id),
  status_key: row.status_key,
  status_name: row.status_name,
  current_location_id: row.current_location_id ? Number(row.current_location_id) : null,
  current_location_name: row.current_location_name || null,
  acquired_at: row.acquired_at,
  warranty_expires_at: row.warranty_expires_at,
  notes: row.notes || null,
  created_at: row.created_at,
  updated_at: row.updated_at
});

const toInventoryMovementResponse = (row) => ({
  id: Number(row.id),
  movement_type_id: Number(row.movement_type_id),
  movement_type_key: row.movement_type_key,
  movement_type_name: row.movement_type_name,
  direction: row.direction,
  operator_id: row.operator_id ? Number(row.operator_id) : null,
  operator_name: row.operator_name || null,
  reason: row.reason,
  reference_type: row.reference_type || null,
  reference_id: row.reference_id ? Number(row.reference_id) : null,
  happened_at: row.happened_at,
  created_at: row.created_at,
  movement_line_id: Number(row.movement_line_id),
  asset_unit_id: row.asset_unit_id ? Number(row.asset_unit_id) : null,
  quantity: Number(row.quantity),
  from_location_id: row.from_location_id ? Number(row.from_location_id) : null,
  from_location_name: row.from_location_name || null,
  to_location_id: row.to_location_id ? Number(row.to_location_id) : null,
  to_location_name: row.to_location_name || null,
  movement_line_notes: row.movement_line_notes || null
});

const validateMovementLine = async ({ line, index, model }) => {
  const lineNumber = index + 1;
  const assetId = normalizeId(line?.asset_id);
  if (!assetId) {
    throw new AppError(`La línea ${lineNumber} no contiene un asset_id válido.`, {
      statusCode: 400,
      code: 'INVALID_INVENTORY_MOVEMENT_LINE'
    });
  }

  const quantity = normalizeDecimal(line?.quantity);
  if (!quantity) {
    throw new AppError(`La línea ${lineNumber} debe incluir cantidad mayor a cero.`, {
      statusCode: 400,
      code: 'INVALID_INVENTORY_MOVEMENT_LINE'
    });
  }

  const asset = await model.getAssetById(assetId);
  if (!asset) {
    throw new AppError(`El activo de la línea ${lineNumber} no existe o está inactivo.`, {
      statusCode: 404,
      code: 'ASSET_NOT_FOUND'
    });
  }

  const assetUnitId = normalizeId(line?.asset_unit_id);
  if (assetUnitId) {
    const unit = await model.getAssetUnitById(assetUnitId);
    if (!unit || Number(unit.asset_id) !== assetId) {
      throw new AppError(`La unidad de la línea ${lineNumber} no pertenece al activo indicado.`, {
        statusCode: 400,
        code: 'INVALID_INVENTORY_MOVEMENT_LINE'
      });
    }
  }

  const fromLocationId = normalizeId(line?.from_location_id);
  if (fromLocationId) {
    const location = await model.getLocationById(fromLocationId);
    if (!location) {
      throw new AppError(`La ubicación origen de la línea ${lineNumber} no existe.`, {
        statusCode: 404,
        code: 'LOCATION_NOT_FOUND'
      });
    }
  }

  const toLocationId = normalizeId(line?.to_location_id);
  if (toLocationId) {
    const location = await model.getLocationById(toLocationId);
    if (!location) {
      throw new AppError(`La ubicación destino de la línea ${lineNumber} no existe.`, {
        statusCode: 404,
        code: 'LOCATION_NOT_FOUND'
      });
    }
  }

  return {
    asset_id: assetId,
    asset_unit_id: assetUnitId,
    quantity,
    from_location_id: fromLocationId,
    to_location_id: toLocationId,
    notes: normalizeText(line?.notes) || null,
    asset_name: asset.asset_name
  };
};

export const InventoryService = {
  getMap() {
    return {
      purpose: 'Controlar activos e insumos de Sistemas con trazabilidad completa de estado, ubicación y movimientos.',
      problem: 'Evitar pérdidas y desorden operativo por falta de control de existencia, responsable y ubicación.',
      root_entity: 'assets',
      lifecycle: ['available', 'assigned', 'in_repair', 'retired'],
      main_flow: ['create_asset', 'register_movement', 'assign_unit', 'return_unit', 'retire_asset'],
      critical_actions: ['view', 'create', 'update', 'assign', 'track_movements'],
      relationships: [
        'assets -> asset_units',
        'assets -> inventory_movements',
        'asset_units -> asset_assignments',
        'assets -> ticket_asset_units (future)',
        'assets -> ticket_asset_stocks (future)'
      ],
      traceability: ['asset_created', 'inventory_movement_registered', 'asset_assignment_created']
    };
  },

  async getCatalog() {
    const [trackingModes, categories, types, unitStatuses, locationTypes, movementTypes] = await Promise.all([
      inventoryModel.listTrackingModes(),
      inventoryModel.listAssetCategories(),
      inventoryModel.listAssetTypes(),
      inventoryModel.listAssetUnitStatuses(),
      inventoryModel.listLocationTypes(),
      inventoryModel.listMovementTypes()
    ]);

    return {
      tracking_modes: trackingModes,
      categories,
      types,
      unit_statuses: unitStatuses,
      location_types: locationTypes,
      movement_types: movementTypes
    };
  },

  async listAssets({ query = {} } = {}) {
    const rows = await inventoryModel.listAssets({
      trackingModeKey: query.tracking_mode_key,
      status: query.status,
      search: query.search
    });

    return rows.map(toAssetResponse);
  },

  async getAssetDetail(assetId, { movementLimit = 40 } = {}) {
    const normalizedAssetId = normalizeId(assetId);
    if (!normalizedAssetId) {
      throw new AppError('El identificador del activo no es válido.', {
        statusCode: 400,
        code: 'INVALID_ASSET_ID'
      });
    }

    const asset = await inventoryModel.getAssetById(normalizedAssetId);
    if (!asset) {
      throw new AppError('El activo solicitado no existe.', {
        statusCode: 404,
        code: 'ASSET_NOT_FOUND'
      });
    }

    const [units, movements] = await Promise.all([
      inventoryModel.listAssetUnits(normalizedAssetId),
      inventoryModel.listInventoryMovementsByAsset(normalizedAssetId, {
        limit: movementLimit
      })
    ]);

    return {
      asset: toAssetResponse(asset),
      units: units.map(toAssetUnitResponse),
      movements: movements.map(toInventoryMovementResponse)
    };
  },

  async createAsset({ payload, authUser = null, requestContext = {} }) {
    const assetTypeId = normalizeId(payload?.asset_type_id);
    if (!assetTypeId) {
      throw new AppError('Debes indicar un tipo de activo válido.', {
        statusCode: 400,
        code: 'INVALID_ASSET_TYPE'
      });
    }

    const assetType = await inventoryModel.getAssetTypeById(assetTypeId);
    if (!assetType) {
      throw new AppError('El tipo de activo indicado no existe.', {
        statusCode: 404,
        code: 'ASSET_TYPE_NOT_FOUND'
      });
    }

    const trackingModeKey = normalizeText(payload?.tracking_mode_key).toLowerCase() || assetType.default_tracking_mode_key;
    if (!trackingModeKey) {
      throw new AppError('El tipo de activo no tiene modo de seguimiento configurado.', {
        statusCode: 400,
        code: 'INVALID_TRACKING_MODE'
      });
    }

    const trackingMode = await inventoryModel.getTrackingModeByKey(trackingModeKey);
    if (!trackingMode) {
      throw new AppError('El modo de seguimiento indicado no existe.', {
        statusCode: 404,
        code: 'TRACKING_MODE_NOT_FOUND'
      });
    }

    const assetName = assertRequiredText(payload?.asset_name, 'el nombre del activo');
    const minQuantity = normalizeDecimal(payload?.min_quantity, { allowZero: true });

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);

      const assetId = await txModel.createAsset(connection, {
        assetTypeId,
        trackingModeId: Number(trackingMode.id),
        assetName,
        internalCode: normalizeText(payload?.internal_code) || null,
        brand: normalizeText(payload?.brand) || null,
        model: normalizeText(payload?.model) || null,
        minQuantity: minQuantity ?? 0,
        status: normalizeStatus(payload?.status),
        description: normalizeText(payload?.description) || null
      });

      const createdAsset = await txModel.getAssetById(assetId);

      await txModel.createAssetEvent(connection, {
        assetId,
        operatorId: authUser?.id || null,
        actionKey: 'asset_created',
        entityType: 'assets',
        entityId: assetId,
        reason: normalizeText(payload?.reason) || 'Alta inicial de activo.',
        beforeSnapshot: null,
        afterSnapshot: createdAsset
      });

      await connection.commit();

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.create_asset',
        entityType: 'assets',
        entityId: assetId,
        beforeSnapshot: null,
        afterSnapshot: createdAsset,
        requestContext
      });

      return toAssetResponse(createdAsset);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async registerMovement({ payload, authUser = null, requestContext = {} }) {
    const movementTypeKey = normalizeText(payload?.movement_type_key).toLowerCase();
    if (!movementTypeKey) {
      throw new AppError('Debes indicar el tipo de movimiento.', {
        statusCode: 400,
        code: 'INVALID_MOVEMENT_TYPE'
      });
    }

    const movementType = await inventoryModel.getMovementTypeByKey(movementTypeKey);
    if (!movementType) {
      throw new AppError('El tipo de movimiento no existe.', {
        statusCode: 404,
        code: 'MOVEMENT_TYPE_NOT_FOUND'
      });
    }

    const reason = assertRequiredText(payload?.reason, 'el motivo del movimiento');

    if (!Array.isArray(payload?.lines) || payload.lines.length === 0) {
      throw new AppError('Debes indicar al menos una línea de movimiento.', {
        statusCode: 400,
        code: 'INVALID_INVENTORY_MOVEMENT_LINES'
      });
    }

    const lineModel = new InventoryModel(pool);
    const normalizedLines = [];

    for (let index = 0; index < payload.lines.length; index += 1) {
      const line = payload.lines[index];
      const normalizedLine = await validateMovementLine({
        line,
        index,
        model: lineModel
      });

      normalizedLines.push(normalizedLine);
    }

    const happenedAt = normalizeDateTime(payload?.happened_at);
    if (payload?.happened_at && !happenedAt) {
      throw new AppError('La fecha del movimiento no tiene un formato válido.', {
        statusCode: 400,
        code: 'INVALID_MOVEMENT_DATE'
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);

      const movementId = await txModel.createInventoryMovement(connection, {
        movementTypeId: Number(movementType.id),
        operatorId: authUser?.id || null,
        reason,
        referenceType: normalizeReferenceType(payload?.reference_type),
        referenceId: normalizeId(payload?.reference_id),
        happenedAt
      });

      for (const line of normalizedLines) {
        const movementLineId = await txModel.createInventoryMovementLine(connection, {
          inventoryMovementId: movementId,
          assetId: line.asset_id,
          assetUnitId: line.asset_unit_id,
          quantity: line.quantity,
          fromLocationId: line.from_location_id,
          toLocationId: line.to_location_id,
          notes: line.notes
        });

        await txModel.createAssetEvent(connection, {
          assetId: line.asset_id,
          assetUnitId: line.asset_unit_id,
          operatorId: authUser?.id || null,
          actionKey: 'inventory_movement_registered',
          entityType: 'inventory_movement_lines',
          entityId: movementLineId,
          reason,
          beforeSnapshot: null,
          afterSnapshot: {
            movement_id: movementId,
            movement_line_id: movementLineId,
            movement_type_key: movementTypeKey,
            quantity: line.quantity,
            from_location_id: line.from_location_id,
            to_location_id: line.to_location_id
          }
        });
      }

      await connection.commit();

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.register_movement',
        entityType: 'inventory_movements',
        entityId: movementId,
        beforeSnapshot: null,
        afterSnapshot: {
          movement_type_key: movementTypeKey,
          reason,
          lines: normalizedLines
        },
        requestContext
      });

      return {
        movement_id: movementId,
        movement_type_key: movementTypeKey,
        lines_count: normalizedLines.length
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};
