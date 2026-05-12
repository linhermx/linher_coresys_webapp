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

  async listAccessMediaAssignments({ query = {} } = {}) {
    const rows = await accessModel.listAccessMediaAssignments({
      collaboratorId: normalizeId(query.collaborator_id),
      accessMediaId: normalizeId(query.access_media_id),
      statusKey: query.status_key,
      search: query.search,
      limit: query.limit
    });

    return rows.map((row) => ({
      id: Number(row.id),
      access_media_id: Number(row.access_media_id),
      collaborator_id: Number(row.collaborator_id),
      status_id: Number(row.status_id),
      status_key: row.status_key,
      status_name: row.status_name,
      assigned_by_user_id: row.assigned_by_user_id ? Number(row.assigned_by_user_id) : null,
      received_by_user_id: row.received_by_user_id ? Number(row.received_by_user_id) : null,
      assigned_at: row.assigned_at,
      expected_return_at: row.expected_return_at,
      returned_at: row.returned_at,
      assignment_note: row.assignment_note || null,
      closure_note: row.closure_note || null,
      media: {
        id: Number(row.access_media_id),
        tag_code: row.tag_code,
        asset_unit_id: Number(row.asset_unit_id),
        asset_tag: row.asset_tag || null
      },
      collaborator: {
        id: Number(row.collaborator_id),
        employee_id: Number(row.employee_id),
        full_name: row.collaborator_name || null
      }
    }));
  },

  async assignAccessMedia({ payload, authUser = null, requestContext = {} }) {
    const accessMediaId = normalizeId(payload?.access_media_id);
    const collaboratorId = normalizeId(payload?.collaborator_id);

    if (!accessMediaId || !collaboratorId) {
      throw new AppError('Debes indicar el medio de acceso y el colaborador.', {
        statusCode: 400,
        code: 'INVALID_ACCESS_MEDIA_ASSIGNMENT_PAYLOAD'
      });
    }

    const assignedAt = assertDateTime(
      payload?.assigned_at,
      'La fecha de asignacion no tiene un formato valido.',
      'INVALID_ACCESS_MEDIA_ASSIGNMENT_DATE'
    );
    const expectedReturnAt = assertDateTime(
      payload?.expected_return_at,
      'La fecha esperada de devolucion no tiene un formato valido.',
      'INVALID_ACCESS_MEDIA_EXPECTED_RETURN_DATE'
    );

    const [media, collaborator, activeAssignment, assignmentStatus, mediaStatus] = await Promise.all([
      assertAccessMediaExists(accessMediaId),
      assertCollaboratorExists(collaboratorId),
      accessModel.findActiveAccessMediaAssignmentByMediaId(accessMediaId),
      accessModel.getAssignmentStatusByKey(ACTIVE_ASSIGNMENT_STATUS_KEY),
      accessModel.getMediaStatusByKey('assigned')
    ]);

    if (collaborator.status !== 'active') {
      throw new AppError('Solo puedes asignar medios de acceso a colaboradores activos.', {
        statusCode: 409,
        code: 'COLLABORATOR_INACTIVE'
      });
    }

    if (activeAssignment) {
      throw new AppError('El medio de acceso ya cuenta con una asignacion activa.', {
        statusCode: 409,
        code: 'ACCESS_MEDIA_ALREADY_ASSIGNED'
      });
    }

    if (TERMINAL_MEDIA_STATUS_KEYS.has(media.status_key)) {
      throw new AppError('El medio de acceso ya se encuentra fuera del ciclo operativo reutilizable.', {
        statusCode: 409,
        code: 'ACCESS_MEDIA_TERMINAL_STATUS'
      });
    }

    if (media.status_key !== 'available') {
      throw new AppError('Solo puedes asignar medios que actualmente esten disponibles.', {
        statusCode: 409,
        code: 'ACCESS_MEDIA_NOT_AVAILABLE'
      });
    }

    if (!assignmentStatus || !mediaStatus) {
      throw new AppError('El catalogo base de asignaciones de Access no esta configurado correctamente.', {
        statusCode: 500,
        code: 'ACCESS_BASE_CATALOG_MISSING'
      });
    }

    const { assetUnit, asset } = await assertRfidInventoryUnit(Number(media.asset_unit_id));

    if (assetUnit.status_key === 'retired') {
      throw new AppError('La unidad fisica ya se encuentra en baja y no puede reasignarse.', {
        statusCode: 409,
        code: 'ACCESS_MEDIA_UNIT_RETIRED'
      });
    }

    if (assetUnit.status_key !== 'available') {
      throw new AppError('La unidad fisica asociada no esta disponible para asignacion.', {
        statusCode: 409,
        code: 'ACCESS_MEDIA_UNIT_NOT_AVAILABLE'
      });
    }

    const inventoryAssignment = await inventoryModel.getActiveAssetAssignmentByUnitId(Number(media.asset_unit_id));
    if (inventoryAssignment) {
      throw new AppError('La unidad fisica ya cuenta con un resguardo activo en Inventario.', {
        statusCode: 409,
        code: 'ACCESS_MEDIA_UNIT_ALREADY_ASSIGNED_IN_INVENTORY'
      });
    }

    const nextLocationId = normalizeId(payload?.location_id) || (assetUnit.current_location_id ? Number(assetUnit.current_location_id) : null);
    if (payload?.location_id) {
      await assertLocationExists(payload.location_id);
    }

    const assignmentNote = normalizeText(payload?.assignment_note || payload?.notes) || null;
    const reason = assignmentNote || 'Salida por asignacion de medio de acceso.';

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txAccessModel = new AccessModel(connection);
      const txInventoryModel = new InventoryModel(connection);

      const accessMediaAssignmentId = await txAccessModel.createAccessMediaAssignment(connection, {
        accessMediaId,
        collaboratorId,
        statusId: Number(assignmentStatus.id),
        assignedByUserId: authUser?.id || null,
        assignedAt,
        expectedReturnAt,
        assignmentNote
      });

      await txAccessModel.updateAccessMediaStatus(connection, {
        accessMediaId,
        statusId: Number(mediaStatus.id),
        notes: assignmentNote
      });

      await syncInventoryForAccessLifecycle({
        txInventoryModel,
        accessMedia: media,
        assetUnit,
        asset,
        operatorId: authUser?.id || null,
        requestReason: reason,
        movementTypeKey: 'assignment_out',
        targetUnitStatusKey: 'assigned',
        referenceId: accessMediaAssignmentId,
        happenedAt: assignedAt,
        nextLocationId,
        eventActionKey: 'access_media_assigned',
        beforeSnapshot: {
          status_key: assetUnit.status_key,
          current_location_id: assetUnit.current_location_id
        },
        afterSnapshot: {
          status_key: 'assigned',
          current_location_id: nextLocationId,
          collaborator_id: collaboratorId
        }
      });

      await txAccessModel.createAccessEvent(connection, {
        eventType: 'media_assigned',
        operatorId: authUser?.id || null,
        collaboratorId,
        accessMediaId,
        accessMediaAssignmentId,
        notes: reason,
        happenedAt: assignedAt
      });

      await connection.commit();

      const context = await loadAssignmentContext(accessMediaAssignmentId);

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'access.assign_media',
        entityType: 'access_media_assignments',
        entityId: accessMediaAssignmentId,
        beforeSnapshot: null,
        afterSnapshot: context?.assignment || null,
        details: {
          access_media_id: accessMediaId,
          collaborator_id: collaboratorId
        },
        requestContext
      });

      return buildAccessMediaAssignmentResponse(context);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async returnAccessMediaAssignment({ accessMediaAssignmentId, payload, authUser = null, requestContext = {} }) {
    const normalizedAssignmentId = normalizeId(accessMediaAssignmentId);
    if (!normalizedAssignmentId) {
      throw new AppError('El identificador de la asignacion no es valido.', {
        statusCode: 400,
        code: 'INVALID_ACCESS_MEDIA_ASSIGNMENT_ID'
      });
    }

    const currentAssignment = await assertMediaAssignmentExists(normalizedAssignmentId);
    if (currentAssignment.status_key !== ACTIVE_ASSIGNMENT_STATUS_KEY) {
      throw new AppError('La asignacion indicada ya no se encuentra activa.', {
        statusCode: 409,
        code: 'ACCESS_MEDIA_ASSIGNMENT_NOT_ACTIVE'
      });
    }

    const returnLocation = await assertLocationExists(payload?.location_id, {
      requiredMessage: 'Debes indicar la ubicacion donde regresara el medio.',
      invalidCode: 'INVALID_RETURN_LOCATION'
    });

    const returnedAt = assertDateTime(
      payload?.returned_at,
      'La fecha de devolucion no tiene un formato valido.',
      'INVALID_ACCESS_MEDIA_RETURN_DATE'
    ) || toCurrentDateTimeSql();

    const [{ media, collaborator, assetUnit, asset }, closedStatus, availableStatus] = await Promise.all([
      loadAssignmentContext(normalizedAssignmentId),
      accessModel.getAssignmentStatusByKey(RETURNED_ASSIGNMENT_STATUS_KEY),
      accessModel.getMediaStatusByKey('available')
    ]);

    if (!media || !assetUnit || !asset) {
      throw new AppError('La asignacion activa quedo sin contexto fisico valido.', {
        statusCode: 409,
        code: 'ACCESS_MEDIA_ASSIGNMENT_CONTEXT_INVALID'
      });
    }

    if (!closedStatus || !availableStatus) {
      throw new AppError('El catalogo base de devoluciones de Access no esta configurado correctamente.', {
        statusCode: 500,
        code: 'ACCESS_BASE_CATALOG_MISSING'
      });
    }

    const closureNote = normalizeText(payload?.closure_note || payload?.notes) || 'Medio devuelto y reintegrado al inventario disponible.';
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txAccessModel = new AccessModel(connection);
      const txInventoryModel = new InventoryModel(connection);

      await txAccessModel.closeAccessMediaAssignment(connection, {
        accessMediaAssignmentId: normalizedAssignmentId,
        statusId: Number(closedStatus.id),
        receivedByUserId: authUser?.id || null,
        returnedAt,
        closureNote
      });

      await txAccessModel.updateAccessMediaStatus(connection, {
        accessMediaId: Number(media.id),
        statusId: Number(availableStatus.id),
        notes: closureNote
      });

      await syncInventoryForAccessLifecycle({
        txInventoryModel,
        accessMedia: media,
        assetUnit,
        asset,
        operatorId: authUser?.id || null,
        requestReason: closureNote,
        movementTypeKey: 'return_in',
        targetUnitStatusKey: 'available',
        referenceId: normalizedAssignmentId,
        happenedAt: returnedAt,
        nextLocationId: Number(returnLocation.id),
        eventActionKey: 'access_media_returned',
        beforeSnapshot: currentAssignment,
        afterSnapshot: {
          status_key: RETURNED_ASSIGNMENT_STATUS_KEY,
          returned_at: returnedAt,
          return_location_id: Number(returnLocation.id)
        }
      });

      await txAccessModel.createAccessEvent(connection, {
        eventType: 'media_returned',
        operatorId: authUser?.id || null,
        collaboratorId: collaborator?.id || Number(currentAssignment.collaborator_id),
        accessMediaId: Number(media.id),
        accessMediaAssignmentId: normalizedAssignmentId,
        notes: closureNote,
        happenedAt: returnedAt
      });

      await connection.commit();

      const updatedContext = await loadAssignmentContext(normalizedAssignmentId);

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'access.return_media',
        entityType: 'access_media_assignments',
        entityId: normalizedAssignmentId,
        beforeSnapshot: currentAssignment,
        afterSnapshot: updatedContext?.assignment || null,
        requestContext
      });

      return buildAccessMediaAssignmentResponse(updatedContext);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async markAccessMediaAssignmentNotReturned({ accessMediaAssignmentId, payload, authUser = null, requestContext = {} }) {
    const normalizedAssignmentId = normalizeId(accessMediaAssignmentId);
    if (!normalizedAssignmentId) {
      throw new AppError('El identificador de la asignacion no es valido.', {
        statusCode: 400,
        code: 'INVALID_ACCESS_MEDIA_ASSIGNMENT_ID'
      });
    }

    const currentAssignment = await assertMediaAssignmentExists(normalizedAssignmentId);
    if (currentAssignment.status_key !== ACTIVE_ASSIGNMENT_STATUS_KEY) {
      throw new AppError('La asignacion indicada ya no se encuentra activa.', {
        statusCode: 409,
        code: 'ACCESS_MEDIA_ASSIGNMENT_NOT_ACTIVE'
      });
    }

    const resolvedAt = assertDateTime(
      payload?.resolved_at || payload?.returned_at,
      'La fecha del cierre por no devolucion no tiene un formato valido.',
      'INVALID_ACCESS_MEDIA_NOT_RETURNED_DATE'
    ) || toCurrentDateTimeSql();

    const [{ media, collaborator, assetUnit, asset }, closedStatus, terminalMediaStatus] = await Promise.all([
      loadAssignmentContext(normalizedAssignmentId),
      accessModel.getAssignmentStatusByKey(NOT_RETURNED_ASSIGNMENT_STATUS_KEY),
      accessModel.getMediaStatusByKey(NOT_RETURNED_ASSIGNMENT_STATUS_KEY)
    ]);

    if (!media || !assetUnit || !asset) {
      throw new AppError('La asignacion activa quedo sin contexto fisico valido.', {
        statusCode: 409,
        code: 'ACCESS_MEDIA_ASSIGNMENT_CONTEXT_INVALID'
      });
    }

    if (!closedStatus || !terminalMediaStatus) {
      throw new AppError('El catalogo base de no devolucion de Access no esta configurado correctamente.', {
        statusCode: 500,
        code: 'ACCESS_BASE_CATALOG_MISSING'
      });
    }

    const closureNote = assertRequiredText(
      payload?.closure_note || payload?.notes,
      'Debes indicar el motivo de no devolucion del medio.',
      'INVALID_ACCESS_MEDIA_NOT_RETURNED_NOTE'
    );

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txAccessModel = new AccessModel(connection);
      const txInventoryModel = new InventoryModel(connection);

      await txAccessModel.closeAccessMediaAssignment(connection, {
        accessMediaAssignmentId: normalizedAssignmentId,
        statusId: Number(closedStatus.id),
        receivedByUserId: authUser?.id || null,
        returnedAt: resolvedAt,
        closureNote
      });

      await txAccessModel.updateAccessMediaStatus(connection, {
        accessMediaId: Number(media.id),
        statusId: Number(terminalMediaStatus.id),
        notes: closureNote
      });

      await syncInventoryForAccessLifecycle({
        txInventoryModel,
        accessMedia: media,
        assetUnit,
        asset,
        operatorId: authUser?.id || null,
        requestReason: closureNote,
        movementTypeKey: 'retire_out',
        targetUnitStatusKey: 'retired',
        referenceId: normalizedAssignmentId,
        happenedAt: resolvedAt,
        nextLocationId: null,
        eventActionKey: 'access_media_marked_not_returned',
        beforeSnapshot: currentAssignment,
        afterSnapshot: {
          status_key: NOT_RETURNED_ASSIGNMENT_STATUS_KEY,
          resolved_at: resolvedAt
        }
      });

      await txAccessModel.createAccessEvent(connection, {
        eventType: 'media_marked_not_returned',
        operatorId: authUser?.id || null,
        collaboratorId: collaborator?.id || Number(currentAssignment.collaborator_id),
        accessMediaId: Number(media.id),
        accessMediaAssignmentId: normalizedAssignmentId,
        notes: closureNote,
        happenedAt: resolvedAt
      });

      await connection.commit();

      const updatedContext = await loadAssignmentContext(normalizedAssignmentId);

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'access.mark_media_not_returned',
        entityType: 'access_media_assignments',
        entityId: normalizedAssignmentId,
        beforeSnapshot: currentAssignment,
        afterSnapshot: updatedContext?.assignment || null,
        requestContext
      });

      return buildAccessMediaAssignmentResponse(updatedContext);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async listAccessEnrollments({ query = {} } = {}) {
    const rows = await accessModel.listAccessEnrollments({
      collaboratorId: normalizeId(query.collaborator_id),
      accessSystemId: normalizeId(query.access_system_id),
      statusKey: query.status_key,
      search: query.search,
      limit: query.limit
    });

    return rows.map((row) => ({
      id: Number(row.id),
      collaborator_id: Number(row.collaborator_id),
      access_system_id: Number(row.access_system_id),
      media_assignment_id: row.media_assignment_id ? Number(row.media_assignment_id) : null,
      status_id: Number(row.status_id),
      status_key: row.status_key,
      status_name: row.status_name,
      activated_at: row.activated_at,
      deactivated_at: row.deactivated_at,
      notes: row.notes || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      collaborator: {
        id: Number(row.collaborator_id),
        employee_id: Number(row.employee_id),
        full_name: row.collaborator_name || null
      },
      access_system: {
        id: Number(row.access_system_id),
        system_key: row.system_key,
        name: row.access_system_name
      },
      media: row.access_media_id ? {
        id: Number(row.access_media_id),
        tag_code: row.tag_code || null
      } : null
    }));
  },

  async createAccessEnrollment({ payload, authUser = null, requestContext = {} }) {
    const collaboratorId = normalizeId(payload?.collaborator_id);
    if (!collaboratorId) {
      throw new AppError('Debes indicar el colaborador para el enrollment.', {
        statusCode: 400,
        code: 'INVALID_ACCESS_ENROLLMENT_COLLABORATOR'
      });
    }

    const collaborator = await assertCollaboratorExists(collaboratorId);
    if (collaborator.status !== 'active') {
      throw new AppError('Solo puedes crear enrollments para colaboradores activos.', {
        statusCode: 409,
        code: 'COLLABORATOR_INACTIVE'
      });
    }

    const accessSystem = await assertAccessSystemExists({
      accessSystemId: normalizeId(payload?.access_system_id),
      accessSystemKey: payload?.access_system_key
    });

    const statusKey = normalizeStatusKey(payload?.status_key, ACTIVE_ENROLLMENT_STATUS_KEY);
    if (!ALLOWED_ENROLLMENT_STATUS_KEYS.has(statusKey)) {
      throw new AppError('Debes indicar un estado valido para el enrollment.', {
        statusCode: 400,
        code: 'INVALID_ACCESS_ENROLLMENT_STATUS'
      });
    }

    const enrollmentStatus = await accessModel.getEnrollmentStatusByKey(statusKey);
    if (!enrollmentStatus) {
      throw new AppError('El estado solicitado para el enrollment no existe.', {
        statusCode: 404,
        code: 'ACCESS_ENROLLMENT_STATUS_NOT_FOUND'
      });
    }

    let mediaAssignment = null;
    const mediaAssignmentId = normalizeId(payload?.media_assignment_id);
    if (mediaAssignmentId) {
      mediaAssignment = await assertMediaAssignmentExists(mediaAssignmentId);
      if (Number(mediaAssignment.collaborator_id) !== collaboratorId) {
        throw new AppError('La asignacion del medio no pertenece al colaborador indicado.', {
          statusCode: 409,
          code: 'ACCESS_MEDIA_ASSIGNMENT_COLLABORATOR_MISMATCH'
        });
      }

      if (statusKey === ACTIVE_ENROLLMENT_STATUS_KEY && mediaAssignment.status_key !== ACTIVE_ASSIGNMENT_STATUS_KEY) {
        throw new AppError('Solo puedes ligar enrollments activos a una asignacion activa del medio.', {
          statusCode: 409,
          code: 'ACCESS_ENROLLMENT_REQUIRES_ACTIVE_MEDIA_ASSIGNMENT'
        });
      }
    }

    const existingActiveEnrollment = await accessModel.findActiveAccessEnrollment({
      collaboratorId,
      accessSystemId: Number(accessSystem.id)
    });

    if (statusKey === ACTIVE_ENROLLMENT_STATUS_KEY && existingActiveEnrollment) {
      throw new AppError('El colaborador ya cuenta con un enrollment activo en ese sistema.', {
        statusCode: 409,
        code: 'ACCESS_ENROLLMENT_ALREADY_ACTIVE'
      });
    }

    const activatedAt = statusKey === ACTIVE_ENROLLMENT_STATUS_KEY
      ? assertDateTime(
        payload?.activated_at,
        'La fecha de activacion no tiene un formato valido.',
        'INVALID_ACCESS_ENROLLMENT_ACTIVATED_AT'
      )
      : null;
    const deactivatedAt = statusKey === 'deactivated'
      ? assertDateTime(
        payload?.deactivated_at,
        'La fecha de baja del enrollment no tiene un formato valido.',
        'INVALID_ACCESS_ENROLLMENT_DEACTIVATED_AT'
      )
      : null;
    const notes = normalizeText(payload?.notes) || null;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txAccessModel = new AccessModel(connection);

      const accessEnrollmentId = await txAccessModel.createAccessEnrollment(connection, {
        collaboratorId,
        accessSystemId: Number(accessSystem.id),
        mediaAssignmentId,
        statusId: Number(enrollmentStatus.id),
        activatedAt,
        deactivatedAt,
        notes
      });

      await txAccessModel.createAccessEvent(connection, {
        eventType: 'enrollment_created',
        operatorId: authUser?.id || null,
        collaboratorId,
        accessSystemId: Number(accessSystem.id),
        accessMediaAssignmentId: mediaAssignmentId,
        accessEnrollmentId,
        notes: notes || `Enrollment creado para ${accessSystem.name}.`,
        happenedAt: activatedAt || deactivatedAt || null
      });

      if (statusKey !== 'pending') {
        await txAccessModel.createAccessEvent(connection, {
          eventType: resolveEnrollmentEventType(statusKey),
          operatorId: authUser?.id || null,
          collaboratorId,
          accessSystemId: Number(accessSystem.id),
          accessMediaAssignmentId: mediaAssignmentId,
          accessEnrollmentId,
          notes: notes || `Enrollment marcado como ${statusKey}.`,
          happenedAt: activatedAt || deactivatedAt || null
        });
      }

      await connection.commit();

      const context = await loadEnrollmentContext(accessEnrollmentId);

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'access.create_enrollment',
        entityType: 'access_enrollments',
        entityId: accessEnrollmentId,
        beforeSnapshot: null,
        afterSnapshot: context?.enrollment || null,
        requestContext
      });

      return buildAccessEnrollmentResponse(context);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateAccessEnrollmentStatus({ accessEnrollmentId, payload, authUser = null, requestContext = {} }) {
    const normalizedEnrollmentId = normalizeId(accessEnrollmentId);
    if (!normalizedEnrollmentId) {
      throw new AppError('El identificador del enrollment no es valido.', {
        statusCode: 400,
        code: 'INVALID_ACCESS_ENROLLMENT_ID'
      });
    }

    const currentEnrollment = await assertEnrollmentExists(normalizedEnrollmentId);
    const targetStatusKey = normalizeStatusKey(payload?.status_key);

    if (!ALLOWED_ENROLLMENT_STATUS_KEYS.has(targetStatusKey)) {
      throw new AppError('Debes indicar un estado valido para el enrollment.', {
        statusCode: 400,
        code: 'INVALID_ACCESS_ENROLLMENT_STATUS'
      });
    }

    if (currentEnrollment.status_key === targetStatusKey) {
      throw new AppError('El enrollment ya se encuentra en ese estado.', {
        statusCode: 409,
        code: 'ACCESS_ENROLLMENT_STATUS_UNCHANGED'
      });
    }

    const currentStatus = await accessModel.getEnrollmentStatusById(currentEnrollment.status_id);
    if (currentStatus?.is_terminal) {
      throw new AppError('El enrollment ya se encuentra en un estado terminal y no puede cambiarse desde este flujo.', {
        statusCode: 409,
        code: 'ACCESS_ENROLLMENT_TERMINAL_STATUS'
      });
    }

    const targetStatus = await accessModel.getEnrollmentStatusByKey(targetStatusKey);
    if (!targetStatus) {
      throw new AppError('El estado objetivo del enrollment no existe.', {
        statusCode: 404,
        code: 'ACCESS_ENROLLMENT_STATUS_NOT_FOUND'
      });
    }

    const collaborator = await assertCollaboratorExists(currentEnrollment.collaborator_id);
    const accessSystem = await assertAccessSystemExists({
      accessSystemId: currentEnrollment.access_system_id
    });

    let mediaAssignmentId;
    if (payload?.media_assignment_id !== undefined) {
      mediaAssignmentId = normalizeId(payload.media_assignment_id);
      if (mediaAssignmentId) {
        const mediaAssignment = await assertMediaAssignmentExists(mediaAssignmentId);
        if (Number(mediaAssignment.collaborator_id) !== Number(currentEnrollment.collaborator_id)) {
          throw new AppError('La asignacion del medio no pertenece al colaborador del enrollment.', {
            statusCode: 409,
            code: 'ACCESS_ENROLLMENT_MEDIA_ASSIGNMENT_MISMATCH'
          });
        }
      }
    }

    if (targetStatusKey === ACTIVE_ENROLLMENT_STATUS_KEY) {
      if (collaborator.status !== 'active') {
        throw new AppError('No puedes activar enrollments para colaboradores inactivos.', {
          statusCode: 409,
          code: 'COLLABORATOR_INACTIVE'
        });
      }

      const existingActiveEnrollment = await accessModel.findActiveAccessEnrollment({
        collaboratorId: Number(currentEnrollment.collaborator_id),
        accessSystemId: Number(currentEnrollment.access_system_id)
      });

      if (existingActiveEnrollment && Number(existingActiveEnrollment.id) !== normalizedEnrollmentId) {
        throw new AppError('Ya existe otro enrollment activo para ese colaborador y sistema.', {
          statusCode: 409,
          code: 'ACCESS_ENROLLMENT_ALREADY_ACTIVE'
        });
      }
    }

    const activatedAt = targetStatusKey === ACTIVE_ENROLLMENT_STATUS_KEY
      ? assertDateTime(
        payload?.activated_at,
        'La fecha de activacion no tiene un formato valido.',
        'INVALID_ACCESS_ENROLLMENT_ACTIVATED_AT'
      )
      : undefined;
    const deactivatedAt = targetStatusKey === 'deactivated'
      ? assertDateTime(
        payload?.deactivated_at,
        'La fecha de baja del enrollment no tiene un formato valido.',
        'INVALID_ACCESS_ENROLLMENT_DEACTIVATED_AT'
      )
      : undefined;
    const notes = normalizeText(payload?.notes) || undefined;
    const eventNotes = normalizeText(payload?.notes) || `Enrollment marcado como ${targetStatusKey}.`;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const txAccessModel = new AccessModel(connection);

      await txAccessModel.updateAccessEnrollmentStatus(connection, {
        accessEnrollmentId: normalizedEnrollmentId,
        statusId: Number(targetStatus.id),
        mediaAssignmentId,
        activatedAt,
        deactivatedAt,
        notes
      });

      await txAccessModel.createAccessEvent(connection, {
        eventType: resolveEnrollmentEventType(targetStatusKey),
        operatorId: authUser?.id || null,
        collaboratorId: Number(currentEnrollment.collaborator_id),
        accessSystemId: Number(currentEnrollment.access_system_id),
        accessMediaAssignmentId: mediaAssignmentId || currentEnrollment.media_assignment_id || null,
        accessEnrollmentId: normalizedEnrollmentId,
        notes: eventNotes,
        happenedAt: targetStatusKey === 'deactivated'
          ? (deactivatedAt || null)
          : (activatedAt || null)
      });

      await connection.commit();

      const context = await loadEnrollmentContext(normalizedEnrollmentId);

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'access.update_enrollment_status',
        entityType: 'access_enrollments',
        entityId: normalizedEnrollmentId,
        beforeSnapshot: currentEnrollment,
        afterSnapshot: context?.enrollment || null,
        details: {
          access_system_key: accessSystem.system_key,
          collaborator_id: Number(currentEnrollment.collaborator_id),
          next_status_key: targetStatusKey
        },
        requestContext
      });

      return buildAccessEnrollmentResponse(context);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async listAccessEvents({ query = {} } = {}) {
    const rows = await accessModel.listAccessEvents({
      collaboratorId: normalizeId(query.collaborator_id),
      accessMediaId: normalizeId(query.access_media_id),
      accessEnrollmentId: normalizeId(query.access_enrollment_id),
      limit: query.limit
    });

    return rows.map(buildAccessEventResponse);
  }
};

