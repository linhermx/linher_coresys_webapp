import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { AccessModel } from '../models/AccessModel.js';
import { CollaboratorModel } from '../models/CollaboratorModel.js';
import { InventoryModel } from '../models/InventoryModel.js';
import { AuditService } from './auditService.js';

const accessModel = new AccessModel(pool);
const collaboratorModel = new CollaboratorModel(pool);
const inventoryModel = new InventoryModel(pool);

const TERMINAL_MEDIA_STATUS_KEYS = new Set(['not_returned', 'retired']);
const ACTIVE_ASSIGNMENT_STATUS_KEY = 'active';
const RETURNED_ASSIGNMENT_STATUS_KEY = 'returned';
const NOT_RETURNED_ASSIGNMENT_STATUS_KEY = 'not_returned';
const ACTIVE_ENROLLMENT_STATUS_KEY = 'active';
const ALLOWED_ENROLLMENT_STATUS_KEYS = new Set(['pending', 'active', 'suspended', 'deactivated']);

const normalizeText = (value) => String(value || '').trim();

const normalizeTagCode = (value) => normalizeText(value).toUpperCase();

const normalizeId = (value) => {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    return null;
  }

  return normalized;
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

  return parsed.toISOString().slice(0, 19).replace('T', ' ');
};

const toCurrentDateTimeSql = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

const normalizeStatusKey = (value, fallback = '') => {
  const normalized = normalizeText(value).toLowerCase();
  return normalized || fallback;
};

const assertRequiredText = (value, message, code = 'INVALID_ACCESS_FIELD') => {
  const normalized = normalizeText(value);
  if (!normalized) {
    throw new AppError(message, {
      statusCode: 400,
      code
    });
  }

  return normalized;
};

const toCollaboratorSummary = (collaborator) => {
  if (!collaborator) {
    return null;
  }

  return {
    id: Number(collaborator.id),
    employee_id: Number(collaborator.employee_id),
    full_name: collaborator.full_name || `${collaborator.first_name || ''} ${collaborator.last_name || ''}`.trim(),
    area_name: collaborator.area_name || null,
    status: collaborator.status || null
  };
};

const toAccessSystemResponse = (system) => {
  if (!system) {
    return null;
  }

  return {
    id: Number(system.id),
    system_key: system.system_key,
    name: system.name,
    description: system.description || null,
    status: system.status || null
  };
};

const toInventoryUnitSummary = (assetUnit, asset = null) => {
  if (!assetUnit) {
    return null;
  }

  return {
    id: Number(assetUnit.id),
    asset_id: Number(assetUnit.asset_id),
    asset_tag: assetUnit.asset_tag || null,
    serial_number: assetUnit.serial_number || null,
    status_key: assetUnit.status_key || null,
    current_location_id: assetUnit.current_location_id ? Number(assetUnit.current_location_id) : null,
    asset: asset ? {
      id: Number(asset.id),
      internal_code: asset.internal_code || null,
      asset_name: asset.asset_name || null,
      type_key: asset.type_key || null,
      type_name: asset.type_name || null,
      tracking_mode_key: asset.tracking_mode_key || null
    } : null
  };
};

const buildAccessMediaResponse = ({
  media,
  assetUnit = null,
  asset = null,
  activeAssignment = null,
  collaborator = null
}) => {
  if (!media) {
    return null;
  }

  return {
    id: Number(media.id),
    medium_type_id: Number(media.medium_type_id),
    medium_type_key: media.medium_type_key,
    medium_type_name: media.medium_type_name,
    status_id: Number(media.status_id),
    status_key: media.status_key,
    status_name: media.status_name,
    status_is_terminal: Boolean(media.status_is_terminal),
    asset_unit_id: Number(media.asset_unit_id),
    tag_code: media.tag_code,
    notes: media.notes || null,
    created_at: media.created_at,
    updated_at: media.updated_at,
    asset_unit: toInventoryUnitSummary(assetUnit, asset),
    active_assignment: activeAssignment ? {
      id: Number(activeAssignment.id),
      status_key: activeAssignment.status_key,
      assigned_at: activeAssignment.assigned_at,
      expected_return_at: activeAssignment.expected_return_at,
      collaborator: toCollaboratorSummary(collaborator)
    } : null
  };
};

const buildAccessMediaAssignmentResponse = ({
  assignment,
  media = null,
  collaborator = null,
  assetUnit = null,
  asset = null
}) => {
  if (!assignment) {
    return null;
  }

  return {
    id: Number(assignment.id),
    access_media_id: Number(assignment.access_media_id),
    collaborator_id: Number(assignment.collaborator_id),
    status_id: Number(assignment.status_id),
    status_key: assignment.status_key,
    status_name: assignment.status_name,
    assigned_by_user_id: assignment.assigned_by_user_id ? Number(assignment.assigned_by_user_id) : null,
    received_by_user_id: assignment.received_by_user_id ? Number(assignment.received_by_user_id) : null,
    assigned_at: assignment.assigned_at,
    expected_return_at: assignment.expected_return_at,
    returned_at: assignment.returned_at,
    assignment_note: assignment.assignment_note || null,
    closure_note: assignment.closure_note || null,
    created_at: assignment.created_at,
    updated_at: assignment.updated_at,
    collaborator: toCollaboratorSummary(collaborator),
    media: buildAccessMediaResponse({
      media,
      assetUnit,
      asset
    })
  };
};

const buildAccessEnrollmentResponse = ({
  enrollment,
  collaborator = null,
  accessSystem = null,
  mediaAssignment = null,
  media = null,
  assetUnit = null,
  asset = null
}) => {
  if (!enrollment) {
    return null;
  }

  return {
    id: Number(enrollment.id),
    collaborator_id: Number(enrollment.collaborator_id),
    access_system_id: Number(enrollment.access_system_id),
    media_assignment_id: enrollment.media_assignment_id ? Number(enrollment.media_assignment_id) : null,
    status_id: Number(enrollment.status_id),
    status_key: enrollment.status_key,
    status_name: enrollment.status_name,
    activated_at: enrollment.activated_at,
    deactivated_at: enrollment.deactivated_at,
    notes: enrollment.notes || null,
    created_at: enrollment.created_at,
    updated_at: enrollment.updated_at,
    collaborator: toCollaboratorSummary(collaborator),
    access_system: toAccessSystemResponse(accessSystem),
    media_assignment: mediaAssignment ? buildAccessMediaAssignmentResponse({
      assignment: mediaAssignment,
      media,
      collaborator,
      assetUnit,
      asset
    }) : null
  };
};

const buildAccessEventResponse = (eventRow) => ({
  id: Number(eventRow.id),
  event_type: eventRow.event_type,
  operator_id: eventRow.operator_id ? Number(eventRow.operator_id) : null,
  operator_name: eventRow.operator_name || null,
  collaborator_id: eventRow.collaborator_id ? Number(eventRow.collaborator_id) : null,
  employee_id: eventRow.employee_id ? Number(eventRow.employee_id) : null,
  collaborator_name: eventRow.collaborator_name || null,
  access_system_id: eventRow.access_system_id ? Number(eventRow.access_system_id) : null,
  access_system_key: eventRow.system_key || null,
  access_system_name: eventRow.access_system_name || null,
  access_media_id: eventRow.access_media_id ? Number(eventRow.access_media_id) : null,
  tag_code: eventRow.tag_code || null,
  access_media_assignment_id: eventRow.access_media_assignment_id ? Number(eventRow.access_media_assignment_id) : null,
  access_enrollment_id: eventRow.access_enrollment_id ? Number(eventRow.access_enrollment_id) : null,
  notes: eventRow.notes || null,
  happened_at: eventRow.happened_at,
  created_at: eventRow.created_at
});

const assertDateTime = (value, message, code) => {
  const normalized = normalizeDateTime(value);
  if (value && !normalized) {
    throw new AppError(message, {
      statusCode: 400,
      code
    });
  }

  return normalized;
};

const resolveMediumType = async ({ mediumTypeId = null, mediumTypeKey = '' }) => {
  if (mediumTypeId) {
    return accessModel.getMediumTypeById(mediumTypeId);
  }

  const normalizedMediumTypeKey = normalizeStatusKey(mediumTypeKey);
  if (!normalizedMediumTypeKey) {
    return null;
  }

  return accessModel.getMediumTypeByKey(normalizedMediumTypeKey);
};

const resolveAccessSystem = async ({ accessSystemId = null, accessSystemKey = '' }) => {
  if (accessSystemId) {
    return accessModel.getAccessSystemById(accessSystemId);
  }

  const normalizedSystemKey = normalizeStatusKey(accessSystemKey);
  if (!normalizedSystemKey) {
    return null;
  }

  return accessModel.getAccessSystemByKey(normalizedSystemKey);
};

const resolveActiveAssignmentContext = async (accessMediaId) => {
  const activeAssignment = await accessModel.findActiveAccessMediaAssignmentByMediaId(accessMediaId);
  if (!activeAssignment) {
    return {
      activeAssignment: null,
      collaborator: null
    };
  }

  const collaborator = await collaboratorModel.findById(activeAssignment.collaborator_id);

  return {
    activeAssignment,
    collaborator
  };
};

const loadMediaContext = async (accessMediaId) => {
  const media = await accessModel.getAccessMediaById(accessMediaId);
  if (!media) {
    return null;
  }

  const [{ activeAssignment, collaborator }, assetUnit] = await Promise.all([
    resolveActiveAssignmentContext(accessMediaId),
    inventoryModel.getAssetUnitById(media.asset_unit_id)
  ]);

  const asset = assetUnit ? await inventoryModel.getAssetById(assetUnit.asset_id) : null;

  return {
    media,
    assetUnit,
    asset,
    activeAssignment,
    collaborator
  };
};

const loadAssignmentContext = async (accessMediaAssignmentId) => {
  const assignment = await accessModel.getAccessMediaAssignmentById(accessMediaAssignmentId);
  if (!assignment) {
    return null;
  }

  const [media, collaborator] = await Promise.all([
    accessModel.getAccessMediaById(assignment.access_media_id),
    collaboratorModel.findById(assignment.collaborator_id)
  ]);

  const assetUnit = media ? await inventoryModel.getAssetUnitById(media.asset_unit_id) : null;
  const asset = assetUnit ? await inventoryModel.getAssetById(assetUnit.asset_id) : null;

  return {
    assignment,
    media,
    collaborator,
    assetUnit,
    asset
  };
};

const loadEnrollmentContext = async (accessEnrollmentId) => {
  const enrollment = await accessModel.getAccessEnrollmentById(accessEnrollmentId);
  if (!enrollment) {
    return null;
  }

  const [collaborator, accessSystem, mediaAssignment] = await Promise.all([
    collaboratorModel.findById(enrollment.collaborator_id),
    accessModel.getAccessSystemById(enrollment.access_system_id),
    enrollment.media_assignment_id
      ? accessModel.getAccessMediaAssignmentById(enrollment.media_assignment_id)
      : Promise.resolve(null)
  ]);

  const media = mediaAssignment
    ? await accessModel.getAccessMediaById(mediaAssignment.access_media_id)
    : null;
  const assetUnit = media ? await inventoryModel.getAssetUnitById(media.asset_unit_id) : null;
  const asset = assetUnit ? await inventoryModel.getAssetById(assetUnit.asset_id) : null;

  return {
    enrollment,
    collaborator,
    accessSystem,
    mediaAssignment,
    media,
    assetUnit,
    asset
  };
};

const assertAccessMediaExists = async (accessMediaId) => {
  const media = await accessModel.getAccessMediaById(accessMediaId);
  if (!media) {
    throw new AppError('El medio de acceso indicado no existe.', {
      statusCode: 404,
      code: 'ACCESS_MEDIA_NOT_FOUND'
    });
  }

  return media;
};

const assertCollaboratorExists = async (collaboratorId) => {
  const collaborator = await collaboratorModel.findById(collaboratorId);
  if (!collaborator) {
    throw new AppError('El colaborador indicado no existe.', {
      statusCode: 404,
      code: 'COLLABORATOR_NOT_FOUND'
    });
  }

  return collaborator;
};

const assertAccessSystemExists = async ({ accessSystemId = null, accessSystemKey = '' }) => {
  const accessSystem = await resolveAccessSystem({ accessSystemId, accessSystemKey });
  if (!accessSystem) {
    throw new AppError('El sistema de acceso indicado no existe.', {
      statusCode: 404,
      code: 'ACCESS_SYSTEM_NOT_FOUND'
    });
  }

  return accessSystem;
};

const assertMediaAssignmentExists = async (accessMediaAssignmentId) => {
  const assignment = await accessModel.getAccessMediaAssignmentById(accessMediaAssignmentId);
  if (!assignment) {
    throw new AppError('La asignacion del medio no existe.', {
      statusCode: 404,
      code: 'ACCESS_MEDIA_ASSIGNMENT_NOT_FOUND'
    });
  }

  return assignment;
};

const assertEnrollmentExists = async (accessEnrollmentId) => {
  const enrollment = await accessModel.getAccessEnrollmentById(accessEnrollmentId);
  if (!enrollment) {
    throw new AppError('El enrollment indicado no existe.', {
      statusCode: 404,
      code: 'ACCESS_ENROLLMENT_NOT_FOUND'
    });
  }

  return enrollment;
};

const assertLocationExists = async (locationId, {
  requiredMessage = 'Debes indicar una ubicacion valida.',
  invalidCode = 'INVALID_LOCATION_ID',
  notFoundCode = 'LOCATION_NOT_FOUND'
} = {}) => {
  const normalizedLocationId = normalizeId(locationId);
  if (!normalizedLocationId) {
    throw new AppError(requiredMessage, {
      statusCode: 400,
      code: invalidCode
    });
  }

  const location = await inventoryModel.getLocationById(normalizedLocationId);
  if (!location) {
    throw new AppError('La ubicacion indicada no existe.', {
      statusCode: 404,
      code: notFoundCode
    });
  }

  return location;
};

const assertRfidInventoryUnit = async (assetUnitId) => {
  const assetUnit = await inventoryModel.getAssetUnitById(assetUnitId);
  if (!assetUnit) {
    throw new AppError('La unidad fisica indicada no existe.', {
      statusCode: 404,
      code: 'ASSET_UNIT_NOT_FOUND'
    });
  }

  const asset = await inventoryModel.getAssetById(assetUnit.asset_id);
  if (!asset) {
    throw new AppError('El activo raiz del medio no existe.', {
      statusCode: 404,
      code: 'ASSET_NOT_FOUND'
    });
  }

  if (asset.type_key !== 'rfid_tag') {
    throw new AppError('Solo puedes vincular unidades fisicas del tipo RFID dentro de Access.', {
      statusCode: 409,
      code: 'INVALID_ACCESS_MEDIA_ASSET_TYPE'
    });
  }

  return {
    assetUnit,
    asset
  };
};

const syncInventoryForAccessLifecycle = async ({
  txInventoryModel,
  accessMedia,
  assetUnit,
  asset,
  operatorId = null,
  requestReason,
  movementTypeKey,
  targetUnitStatusKey,
  referenceId,
  happenedAt = null,
  nextLocationId,
  eventActionKey,
  beforeSnapshot,
  afterSnapshot
}) => {
  const [movementType, unitStatus] = await Promise.all([
    txInventoryModel.getMovementTypeByKey(movementTypeKey),
    txInventoryModel.getAssetUnitStatusByKey(targetUnitStatusKey)
  ]);

  if (!movementType || !unitStatus) {
    throw new AppError('El catalogo base de inventario para Access no esta configurado correctamente.', {
      statusCode: 500,
      code: 'ACCESS_INVENTORY_CATALOG_MISSING'
    });
  }

  const movementId = await txInventoryModel.createInventoryMovement(txInventoryModel.db, {
    movementTypeId: Number(movementType.id),
    operatorId,
    reason: requestReason,
    referenceType: 'access_assignment',
    referenceId,
    happenedAt
  });

  await txInventoryModel.createInventoryMovementLine(txInventoryModel.db, {
    inventoryMovementId: movementId,
    assetId: Number(asset.id),
    assetUnitId: Number(accessMedia.asset_unit_id),
    quantity: 1,
    fromLocationId: assetUnit.current_location_id ? Number(assetUnit.current_location_id) : null,
    toLocationId: nextLocationId,
    notes: requestReason
  });

  await txInventoryModel.updateAssetUnit(txInventoryModel.db, {
    assetUnitId: Number(accessMedia.asset_unit_id),
    assetUnitStatusId: Number(unitStatus.id),
    currentLocationId: nextLocationId
  });

  await txInventoryModel.createAssetEvent(txInventoryModel.db, {
    assetId: Number(asset.id),
    assetUnitId: Number(accessMedia.asset_unit_id),
    operatorId,
    actionKey: eventActionKey,
    entityType: 'access_media_assignments',
    entityId: referenceId,
    reason: requestReason,
    beforeSnapshot,
    afterSnapshot
  });
};

const resolveEnrollmentEventType = (statusKey) => {
  if (statusKey === 'active') {
    return 'enrollment_activated';
  }

  if (statusKey === 'suspended') {
    return 'enrollment_suspended';
  }

  if (statusKey === 'deactivated') {
    return 'enrollment_deactivated';
  }

  return 'enrollment_pending';
};

export const AccessService = {
  async getCatalog() {
    const [systems, mediumTypes, mediaStatuses, assignmentStatuses, enrollmentStatuses] = await Promise.all([
      accessModel.listAccessSystems(),
      accessModel.listMediumTypes(),
      accessModel.listMediaStatuses(),
      accessModel.listAssignmentStatuses(),
      accessModel.listEnrollmentStatuses()
    ]);

    return {
      systems: systems.map(toAccessSystemResponse),
      medium_types: mediumTypes.map((row) => ({
        id: Number(row.id),
        type_key: row.type_key,
        name: row.name,
        description: row.description || null
      })),
      media_statuses: mediaStatuses.map((row) => ({
        id: Number(row.id),
        status_key: row.status_key,
        name: row.name,
        description: row.description || null,
        is_terminal: Boolean(row.is_terminal)
      })),
      assignment_statuses: assignmentStatuses.map((row) => ({
        id: Number(row.id),
        status_key: row.status_key,
        name: row.name,
        description: row.description || null,
        is_terminal: Boolean(row.is_terminal)
      })),
      enrollment_statuses: enrollmentStatuses.map((row) => ({
        id: Number(row.id),
        status_key: row.status_key,
        name: row.name,
        description: row.description || null,
        is_terminal: Boolean(row.is_terminal)
      }))
    };
  },

  async listAccessMedia({ query = {} } = {}) {
    const rows = await accessModel.listAccessMedia({
      mediumTypeKey: query.medium_type_key,
      statusKey: query.status_key,
      search: query.search
    });

    return rows.map((row) => ({
      id: Number(row.id),
      medium_type_id: Number(row.medium_type_id),
      medium_type_key: row.medium_type_key,
      medium_type_name: row.medium_type_name,
      status_id: Number(row.status_id),
      status_key: row.status_key,
      status_name: row.status_name,
      status_is_terminal: Boolean(row.status_is_terminal),
      asset_unit_id: Number(row.asset_unit_id),
      tag_code: row.tag_code,
      notes: row.notes || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      asset_unit: {
        id: Number(row.asset_unit_id),
        asset_id: Number(row.asset_id),
        asset_tag: row.asset_tag || null,
        serial_number: row.serial_number || null
      },
      active_assignment: row.active_assignment_id ? {
        id: Number(row.active_assignment_id),
        assigned_at: row.active_assignment_assigned_at,
        collaborator: {
          id: Number(row.active_collaborator_id),
          employee_id: Number(row.active_collaborator_employee_id),
          full_name: row.active_collaborator_name || null
        }
      } : null
    }));
  },

  async getAccessMediaById(accessMediaId) {
    const normalizedAccessMediaId = normalizeId(accessMediaId);
    if (!normalizedAccessMediaId) {
      throw new AppError('El identificador del medio de acceso no es valido.', {
        statusCode: 400,
        code: 'INVALID_ACCESS_MEDIA_ID'
      });
    }

    const context = await loadMediaContext(normalizedAccessMediaId);
    if (!context) {
      throw new AppError('El medio de acceso indicado no existe.', {
        statusCode: 404,
        code: 'ACCESS_MEDIA_NOT_FOUND'
      });
    }

    return buildAccessMediaResponse(context);
  },

  async createAccessMedia({ payload, authUser = null, requestContext = {} }) {
    const assetUnitId = normalizeId(payload?.asset_unit_id);
    const tagCode = normalizeTagCode(payload?.tag_code);

    if (!assetUnitId || !tagCode) {
      throw new AppError('Debes indicar la unidad fisica y el tag del medio de acceso.', {
        statusCode: 400,
        code: 'INVALID_ACCESS_MEDIA_PAYLOAD'
      });
    }

    const mediumType = await resolveMediumType({
      mediumTypeId: normalizeId(payload?.medium_type_id),
      mediumTypeKey: payload?.medium_type_key
    });

    if (!mediumType) {
      throw new AppError('Debes indicar un tipo de medio valido.', {
        statusCode: 400,
        code: 'INVALID_ACCESS_MEDIUM_TYPE'
      });
    }

    const requestedStatusKey = normalizeStatusKey(payload?.status_key, 'available');
    if (requestedStatusKey !== 'available') {
      throw new AppError('Los medios nuevos deben registrarse inicialmente como disponibles.', {
        statusCode: 409,
        code: 'INVALID_INITIAL_ACCESS_MEDIA_STATUS'
      });
    }

    const status = await accessModel.getMediaStatusByKey(requestedStatusKey);
    if (!status) {
      throw new AppError('Debes indicar un estado inicial valido para el medio.', {
        statusCode: 400,
        code: 'INVALID_ACCESS_MEDIA_STATUS'
      });
    }

    const [{ assetUnit, asset }, existingMediaByUnit, existingMediaByTag] = await Promise.all([
      assertRfidInventoryUnit(assetUnitId),
      accessModel.getAccessMediaByAssetUnitId(assetUnitId),
      accessModel.getAccessMediaByTagCode(tagCode)
    ]);

    if (existingMediaByUnit) {
      throw new AppError('La unidad fisica indicada ya esta vinculada a un medio de acceso.', {
        statusCode: 409,
        code: 'ACCESS_MEDIA_ALREADY_LINKED_TO_UNIT'
      });
    }

    if (existingMediaByTag) {
      throw new AppError('Ya existe un medio de acceso registrado con ese tag.', {
        statusCode: 409,
        code: 'ACCESS_MEDIA_TAG_ALREADY_EXISTS'
      });
    }

    if (assetUnit.status_key === 'retired') {
      throw new AppError('No puedes vincular una unidad de inventario que ya se encuentra en baja.', {
        statusCode: 409,
        code: 'ACCESS_MEDIA_ASSET_UNIT_RETIRED'
      });
    }

    if (assetUnit.status_key !== 'available') {
      throw new AppError('Solo puedes registrar medios de acceso sobre unidades disponibles en Inventario.', {
        statusCode: 409,
        code: 'ACCESS_MEDIA_ASSET_UNIT_NOT_AVAILABLE'
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txAccessModel = new AccessModel(connection);
      const txInventoryModel = new InventoryModel(connection);

      const accessMediaId = await txAccessModel.createAccessMedia(connection, {
        mediumTypeId: Number(mediumType.id),
        statusId: Number(status.id),
        assetUnitId,
        tagCode,
        notes: normalizeText(payload?.notes) || null
      });

      await txAccessModel.createAccessEvent(connection, {
        eventType: 'media_created',
        operatorId: authUser?.id || null,
        accessMediaId,
        notes: normalizeText(payload?.notes) || `Medio ${tagCode} registrado en Access.`
      });

      await txInventoryModel.createAssetEvent(connection, {
        assetId: Number(asset.id),
        assetUnitId,
        operatorId: authUser?.id || null,
        actionKey: 'access_media_linked',
        entityType: 'access_media',
        entityId: accessMediaId,
        reason: normalizeText(payload?.notes) || 'Unidad ligada al dominio de accesos.',
        beforeSnapshot: null,
        afterSnapshot: {
          access_media_id: accessMediaId,
          tag_code: tagCode,
          medium_type_key: mediumType.type_key
        }
      });

      await connection.commit();

      const context = await loadMediaContext(accessMediaId);

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'access.create_media',
        entityType: 'access_media',
        entityId: accessMediaId,
        beforeSnapshot: null,
        afterSnapshot: context?.media || null,
        details: {
          asset_unit_id: assetUnitId,
          medium_type_key: mediumType.type_key,
          tag_code: tagCode
        },
        requestContext
      });

      return buildAccessMediaResponse(context);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

};

