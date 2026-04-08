import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { CollaboratorModel } from '../models/CollaboratorModel.js';
import { AuditService } from './auditService.js';

const collaboratorModel = new CollaboratorModel(pool);

const normalizeText = (value) => String(value || '').trim();

const normalizeStatus = (value, fallback = 'active') => {
  const normalizedStatus = normalizeText(value).toLowerCase() || fallback;
  if (!['active', 'inactive'].includes(normalizedStatus)) {
    throw new AppError('El estatus del colaborador no es válido.', {
      statusCode: 400,
      code: 'INVALID_COLLABORATOR_STATUS'
    });
  }

  return normalizedStatus;
};

const parseEmployeeId = (value) => {
  const normalizedValue = Number(value);
  if (!Number.isInteger(normalizedValue) || normalizedValue <= 0) {
    throw new AppError('El employee_id debe ser numérico, único y mayor que cero.', {
      statusCode: 400,
      code: 'INVALID_EMPLOYEE_ID'
    });
  }

  return normalizedValue;
};

const assertNamePart = (value, fieldName) => {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    throw new AppError(`Debes indicar ${fieldName}.`, {
      statusCode: 400,
      code: 'INVALID_COLLABORATOR_NAME'
    });
  }

  return normalizedValue;
};

export const CollaboratorService = {
  getMap() {
    return {
      purpose: 'Mantener un directorio operativo mínimo de colaboradores bajo control de Sistemas.',
      problem: 'Asignar identidades operativas, activos y medios físicos sin convertir Coresys en un sistema de RH.',
      root_entity: 'collaborators',
      lifecycle: ['active', 'inactive'],
      main_flow: ['register_collaborator', 'list_collaborators', 'consult_collaborator'],
      critical_actions: ['create', 'view', 'link_user_account'],
      relationships: [
        'collaborators -> users (opcional, uno a uno)',
        'collaborators -> future asset_assignments',
        'collaborators -> future access assignments',
        'collaborators -> future tickets as requester or assignee context'
      ],
      traceability: [
        'collaborators.create'
      ]
    };
  },

  async listCollaborators(filters = {}) {
    return collaboratorModel.list(filters);
  },

  async getCollaboratorById(collaboratorId) {
    const normalizedCollaboratorId = Number(collaboratorId);
    if (!Number.isInteger(normalizedCollaboratorId) || normalizedCollaboratorId <= 0) {
      throw new AppError('El identificador del colaborador no es válido.', {
        statusCode: 400,
        code: 'INVALID_COLLABORATOR_ID'
      });
    }

    const collaborator = await collaboratorModel.findById(normalizedCollaboratorId);
    if (!collaborator) {
      throw new AppError('Colaborador no encontrado.', {
        statusCode: 404,
        code: 'COLLABORATOR_NOT_FOUND'
      });
    }

    return collaborator;
  },

  async createCollaborator({
    employeeId,
    firstName,
    lastName,
    areaName = null,
    status = 'active',
    operatorId = null,
    requestContext = {}
  }) {
    const normalizedEmployeeId = parseEmployeeId(employeeId);
    const normalizedFirstName = assertNamePart(firstName, 'el nombre');
    const normalizedLastName = assertNamePart(lastName, 'el apellido');
    const normalizedAreaName = normalizeText(areaName) || null;
    const normalizedStatus = normalizeStatus(status);

    const existingCollaborator = await collaboratorModel.findByEmployeeId(normalizedEmployeeId);
    if (existingCollaborator) {
      throw new AppError('Ya existe un colaborador con ese employee_id.', {
        statusCode: 409,
        code: 'EMPLOYEE_ID_ALREADY_EXISTS'
      });
    }

    const collaboratorId = await collaboratorModel.create({
      employeeId: normalizedEmployeeId,
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      areaName: normalizedAreaName,
      status: normalizedStatus
    });

    const collaborator = await collaboratorModel.findById(collaboratorId);

    await AuditService.record({
      operatorId,
      action: 'collaborators.create',
      entityType: 'collaborators',
      entityId: collaboratorId,
      afterSnapshot: collaborator,
      details: {
        employee_id: normalizedEmployeeId
      },
      requestContext
    });

    return collaborator;
  }
};
