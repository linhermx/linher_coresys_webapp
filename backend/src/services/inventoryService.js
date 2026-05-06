import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { CollaboratorModel } from '../models/CollaboratorModel.js';
import { InventoryModel } from '../models/InventoryModel.js';
import { AuditService } from './auditService.js';

const inventoryModel = new InventoryModel(pool);
const collaboratorModel = new CollaboratorModel(pool);

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

const normalizeCodePrefix = (value, fieldLabel = 'el código corto') => {
  const normalized = normalizeText(value).toUpperCase();
  if (!normalized || !/^[A-Z0-9]{2,12}$/.test(normalized)) {
    throw new AppError(`Debes indicar ${fieldLabel} con 2 a 12 caracteres alfanuméricos.`, {
      statusCode: 400,
      code: 'INVALID_CODE_PREFIX'
    });
  }

  return normalized;
};

const normalizeLocationKey = (value) => {
  const normalized = normalizeText(value)
    .toUpperCase()
    .replace(/\s+/g, '-');

  if (!normalized || !/^[A-Z0-9-]+$/.test(normalized)) {
    throw new AppError('Debes indicar una clave válida usando solo letras, números o guiones.', {
      statusCode: 400,
      code: 'INVALID_LOCATION_KEY'
    });
  }

  return normalized;
};

const slugifyTechnicalKey = (value) => (
  normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
);

const parseTrailingSequence = (value) => {
  const match = String(value || '').match(/-(\d{3,})$/);
  return match ? Number(match[1]) : 0;
};

const incrementAlphabeticSuffix = (currentSuffix) => {
  if (!currentSuffix) {
    return 'A';
  }

  const chars = currentSuffix.split('');
  let index = chars.length - 1;

  while (index >= 0) {
    if (chars[index] !== 'Z') {
      chars[index] = String.fromCharCode(chars[index].charCodeAt(0) + 1);
      return chars.join('');
    }

    chars[index] = 'A';
    index -= 1;
  }

  return `A${chars.join('')}`;
};

const buildAssetCode = ({ codePrefix, sequence }) => `INV-${codePrefix}-${String(sequence).padStart(3, '0')}`;
const buildLocationCode = ({ codePrefix, locationKey }) => `LOC-${codePrefix}-${locationKey}`;
const buildAssetTag = ({ codePrefix, assetSequence, suffix }) => (
  `UNI-${codePrefix}-${String(assetSequence).padStart(3, '0')}-${suffix}`
);

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

const OPERATIONAL_STATUS_LABELS = {
  available: 'Disponible',
  assigned: 'Asignado',
  in_repair: 'En reparación',
  retired: 'Baja'
};

const toOperationalStatusName = (statusKey) => (
  OPERATIONAL_STATUS_LABELS[statusKey] || 'Sin estado operativo'
);

const resolveStockOperationalStatusKey = (row) => {
  const latestSignal = normalizeText(row?.latest_stock_signal_key).toLowerCase();
  if (latestSignal === 'retire_out') {
    return 'retired';
  }

  if (latestSignal === 'repair_out') {
    return 'in_repair';
  }

  if (latestSignal === 'repair_in') {
    return 'available';
  }

  return normalizeStatus(row?.status, 'active') === 'inactive'
    ? 'retired'
    : 'available';
};

const resolveUnitOperationalStatusKey = (row) => {
  const unitsCount = Number(row?.units_count || 0);
  const availableCount = Number(row?.available_units_count || 0);
  const assignedCount = Number(row?.assigned_units_count || 0);
  const repairCount = Number(row?.in_repair_units_count || 0);
  const retiredCount = Number(row?.retired_units_count || 0);

  if (unitsCount > 0 && retiredCount >= unitsCount) {
    return 'retired';
  }

  if (availableCount > 0) {
    return 'available';
  }

  if (assignedCount > 0) {
    return 'assigned';
  }

  if (repairCount > 0) {
    return 'in_repair';
  }

  if (unitsCount > 0) {
    return 'available';
  }

  return normalizeStatus(row?.status, 'active') === 'inactive'
    ? 'retired'
    : 'available';
};

const resolveAssetOperationalStatus = (row) => {
  const statusKey = row?.tracking_mode_key === 'unit'
    ? resolveUnitOperationalStatusKey(row)
    : resolveStockOperationalStatusKey(row);

  return {
    operational_status_key: statusKey,
    operational_status_name: toOperationalStatusName(statusKey)
  };
};

const buildCollaboratorSummary = (row) => ({
  id: Number(row.collaborator_id),
  employee_id: Number(row.employee_id),
  full_name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
  area_name: row.area_name || null
});

const buildAssignmentResponse = (row) => ({
  ...toAssignmentResponse(row),
  collaborator: buildCollaboratorSummary(row),
  assigned_by_user_name: row.assigned_by_user_name || null,
  received_by_user_name: row.received_by_user_name || null,
  asset: row.asset_id ? {
    id: Number(row.asset_id),
    asset_name: row.asset_name || null,
    internal_code: row.internal_code || null,
    type_name: row.asset_type_name || null
  } : null,
  asset_unit: {
    id: Number(row.asset_unit_id),
    asset_tag: row.asset_tag || null,
    serial_number: row.serial_number || null,
    status_key: row.asset_unit_status_key || null,
    status_name: row.asset_unit_status_name || null
  },
  location: row.current_location_id ? {
    id: Number(row.current_location_id),
    name: row.current_location_name || null,
    code: row.current_location_code || null
  } : null
});

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
  record_status: row.status,
  ...resolveAssetOperationalStatus(row),
  description: row.description || null,
  created_at: row.created_at,
  updated_at: row.updated_at,
  units_count: Number(row.units_count || 0),
  available_units_count: Number(row.available_units_count || 0),
  assigned_units_count: Number(row.assigned_units_count || 0),
  in_repair_units_count: Number(row.in_repair_units_count || 0),
  retired_units_count: Number(row.retired_units_count || 0),
  stock_quantity: Number(row.stock_quantity || 0)
});

const toAssetUnitResponse = (row) => ({
  id: Number(row.id),
  asset_id: Number(row.asset_id),
  asset_tag: row.asset_tag,
  serial_number: row.serial_number || null,
  asset_name: row.asset_name || null,
  asset_internal_code: row.asset_internal_code || null,
  asset_type_name: row.asset_type_name || null,
  asset_unit_status_id: Number(row.asset_unit_status_id),
  status_key: row.status_key,
  status_name: row.status_name,
  current_location_id: row.current_location_id ? Number(row.current_location_id) : null,
  current_location_name: row.current_location_name || null,
  active_assignment: row.active_assignment_id ? {
    id: Number(row.active_assignment_id),
    status: row.active_assignment_status || null,
    assigned_at: row.active_assignment_assigned_at || null,
    expected_return_at: row.active_assignment_expected_return_at || null,
    collaborator_id: row.active_assignment_collaborator_id ? Number(row.active_assignment_collaborator_id) : null,
    employee_id: row.active_assignment_employee_id ? Number(row.active_assignment_employee_id) : null,
    collaborator_name: row.active_assignment_collaborator_name || null
  } : null,
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
  asset_id: row.asset_id ? Number(row.asset_id) : null,
  asset_name: row.asset_name || null,
  asset_unit_id: row.asset_unit_id ? Number(row.asset_unit_id) : null,
  quantity: Number(row.quantity),
  from_location_id: row.from_location_id ? Number(row.from_location_id) : null,
  from_location_name: row.from_location_name || null,
  to_location_id: row.to_location_id ? Number(row.to_location_id) : null,
  to_location_name: row.to_location_name || null,
  movement_line_notes: row.movement_line_notes || null
});

const toLocationResponse = (row) => ({
  id: Number(row.id),
  location_type_id: Number(row.location_type_id),
  location_type_key: row.location_type_key,
  location_type_name: row.location_type_name,
  name: row.name,
  code: row.code || null,
  parent_location_id: row.parent_location_id ? Number(row.parent_location_id) : null,
  parent_location_name: row.parent_location_name || null,
  description: row.description || null,
  status: row.status,
  created_at: row.created_at,
  updated_at: row.updated_at
});

const toCatalogAssetTypeResponse = (row) => ({
  id: Number(row.id),
  asset_category_id: Number(row.asset_category_id),
  category_key: row.category_key,
  category_name: row.category_name,
  type_key: row.type_key,
  code_prefix: row.code_prefix,
  name: row.name,
  default_tracking_mode_id: Number(row.default_tracking_mode_id),
  default_tracking_mode_key: row.default_tracking_mode_key,
  default_tracking_mode_name: row.default_tracking_mode_name || null,
  description: row.description || null,
  is_active: !row.deleted_at,
  deleted_at: row.deleted_at || null
});

const toCatalogLocationTypeResponse = (row) => ({
  id: Number(row.id),
  type_key: row.type_key,
  code_prefix: row.code_prefix,
  name: row.name,
  description: row.description || null,
  is_active: !row.deleted_at,
  deleted_at: row.deleted_at || null
});

const toAssignmentResponse = (row) => ({
  id: Number(row.id),
  asset_unit_id: Number(row.asset_unit_id),
  collaborator_id: Number(row.collaborator_id),
  assigned_by_user_id: row.assigned_by_user_id ? Number(row.assigned_by_user_id) : null,
  received_by_user_id: row.received_by_user_id ? Number(row.received_by_user_id) : null,
  assigned_at: row.assigned_at,
  expected_return_at: row.expected_return_at,
  returned_at: row.returned_at,
  delivery_condition: row.delivery_condition || null,
  return_condition: row.return_condition || null,
  status: row.status,
  notes: row.notes || null
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

const generateNextAssetCode = async ({ model, assetTypeId, codePrefix }) => {
  const lastCode = await model.getLastAssetInternalCodeByType(assetTypeId);
  const nextSequence = parseTrailingSequence(lastCode) + 1;
  return buildAssetCode({ codePrefix, sequence: nextSequence });
};

const generateLocationCode = async ({ model, locationType, locationKey, excludeLocationId = null }) => {
  const nextCode = buildLocationCode({
    codePrefix: locationType.code_prefix,
    locationKey
  });

  const existingLocation = await model.findLocationByCode(nextCode, {
    excludeLocationId
  });

  if (existingLocation) {
    throw new AppError('La clave indicada ya genera un código de ubicación existente.', {
      statusCode: 409,
      code: 'LOCATION_CODE_ALREADY_EXISTS'
    });
  }

  return nextCode;
};

const generateNextAssetTag = async ({ model, asset, assetType }) => {
  const assetSequence = parseTrailingSequence(asset.internal_code);
  if (!assetSequence) {
    throw new AppError('El activo maestro aún no tiene un código válido para generar unidades serializadas.', {
      statusCode: 409,
      code: 'ASSET_CODE_REQUIRED'
    });
  }

  const lastAssetTag = await model.getLastAssetTagByAsset(asset.id);
  const currentSuffix = lastAssetTag
    ? String(lastAssetTag).split('-').slice(-1)[0]
    : '';

  return buildAssetTag({
    codePrefix: assetType.code_prefix,
    assetSequence,
    suffix: incrementAlphabeticSuffix(currentSuffix)
  });
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
      types: types.map(toCatalogAssetTypeResponse),
      unit_statuses: unitStatuses,
      location_types: locationTypes.map(toCatalogLocationTypeResponse),
      movement_types: movementTypes
    };
  },

  async listCatalogAssetTypes({ query = {} } = {}) {
    const rows = await inventoryModel.listAssetTypes({
      includeInactive: String(query.include_inactive || '') === '1'
    });

    return rows.map(toCatalogAssetTypeResponse);
  },

  async createCatalogAssetType({ payload, authUser = null, requestContext = {} }) {
    const name = assertRequiredText(payload?.name, 'el nombre del tipo de activo');
    const codePrefix = normalizeCodePrefix(payload?.code_prefix);
    const assetCategoryId = normalizeId(payload?.asset_category_id);
    const defaultTrackingModeId = normalizeId(payload?.default_tracking_mode_id);

    if (!assetCategoryId) {
      throw new AppError('Debes indicar una categoría válida.', {
        statusCode: 400,
        code: 'INVALID_ASSET_CATEGORY'
      });
    }

    if (!defaultTrackingModeId) {
      throw new AppError('Debes indicar un modo de seguimiento válido.', {
        statusCode: 400,
        code: 'INVALID_TRACKING_MODE'
      });
    }

    const [assetCategory, trackingMode, duplicatedName, duplicatedPrefix] = await Promise.all([
      inventoryModel.getAssetCategoryById(assetCategoryId),
      inventoryModel.getTrackingModeById(defaultTrackingModeId),
      inventoryModel.findAssetTypeByName(name),
      inventoryModel.findAssetTypeByCodePrefix(codePrefix)
    ]);

    if (!assetCategory) {
      throw new AppError('La categoría indicada no existe.', {
        statusCode: 404,
        code: 'ASSET_CATEGORY_NOT_FOUND'
      });
    }

    if (!trackingMode) {
      throw new AppError('El modo de seguimiento indicado no existe.', {
        statusCode: 404,
        code: 'TRACKING_MODE_NOT_FOUND'
      });
    }

    if (duplicatedName) {
      throw new AppError('Ya existe un tipo de activo con ese nombre.', {
        statusCode: 409,
        code: 'ASSET_TYPE_NAME_ALREADY_EXISTS'
      });
    }

    if (duplicatedPrefix) {
      throw new AppError('Ya existe un tipo de activo con ese código corto.', {
        statusCode: 409,
        code: 'ASSET_TYPE_CODE_PREFIX_ALREADY_EXISTS'
      });
    }

    const typeKeyBase = slugifyTechnicalKey(name);
    const typeKey = typeKeyBase || `asset_type_${Date.now()}`;
    const duplicatedTypeKey = await inventoryModel.findAssetTypeByTypeKey(typeKey);
    if (duplicatedTypeKey) {
      throw new AppError('Ya existe un tipo técnico equivalente para ese nombre.', {
        statusCode: 409,
        code: 'ASSET_TYPE_KEY_ALREADY_EXISTS'
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);

      const assetTypeId = await txModel.createAssetType(connection, {
        assetCategoryId,
        typeKey,
        codePrefix,
        name,
        defaultTrackingModeId,
        description: normalizeText(payload?.description) || null
      });

      const createdAssetType = await txModel.getAssetTypeById(assetTypeId);
      await connection.commit();

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.create_asset_type',
        entityType: 'asset_types',
        entityId: assetTypeId,
        beforeSnapshot: null,
        afterSnapshot: createdAssetType,
        requestContext
      });

      return toCatalogAssetTypeResponse(createdAssetType);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateCatalogAssetType({ assetTypeId, payload, authUser = null, requestContext = {} }) {
    const normalizedAssetTypeId = normalizeId(assetTypeId);
    if (!normalizedAssetTypeId) {
      throw new AppError('El identificador del tipo de activo no es válido.', {
        statusCode: 400,
        code: 'INVALID_ASSET_TYPE_ID'
      });
    }

    const currentAssetType = await inventoryModel.getAssetTypeById(normalizedAssetTypeId);
    if (!currentAssetType) {
      throw new AppError('El tipo de activo indicado no existe.', {
        statusCode: 404,
        code: 'ASSET_TYPE_NOT_FOUND'
      });
    }

    const name = assertRequiredText(payload?.name ?? currentAssetType.name, 'el nombre del tipo de activo');
    const codePrefix = normalizeCodePrefix(payload?.code_prefix ?? currentAssetType.code_prefix);
    const assetCategoryId = normalizeId(payload?.asset_category_id) || Number(currentAssetType.asset_category_id);
    const defaultTrackingModeId = normalizeId(payload?.default_tracking_mode_id) || Number(currentAssetType.default_tracking_mode_id);

    const [assetCategory, trackingMode, duplicatedName, duplicatedPrefix] = await Promise.all([
      inventoryModel.getAssetCategoryById(assetCategoryId),
      inventoryModel.getTrackingModeById(defaultTrackingModeId),
      inventoryModel.findAssetTypeByName(name, { excludeId: normalizedAssetTypeId }),
      inventoryModel.findAssetTypeByCodePrefix(codePrefix, { excludeId: normalizedAssetTypeId })
    ]);

    if (!assetCategory) {
      throw new AppError('La categoría indicada no existe.', {
        statusCode: 404,
        code: 'ASSET_CATEGORY_NOT_FOUND'
      });
    }

    if (!trackingMode) {
      throw new AppError('El modo de seguimiento indicado no existe.', {
        statusCode: 404,
        code: 'TRACKING_MODE_NOT_FOUND'
      });
    }

    if (duplicatedName) {
      throw new AppError('Ya existe otro tipo de activo con ese nombre.', {
        statusCode: 409,
        code: 'ASSET_TYPE_NAME_ALREADY_EXISTS'
      });
    }

    if (duplicatedPrefix) {
      throw new AppError('Ya existe otro tipo de activo con ese código corto.', {
        statusCode: 409,
        code: 'ASSET_TYPE_CODE_PREFIX_ALREADY_EXISTS'
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);
      await txModel.updateAssetType(connection, {
        assetTypeId: normalizedAssetTypeId,
        assetCategoryId,
        codePrefix,
        name,
        defaultTrackingModeId,
        description: payload?.description !== undefined
          ? (normalizeText(payload?.description) || null)
          : (currentAssetType.description || null)
      });

      const updatedAssetType = await txModel.getAssetTypeById(normalizedAssetTypeId);
      await connection.commit();

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.update_asset_type',
        entityType: 'asset_types',
        entityId: normalizedAssetTypeId,
        beforeSnapshot: currentAssetType,
        afterSnapshot: updatedAssetType,
        requestContext
      });

      return toCatalogAssetTypeResponse(updatedAssetType);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async deactivateCatalogAssetType({ assetTypeId, authUser = null, requestContext = {} }) {
    const normalizedAssetTypeId = normalizeId(assetTypeId);
    const currentAssetType = await inventoryModel.getAssetTypeById(normalizedAssetTypeId);

    if (!normalizedAssetTypeId || !currentAssetType) {
      throw new AppError('El tipo de activo indicado no existe.', {
        statusCode: 404,
        code: 'ASSET_TYPE_NOT_FOUND'
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);
      await txModel.deactivateAssetType(connection, normalizedAssetTypeId);
      const updatedAssetType = await txModel.getAssetTypeById(normalizedAssetTypeId);
      await connection.commit();

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.deactivate_asset_type',
        entityType: 'asset_types',
        entityId: normalizedAssetTypeId,
        beforeSnapshot: currentAssetType,
        afterSnapshot: updatedAssetType,
        requestContext
      });

      return toCatalogAssetTypeResponse(updatedAssetType);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async reactivateCatalogAssetType({ assetTypeId, authUser = null, requestContext = {} }) {
    const normalizedAssetTypeId = normalizeId(assetTypeId);
    const currentAssetType = await inventoryModel.getAssetTypeById(normalizedAssetTypeId);

    if (!normalizedAssetTypeId || !currentAssetType) {
      throw new AppError('El tipo de activo indicado no existe.', {
        statusCode: 404,
        code: 'ASSET_TYPE_NOT_FOUND'
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);
      await txModel.reactivateAssetType(connection, normalizedAssetTypeId);
      const updatedAssetType = await txModel.getAssetTypeById(normalizedAssetTypeId);
      await connection.commit();

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.reactivate_asset_type',
        entityType: 'asset_types',
        entityId: normalizedAssetTypeId,
        beforeSnapshot: currentAssetType,
        afterSnapshot: updatedAssetType,
        requestContext
      });

      return toCatalogAssetTypeResponse(updatedAssetType);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async listCatalogLocationTypes({ query = {} } = {}) {
    const rows = await inventoryModel.listLocationTypes({
      includeInactive: String(query.include_inactive || '') === '1'
    });

    return rows.map(toCatalogLocationTypeResponse);
  },

  async createCatalogLocationType({ payload, authUser = null, requestContext = {} }) {
    const name = assertRequiredText(payload?.name, 'el nombre del tipo de ubicación');
    const codePrefix = normalizeCodePrefix(payload?.code_prefix);
    const typeKeyBase = slugifyTechnicalKey(name);
    const typeKey = typeKeyBase || `location_type_${Date.now()}`;

    const [duplicatedName, duplicatedPrefix, duplicatedTypeKey] = await Promise.all([
      inventoryModel.findLocationTypeByName(name),
      inventoryModel.findLocationTypeByCodePrefix(codePrefix),
      inventoryModel.findLocationTypeByTypeKey(typeKey)
    ]);

    if (duplicatedName) {
      throw new AppError('Ya existe un tipo de ubicación con ese nombre.', {
        statusCode: 409,
        code: 'LOCATION_TYPE_NAME_ALREADY_EXISTS'
      });
    }

    if (duplicatedPrefix) {
      throw new AppError('Ya existe un tipo de ubicación con ese código corto.', {
        statusCode: 409,
        code: 'LOCATION_TYPE_CODE_PREFIX_ALREADY_EXISTS'
      });
    }

    if (duplicatedTypeKey) {
      throw new AppError('Ya existe un tipo técnico equivalente para ese nombre.', {
        statusCode: 409,
        code: 'LOCATION_TYPE_KEY_ALREADY_EXISTS'
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);

      const locationTypeId = await txModel.createLocationType(connection, {
        typeKey,
        codePrefix,
        name,
        description: normalizeText(payload?.description) || null
      });

      const createdLocationType = await txModel.getLocationTypeById(locationTypeId);
      await connection.commit();

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.create_location_type',
        entityType: 'location_types',
        entityId: locationTypeId,
        beforeSnapshot: null,
        afterSnapshot: createdLocationType,
        requestContext
      });

      return toCatalogLocationTypeResponse(createdLocationType);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateCatalogLocationType({ locationTypeId, payload, authUser = null, requestContext = {} }) {
    const normalizedLocationTypeId = normalizeId(locationTypeId);
    const currentLocationType = await inventoryModel.getLocationTypeById(normalizedLocationTypeId);

    if (!normalizedLocationTypeId || !currentLocationType) {
      throw new AppError('El tipo de ubicación indicado no existe.', {
        statusCode: 404,
        code: 'LOCATION_TYPE_NOT_FOUND'
      });
    }

    const name = assertRequiredText(payload?.name ?? currentLocationType.name, 'el nombre del tipo de ubicación');
    const codePrefix = normalizeCodePrefix(payload?.code_prefix ?? currentLocationType.code_prefix);

    const [duplicatedName, duplicatedPrefix] = await Promise.all([
      inventoryModel.findLocationTypeByName(name, { excludeId: normalizedLocationTypeId }),
      inventoryModel.findLocationTypeByCodePrefix(codePrefix, { excludeId: normalizedLocationTypeId })
    ]);

    if (duplicatedName) {
      throw new AppError('Ya existe otro tipo de ubicación con ese nombre.', {
        statusCode: 409,
        code: 'LOCATION_TYPE_NAME_ALREADY_EXISTS'
      });
    }

    if (duplicatedPrefix) {
      throw new AppError('Ya existe otro tipo de ubicación con ese código corto.', {
        statusCode: 409,
        code: 'LOCATION_TYPE_CODE_PREFIX_ALREADY_EXISTS'
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);
      await txModel.updateLocationType(connection, {
        locationTypeId: normalizedLocationTypeId,
        codePrefix,
        name,
        description: payload?.description !== undefined
          ? (normalizeText(payload?.description) || null)
          : (currentLocationType.description || null)
      });

      const updatedLocationType = await txModel.getLocationTypeById(normalizedLocationTypeId);
      await connection.commit();

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.update_location_type',
        entityType: 'location_types',
        entityId: normalizedLocationTypeId,
        beforeSnapshot: currentLocationType,
        afterSnapshot: updatedLocationType,
        requestContext
      });

      return toCatalogLocationTypeResponse(updatedLocationType);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async deactivateCatalogLocationType({ locationTypeId, authUser = null, requestContext = {} }) {
    const normalizedLocationTypeId = normalizeId(locationTypeId);
    const currentLocationType = await inventoryModel.getLocationTypeById(normalizedLocationTypeId);

    if (!normalizedLocationTypeId || !currentLocationType) {
      throw new AppError('El tipo de ubicación indicado no existe.', {
        statusCode: 404,
        code: 'LOCATION_TYPE_NOT_FOUND'
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);
      await txModel.deactivateLocationType(connection, normalizedLocationTypeId);
      const updatedLocationType = await txModel.getLocationTypeById(normalizedLocationTypeId);
      await connection.commit();

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.deactivate_location_type',
        entityType: 'location_types',
        entityId: normalizedLocationTypeId,
        beforeSnapshot: currentLocationType,
        afterSnapshot: updatedLocationType,
        requestContext
      });

      return toCatalogLocationTypeResponse(updatedLocationType);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async reactivateCatalogLocationType({ locationTypeId, authUser = null, requestContext = {} }) {
    const normalizedLocationTypeId = normalizeId(locationTypeId);
    const currentLocationType = await inventoryModel.getLocationTypeById(normalizedLocationTypeId);

    if (!normalizedLocationTypeId || !currentLocationType) {
      throw new AppError('El tipo de ubicación indicado no existe.', {
        statusCode: 404,
        code: 'LOCATION_TYPE_NOT_FOUND'
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);
      await txModel.reactivateLocationType(connection, normalizedLocationTypeId);
      const updatedLocationType = await txModel.getLocationTypeById(normalizedLocationTypeId);
      await connection.commit();

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.reactivate_location_type',
        entityType: 'location_types',
        entityId: normalizedLocationTypeId,
        beforeSnapshot: currentLocationType,
        afterSnapshot: updatedLocationType,
        requestContext
      });

      return toCatalogLocationTypeResponse(updatedLocationType);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async listAssets({ query = {} } = {}) {
    const rows = await inventoryModel.listAssets({
      trackingModeKey: query.tracking_mode_key,
      search: query.search
    });

    const operationalStatusKey = normalizeText(query.operational_status || query.status).toLowerCase();
    const resolvedAssets = rows.map(toAssetResponse);

    if (!operationalStatusKey) {
      return resolvedAssets;
    }

    return resolvedAssets.filter((asset) => asset.operational_status_key === operationalStatusKey);
  },

  async listLocations({ query = {} } = {}) {
    const rows = await inventoryModel.listLocations({
      status: query.status
    });

    return rows.map(toLocationResponse);
  },

  async listMovements({ query = {} } = {}) {
    const rows = await inventoryModel.listInventoryMovements({
      limit: query.limit
    });

    return rows.map(toInventoryMovementResponse);
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
    if (!assetType || assetType.deleted_at) {
      throw new AppError('El tipo de activo indicado no existe.', {
        statusCode: 404,
        code: 'ASSET_TYPE_NOT_FOUND'
      });
    }

    if (!assetType.default_tracking_mode_key) {
      throw new AppError('El tipo de activo no tiene modo de seguimiento configurado.', {
        statusCode: 400,
        code: 'INVALID_TRACKING_MODE'
      });
    }

    const trackingMode = await inventoryModel.getTrackingModeByKey(assetType.default_tracking_mode_key);
    if (!trackingMode) {
      throw new AppError('El modo de seguimiento indicado no existe.', {
        statusCode: 404,
        code: 'TRACKING_MODE_NOT_FOUND'
      });
    }

    const assetName = assertRequiredText(payload?.asset_name, 'el nombre del activo');
    const minQuantity = trackingMode.mode_key === 'stock'
      ? (normalizeDecimal(payload?.min_quantity, { allowZero: true }) ?? 0)
      : 0;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);
      const internalCode = await generateNextAssetCode({
        model: txModel,
        assetTypeId,
        codePrefix: assetType.code_prefix
      });

      const assetId = await txModel.createAsset(connection, {
        assetTypeId,
        trackingModeId: Number(trackingMode.id),
        assetName,
        internalCode,
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
        reason: normalizeText(payload?.reason) || 'Alta inicial de activo maestro.',
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

  async updateAsset({ assetId, payload, authUser = null, requestContext = {} }) {
    const normalizedAssetId = normalizeId(assetId);
    if (!normalizedAssetId) {
      throw new AppError('El identificador del activo no es válido.', {
        statusCode: 400,
        code: 'INVALID_ASSET_ID'
      });
    }

    const currentAsset = await inventoryModel.getAssetById(normalizedAssetId);
    if (!currentAsset) {
      throw new AppError('El activo solicitado no existe.', {
        statusCode: 404,
        code: 'ASSET_NOT_FOUND'
      });
    }

    const assetName = assertRequiredText(
      payload?.asset_name !== undefined ? payload?.asset_name : currentAsset.asset_name,
      'el nombre del activo'
    );

    const minQuantity = currentAsset.tracking_mode_key === 'stock'
      ? (normalizeDecimal(
        payload?.min_quantity !== undefined ? payload?.min_quantity : currentAsset.min_quantity,
        { allowZero: true }
      ) ?? 0)
      : 0;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);

      const updated = await txModel.updateAsset(connection, {
        assetId: normalizedAssetId,
        assetName,
        brand: payload?.brand !== undefined ? (normalizeText(payload?.brand) || null) : (currentAsset.brand || null),
        model: payload?.model !== undefined ? (normalizeText(payload?.model) || null) : (currentAsset.model || null),
        minQuantity,
        description: payload?.description !== undefined ? (normalizeText(payload?.description) || null) : (currentAsset.description || null)
      });

      if (!updated) {
        throw new AppError('No fue posible actualizar el activo.', {
          statusCode: 409,
          code: 'ASSET_NOT_UPDATED'
        });
      }

      const updatedAsset = await txModel.getAssetById(normalizedAssetId);

      await txModel.createAssetEvent(connection, {
        assetId: normalizedAssetId,
        operatorId: authUser?.id || null,
        actionKey: 'asset_updated',
        entityType: 'assets',
        entityId: normalizedAssetId,
        reason: normalizeText(payload?.reason) || 'Actualización de activo.',
        beforeSnapshot: currentAsset,
        afterSnapshot: updatedAsset
      });

      await connection.commit();

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.update_asset',
        entityType: 'assets',
        entityId: normalizedAssetId,
        beforeSnapshot: currentAsset,
        afterSnapshot: updatedAsset,
        requestContext
      });

      return toAssetResponse(updatedAsset);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async createLocation({ payload, authUser = null, requestContext = {} }) {
    const locationTypeId = normalizeId(payload?.location_type_id);
    if (!locationTypeId) {
      throw new AppError('Debes indicar un tipo de ubicación válido.', {
        statusCode: 400,
        code: 'INVALID_LOCATION_TYPE'
      });
    }

    const locationType = await inventoryModel.getLocationTypeById(locationTypeId);
    if (!locationType || locationType.deleted_at) {
      throw new AppError('El tipo de ubicación indicado no existe.', {
        statusCode: 404,
        code: 'LOCATION_TYPE_NOT_FOUND'
      });
    }

    const parentLocationId = normalizeId(payload?.parent_location_id);
    if (parentLocationId) {
      const parentLocation = await inventoryModel.getLocationById(parentLocationId);
      if (!parentLocation) {
        throw new AppError('La ubicación padre no existe.', {
          statusCode: 404,
          code: 'PARENT_LOCATION_NOT_FOUND'
        });
      }
    }

    const locationName = assertRequiredText(payload?.name, 'el nombre de la ubicación');
    const locationKey = normalizeLocationKey(payload?.location_key);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);
      const locationCode = await generateLocationCode({
        model: txModel,
        locationType,
        locationKey
      });

      const locationId = await txModel.createLocation(connection, {
        locationTypeId,
        name: locationName,
        code: locationCode,
        parentLocationId,
        description: normalizeText(payload?.description) || null,
        status: 'active'
      });

      const createdLocation = await txModel.getLocationById(locationId);
      await connection.commit();

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.create_location',
        entityType: 'locations',
        entityId: locationId,
        beforeSnapshot: null,
        afterSnapshot: createdLocation,
        requestContext
      });

      return createdLocation;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateLocation({ locationId, payload, authUser = null, requestContext = {} }) {
    const normalizedLocationId = normalizeId(locationId);
    if (!normalizedLocationId) {
      throw new AppError('El identificador de ubicación no es válido.', {
        statusCode: 400,
        code: 'INVALID_LOCATION_ID'
      });
    }

    const currentLocation = await inventoryModel.getLocationById(normalizedLocationId);
    if (!currentLocation) {
      throw new AppError('La ubicación indicada no existe.', {
        statusCode: 404,
        code: 'LOCATION_NOT_FOUND'
      });
    }

    const locationTypeId = normalizeId(payload?.location_type_id) || Number(currentLocation.location_type_id);
    const locationType = await inventoryModel.getLocationTypeById(locationTypeId);
    if (!locationType || locationType.deleted_at) {
      throw new AppError('El tipo de ubicación indicado no existe.', {
        statusCode: 404,
        code: 'LOCATION_TYPE_NOT_FOUND'
      });
    }

    const parentLocationId = normalizeId(payload?.parent_location_id);
    const resolvedParentLocationId = parentLocationId === normalizedLocationId
      ? null
      : parentLocationId;

    if (resolvedParentLocationId) {
      const parentLocation = await inventoryModel.getLocationById(resolvedParentLocationId);
      if (!parentLocation) {
        throw new AppError('La ubicación padre no existe.', {
          statusCode: 404,
          code: 'PARENT_LOCATION_NOT_FOUND'
        });
      }
    }

    const nextLocationName = assertRequiredText(
      payload?.name !== undefined ? payload?.name : currentLocation.name,
      'el nombre de la ubicación'
    );
    const fallbackLocationKey = currentLocation.code
      ? currentLocation.code.split('-').slice(2).join('-')
      : currentLocation.name;
    const locationKey = payload?.location_key !== undefined
      ? normalizeLocationKey(payload?.location_key)
      : normalizeLocationKey(fallbackLocationKey);

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);
      const locationCode = await generateLocationCode({
        model: txModel,
        locationType,
        locationKey,
        excludeLocationId: normalizedLocationId
      });

      const updated = await txModel.updateLocation(connection, {
        locationId: normalizedLocationId,
        locationTypeId,
        name: nextLocationName,
        code: locationCode,
        parentLocationId: resolvedParentLocationId,
        description: payload?.description !== undefined
          ? (normalizeText(payload?.description) || null)
          : (currentLocation.description || null),
        status: normalizeStatus(payload?.status, currentLocation.status)
      });

      if (!updated) {
        throw new AppError('No fue posible actualizar la ubicación.', {
          statusCode: 409,
          code: 'LOCATION_NOT_UPDATED'
        });
      }

      const updatedLocation = await txModel.getLocationById(normalizedLocationId);
      await connection.commit();

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.update_location',
        entityType: 'locations',
        entityId: normalizedLocationId,
        beforeSnapshot: currentLocation,
        afterSnapshot: updatedLocation,
        requestContext
      });

      return updatedLocation;
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
        referenceType: null,
        referenceId: null,
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
  },

  async listAssetUnits(assetId) {
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

    const rows = await inventoryModel.listAssetUnits(normalizedAssetId);
    return rows.map(toAssetUnitResponse);
  },

  async listAvailableAssetUnits({ query = {} } = {}) {
    const statusKey = normalizeText(query.status_key || query.status || 'available').toLowerCase() || 'available';
    const assetId = normalizeId(query.asset_id);
    const rows = await inventoryModel.listAssetUnitsByStatus({
      statusKey,
      assetId,
      search: normalizeText(query.search)
    });

    return rows.map(toAssetUnitResponse);
  },

  async createAssetUnits({ assetId, payload, authUser = null, requestContext = {} }) {
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

    if (asset.tracking_mode_key !== 'unit') {
      throw new AppError('Solo los activos unitarios pueden registrar unidades serializadas.', {
        statusCode: 409,
        code: 'ASSET_NOT_SERIALIZED'
      });
    }

    if (!Array.isArray(payload?.units) || payload.units.length === 0) {
      throw new AppError('Debes indicar al menos una unidad para registrar.', {
        statusCode: 400,
        code: 'INVALID_ASSET_UNITS_PAYLOAD'
      });
    }

    const assetType = await inventoryModel.getAssetTypeById(asset.asset_type_id);
    const normalizedUnits = [];

    for (let index = 0; index < payload.units.length; index += 1) {
      const unit = payload.units[index];
      const locationId = normalizeId(unit?.location_id);
      const statusKey = normalizeText(unit?.status_key || 'available').toLowerCase();
      const lineNumber = index + 1;

      if (!locationId) {
        throw new AppError(`La unidad ${lineNumber} debe indicar una ubicación inicial válida.`, {
          statusCode: 400,
          code: 'INVALID_ASSET_UNIT_LOCATION'
        });
      }

      const [location, unitStatus] = await Promise.all([
        inventoryModel.getLocationById(locationId),
        inventoryModel.getAssetUnitStatusByKey(statusKey)
      ]);

      if (!location) {
        throw new AppError(`La ubicación inicial de la unidad ${lineNumber} no existe.`, {
          statusCode: 404,
          code: 'LOCATION_NOT_FOUND'
        });
      }

      if (!unitStatus) {
        throw new AppError(`El estado inicial de la unidad ${lineNumber} no existe.`, {
          statusCode: 404,
          code: 'ASSET_UNIT_STATUS_NOT_FOUND'
        });
      }

      normalizedUnits.push({
        serial_number: normalizeText(unit?.serial_number) || null,
        location_id: locationId,
        status_key: unitStatus.status_key,
        asset_unit_status_id: Number(unitStatus.id),
        notes: normalizeText(unit?.notes) || null
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);
      const createdUnitIds = [];

      for (const unit of normalizedUnits) {
        const assetTag = await generateNextAssetTag({
          model: txModel,
          asset,
          assetType
        });

        const assetUnitId = await txModel.createAssetUnit(connection, {
          assetId: normalizedAssetId,
          assetTag,
          serialNumber: unit.serial_number,
          assetUnitStatusId: unit.asset_unit_status_id,
          currentLocationId: unit.location_id,
          notes: unit.notes
        });

        createdUnitIds.push(assetUnitId);

        await txModel.createAssetEvent(connection, {
          assetId: normalizedAssetId,
          assetUnitId,
          operatorId: authUser?.id || null,
          actionKey: 'asset_unit_created',
          entityType: 'asset_units',
          entityId: assetUnitId,
          reason: 'Alta de unidad serializada.',
          beforeSnapshot: null,
          afterSnapshot: {
            asset_tag: assetTag,
            current_location_id: unit.location_id,
            status_key: unit.status_key
          }
        });
      }

      await connection.commit();

      const rows = await inventoryModel.listAssetUnits(normalizedAssetId);
      const createdUnits = rows.filter((unit) => createdUnitIds.includes(Number(unit.id)));

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.create_asset_units',
        entityType: 'asset_units',
        entityId: createdUnitIds[0] || null,
        beforeSnapshot: null,
        afterSnapshot: createdUnits,
        requestContext
      });

      return createdUnits.map(toAssetUnitResponse);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async listAssignments({ query = {} } = {}) {
    const assetUnitId = normalizeId(query.asset_unit_id);
    const assetId = normalizeId(query.asset_id);
    const collaboratorId = normalizeId(query.collaborator_id);

    const assignments = await inventoryModel.listAssetAssignments({
      assetUnitId,
      assetId,
      collaboratorId,
      status: query.status,
      search: query.search
    });

    return assignments.map(buildAssignmentResponse);
  },

  async createAssignment({ payload, authUser = null, requestContext = {} }) {
    const assetUnitId = normalizeId(payload?.asset_unit_id);
    const collaboratorId = normalizeId(payload?.collaborator_id);
    const locationId = normalizeId(payload?.location_id);

    if (!assetUnitId || !collaboratorId || !locationId) {
      throw new AppError('Debes indicar unidad, colaborador y ubicación de entrega.', {
        statusCode: 400,
        code: 'INVALID_ASSIGNMENT_PAYLOAD'
      });
    }

    const [unit, collaborator, location, activeAssignment, assignedStatus, movementType] = await Promise.all([
      inventoryModel.getAssetUnitById(assetUnitId),
      collaboratorModel.findById(collaboratorId),
      inventoryModel.getLocationById(locationId),
      inventoryModel.getActiveAssetAssignmentByUnitId(assetUnitId),
      inventoryModel.getAssetUnitStatusByKey('assigned'),
      inventoryModel.getMovementTypeByKey('assignment_out')
    ]);

    if (!unit) {
      throw new AppError('La unidad serializada indicada no existe.', {
        statusCode: 404,
        code: 'ASSET_UNIT_NOT_FOUND'
      });
    }

    if (!collaborator) {
      throw new AppError('El colaborador indicado no existe.', {
        statusCode: 404,
        code: 'COLLABORATOR_NOT_FOUND'
      });
    }

    if (!location) {
      throw new AppError('La ubicación de entrega no existe.', {
        statusCode: 404,
        code: 'LOCATION_NOT_FOUND'
      });
    }

    if (activeAssignment) {
      throw new AppError('La unidad ya cuenta con un resguardo activo.', {
        statusCode: 409,
        code: 'ASSET_UNIT_ALREADY_ASSIGNED'
      });
    }

    if (!assignedStatus || !movementType) {
      throw new AppError('El catálogo base de asignaciones no está configurado correctamente.', {
        statusCode: 500,
        code: 'INVENTORY_BASE_CATALOG_MISSING'
      });
    }

    const asset = await inventoryModel.getAssetById(unit.asset_id);
    const connection = await pool.getConnection();
    const assignedAt = normalizeDateTime(payload?.assigned_at);

    if (payload?.assigned_at && !assignedAt) {
      throw new AppError('La fecha de asignación no tiene un formato válido.', {
        statusCode: 400,
        code: 'INVALID_ASSIGNMENT_DATE'
      });
    }

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);

      const assignmentId = await txModel.createAssetAssignment(connection, {
        assetUnitId,
        collaboratorId,
        assignedByUserId: authUser?.id || null,
        receivedByUserId: null,
        assignedAt,
        expectedReturnAt: normalizeDateTime(payload?.expected_return_at),
        deliveryCondition: normalizeText(payload?.delivery_condition) || null,
        notes: normalizeText(payload?.notes) || null,
        status: 'active'
      });

      const movementId = await txModel.createInventoryMovement(connection, {
        movementTypeId: Number(movementType.id),
        operatorId: authUser?.id || null,
        reason: normalizeText(payload?.notes) || 'Salida por asignación.',
        referenceType: 'assignment',
        referenceId: assignmentId,
        happenedAt: assignedAt
      });

      await txModel.createInventoryMovementLine(connection, {
        inventoryMovementId: movementId,
        assetId: Number(unit.asset_id),
        assetUnitId,
        quantity: 1,
        fromLocationId: unit.current_location_id,
        toLocationId: locationId,
        notes: normalizeText(payload?.notes) || null
      });

      await txModel.updateAssetUnit(connection, {
        assetUnitId,
        assetUnitStatusId: Number(assignedStatus.id),
        currentLocationId: locationId
      });

      await txModel.createAssetEvent(connection, {
        assetId: Number(unit.asset_id),
        assetUnitId,
        operatorId: authUser?.id || null,
        actionKey: 'asset_assignment_created',
        entityType: 'asset_assignments',
        entityId: assignmentId,
        reason: normalizeText(payload?.notes) || 'Resguardo generado.',
        beforeSnapshot: null,
        afterSnapshot: {
          collaborator_id: collaboratorId,
          location_id: locationId,
          status: 'active'
        }
      });

      await connection.commit();

      const createdAssignment = await inventoryModel.getAssetAssignmentById(assignmentId);

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.create_assignment',
        entityType: 'asset_assignments',
        entityId: assignmentId,
        beforeSnapshot: null,
        afterSnapshot: createdAssignment,
        requestContext
      });

      return {
        assignment: toAssignmentResponse(createdAssignment),
        asset: toAssetResponse(asset),
        collaborator
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async closeAssignment({ assignmentId, payload, authUser = null, requestContext = {} }) {
    const normalizedAssignmentId = normalizeId(assignmentId);
    if (!normalizedAssignmentId) {
      throw new AppError('El identificador del resguardo no es válido.', {
        statusCode: 400,
        code: 'INVALID_ASSIGNMENT_ID'
      });
    }

    const currentAssignment = await inventoryModel.getAssetAssignmentById(normalizedAssignmentId);
    if (!currentAssignment || currentAssignment.status !== 'active') {
      throw new AppError('El resguardo indicado no existe o ya está cerrado.', {
        statusCode: 404,
        code: 'ASSIGNMENT_NOT_FOUND'
      });
    }

    const assetUnitId = Number(currentAssignment.asset_unit_id);
    const returnLocationId = normalizeId(payload?.location_id);
    if (!returnLocationId) {
      throw new AppError('Debes indicar la ubicación de retorno.', {
        statusCode: 400,
        code: 'INVALID_RETURN_LOCATION'
      });
    }

    const [unit, location, availableStatus, movementType] = await Promise.all([
      inventoryModel.getAssetUnitById(assetUnitId),
      inventoryModel.getLocationById(returnLocationId),
      inventoryModel.getAssetUnitStatusByKey('available'),
      inventoryModel.getMovementTypeByKey('return_in')
    ]);

    if (!unit) {
      throw new AppError('La unidad del resguardo ya no existe.', {
        statusCode: 404,
        code: 'ASSET_UNIT_NOT_FOUND'
      });
    }

    if (!location) {
      throw new AppError('La ubicación de retorno no existe.', {
        statusCode: 404,
        code: 'LOCATION_NOT_FOUND'
      });
    }

    if (!availableStatus || !movementType) {
      throw new AppError('El catálogo base de devoluciones no está configurado correctamente.', {
        statusCode: 500,
        code: 'INVENTORY_BASE_CATALOG_MISSING'
      });
    }

    const returnedAt = normalizeDateTime(payload?.returned_at);
    if (payload?.returned_at && !returnedAt) {
      throw new AppError('La fecha de devolución no tiene un formato válido.', {
        statusCode: 400,
        code: 'INVALID_RETURN_DATE'
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);

      await txModel.closeAssetAssignment(connection, {
        assignmentId: normalizedAssignmentId,
        returnedAt,
        returnCondition: normalizeText(payload?.return_condition) || null,
        notes: normalizeText(payload?.notes) || currentAssignment.notes || null
      });

      const movementId = await txModel.createInventoryMovement(connection, {
        movementTypeId: Number(movementType.id),
        operatorId: authUser?.id || null,
        reason: normalizeText(payload?.notes) || 'Entrada por devolución.',
        referenceType: 'assignment',
        referenceId: normalizedAssignmentId,
        happenedAt: returnedAt
      });

      await txModel.createInventoryMovementLine(connection, {
        inventoryMovementId: movementId,
        assetId: Number(unit.asset_id),
        assetUnitId,
        quantity: 1,
        fromLocationId: unit.current_location_id,
        toLocationId: returnLocationId,
        notes: normalizeText(payload?.notes) || null
      });

      await txModel.updateAssetUnit(connection, {
        assetUnitId,
        assetUnitStatusId: Number(availableStatus.id),
        currentLocationId: returnLocationId
      });

      await txModel.createAssetEvent(connection, {
        assetId: Number(unit.asset_id),
        assetUnitId,
        operatorId: authUser?.id || null,
        actionKey: 'asset_assignment_closed',
        entityType: 'asset_assignments',
        entityId: normalizedAssignmentId,
        reason: normalizeText(payload?.notes) || 'Resguardo cerrado.',
        beforeSnapshot: currentAssignment,
        afterSnapshot: {
          returned_at: returnedAt,
          return_location_id: returnLocationId,
          status: 'closed'
        }
      });

      await connection.commit();

      const closedAssignment = await inventoryModel.getAssetAssignmentById(normalizedAssignmentId);

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.close_assignment',
        entityType: 'asset_assignments',
        entityId: normalizedAssignmentId,
        beforeSnapshot: currentAssignment,
        afterSnapshot: closedAssignment,
        requestContext
      });

      return toAssignmentResponse(closedAssignment);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateAssetUnitStatus({ assetUnitId, payload, authUser = null, requestContext = {} }) {
    const normalizedAssetUnitId = normalizeId(assetUnitId);
    if (!normalizedAssetUnitId) {
      throw new AppError('El identificador de la unidad no es válido.', {
        statusCode: 400,
        code: 'INVALID_ASSET_UNIT_ID'
      });
    }

    const targetStatusKey = normalizeText(payload?.status_key).toLowerCase();
    if (!['available', 'in_repair', 'retired'].includes(targetStatusKey)) {
      throw new AppError('Debes indicar un estado operativo válido para la unidad.', {
        statusCode: 400,
        code: 'INVALID_ASSET_UNIT_STATUS'
      });
    }

    const reason = assertRequiredText(payload?.reason, 'el motivo del cambio de estado');
    const locationId = normalizeId(payload?.location_id);
    const unit = await inventoryModel.getAssetUnitById(normalizedAssetUnitId);

    if (!unit) {
      throw new AppError('La unidad serializada indicada no existe.', {
        statusCode: 404,
        code: 'ASSET_UNIT_NOT_FOUND'
      });
    }

    if (unit.status_key === targetStatusKey) {
      throw new AppError('La unidad ya se encuentra en ese estado.', {
        statusCode: 409,
        code: 'ASSET_UNIT_STATUS_UNCHANGED'
      });
    }

    if (!['available', 'in_repair', 'assigned'].includes(unit.status_key)) {
      throw new AppError('La unidad ya se encuentra fuera del ciclo operativo editable.', {
        statusCode: 409,
        code: 'ASSET_UNIT_STATUS_LOCKED'
      });
    }

    if (unit.status_key === 'assigned') {
      const activeAssignment = await inventoryModel.getActiveAssetAssignmentByUnitId(normalizedAssetUnitId);
      if (activeAssignment) {
        throw new AppError('Primero debes cerrar el resguardo activo antes de cambiar el estado de la unidad.', {
          statusCode: 409,
          code: 'ASSET_UNIT_ACTIVE_ASSIGNMENT'
        });
      }
    }

    if (unit.status_key === 'retired') {
      throw new AppError('Las unidades en baja ya no se pueden cambiar desde este flujo.', {
        statusCode: 409,
        code: 'ASSET_UNIT_RETIRED'
      });
    }

    if (targetStatusKey === 'available' && !locationId) {
      throw new AppError('Debes indicar una ubicación válida para dejar disponible la unidad.', {
        statusCode: 400,
        code: 'INVALID_ASSET_UNIT_LOCATION'
      });
    }

    if (locationId) {
      const location = await inventoryModel.getLocationById(locationId);
      if (!location) {
        throw new AppError('La ubicación indicada no existe.', {
          statusCode: 404,
          code: 'LOCATION_NOT_FOUND'
        });
      }
    }

    const targetStatus = await inventoryModel.getAssetUnitStatusByKey(targetStatusKey);
    if (!targetStatus) {
      throw new AppError('El estado de unidad solicitado no existe.', {
        statusCode: 404,
        code: 'ASSET_UNIT_STATUS_NOT_FOUND'
      });
    }

    const movementTypeKey = targetStatusKey === 'available'
      ? 'repair_in'
      : targetStatusKey === 'in_repair'
        ? 'repair_out'
        : 'retire_out';

    const movementType = await inventoryModel.getMovementTypeByKey(movementTypeKey);
    if (!movementType) {
      throw new AppError('El catálogo base de cambios operativos no está configurado correctamente.', {
        statusCode: 500,
        code: 'INVENTORY_BASE_CATALOG_MISSING'
      });
    }

    const happenedAt = normalizeDateTime(payload?.happened_at);
    if (payload?.happened_at && !happenedAt) {
      throw new AppError('La fecha del cambio de estado no tiene un formato válido.', {
        statusCode: 400,
        code: 'INVALID_ASSET_UNIT_STATUS_DATE'
      });
    }

    const currentLocationId = unit.current_location_id ? Number(unit.current_location_id) : null;
    const nextLocationId = targetStatusKey === 'available'
      ? locationId
      : (locationId || null);

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txModel = new InventoryModel(connection);

      const movementId = await txModel.createInventoryMovement(connection, {
        movementTypeId: Number(movementType.id),
        operatorId: authUser?.id || null,
        reason,
        referenceType: 'asset_unit',
        referenceId: normalizedAssetUnitId,
        happenedAt
      });

      await txModel.createInventoryMovementLine(connection, {
        inventoryMovementId: movementId,
        assetId: Number(unit.asset_id),
        assetUnitId: normalizedAssetUnitId,
        quantity: 1,
        fromLocationId: currentLocationId,
        toLocationId: nextLocationId,
        notes: normalizeText(payload?.notes) || null
      });

      await txModel.updateAssetUnit(connection, {
        assetUnitId: normalizedAssetUnitId,
        assetUnitStatusId: Number(targetStatus.id),
        currentLocationId: nextLocationId,
        notes: payload?.notes !== undefined ? (normalizeText(payload?.notes) || null) : undefined
      });

      await txModel.createAssetEvent(connection, {
        assetId: Number(unit.asset_id),
        assetUnitId: normalizedAssetUnitId,
        operatorId: authUser?.id || null,
        actionKey: 'asset_unit_status_updated',
        entityType: 'asset_units',
        entityId: normalizedAssetUnitId,
        reason,
        beforeSnapshot: unit,
        afterSnapshot: {
          status_key: targetStatusKey,
          current_location_id: nextLocationId,
          movement_type_key: movementTypeKey
        }
      });

      await connection.commit();

      const updatedUnit = await inventoryModel.getAssetUnitById(normalizedAssetUnitId);

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'inventory.update_asset_unit_status',
        entityType: 'asset_units',
        entityId: normalizedAssetUnitId,
        beforeSnapshot: unit,
        afterSnapshot: updatedUnit,
        requestContext
      });

      const resolvedUnit = (await inventoryModel.listAssetUnits(Number(unit.asset_id)))
        .find((assetUnit) => Number(assetUnit.id) === normalizedAssetUnitId);

      return resolvedUnit ? toAssetUnitResponse(resolvedUnit) : toAssetUnitResponse({
        ...updatedUnit,
        status_name: targetStatus.name,
        current_location_name: null
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async getAssetUnitLabel(assetUnitId) {
    const normalizedAssetUnitId = normalizeId(assetUnitId);
    if (!normalizedAssetUnitId) {
      throw new AppError('El identificador de la unidad no es válido.', {
        statusCode: 400,
        code: 'INVALID_ASSET_UNIT_ID'
      });
    }

    const unit = await inventoryModel.getAssetUnitById(normalizedAssetUnitId);
    if (!unit) {
      throw new AppError('La unidad serializada no existe.', {
        statusCode: 404,
        code: 'ASSET_UNIT_NOT_FOUND'
      });
    }

    const asset = await inventoryModel.getAssetById(unit.asset_id);
    const fullUnit = (await inventoryModel.listAssetUnits(unit.asset_id))
      .find((row) => Number(row.id) === normalizedAssetUnitId);

    return {
      kind: 'asset_unit',
      code: unit.asset_tag,
      title: asset?.asset_name || 'Unidad serializada',
      subtitle: fullUnit?.serial_number || null,
      qr_value: unit.asset_tag
    };
  },

  async getLocationLabel(locationId) {
    const normalizedLocationId = normalizeId(locationId);
    if (!normalizedLocationId) {
      throw new AppError('El identificador de la ubicación no es válido.', {
        statusCode: 400,
        code: 'INVALID_LOCATION_ID'
      });
    }

    const location = await inventoryModel.getLocationById(normalizedLocationId);
    if (!location) {
      throw new AppError('La ubicación indicada no existe.', {
        statusCode: 404,
        code: 'LOCATION_NOT_FOUND'
      });
    }

    return {
      kind: 'location',
      code: location.code,
      title: location.name,
      subtitle: location.status,
      qr_value: location.code
    };
  }
};
