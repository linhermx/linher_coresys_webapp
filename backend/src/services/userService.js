import crypto from 'node:crypto';

import bcrypt from 'bcryptjs';

import pool from '../config/db.js';
import { SYSTEM_ADMIN_ROLE_KEY } from '../config/rbac.js';
import { AppError } from '../middleware/errorHandler.js';
import { CollaboratorModel } from '../models/CollaboratorModel.js';
import { UserModel } from '../models/UserModel.js';
import { AuditService } from './auditService.js';

const userModel = new UserModel(pool);
const collaboratorModel = new CollaboratorModel(pool);
const TEMP_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
const PASSWORD_MIN_LENGTH = 8;

const normalizeText = (value) => String(value || '').trim();
const normalizeEmail = (value) => normalizeText(value).toLowerCase();

const normalizeStatus = (value, fallback = 'active') => {
  const normalizedStatus = normalizeText(value).toLowerCase() || fallback;
  if (!['active', 'inactive'].includes(normalizedStatus)) {
    throw new AppError('El estatus del usuario no es válido.', {
      statusCode: 400,
      code: 'INVALID_USER_STATUS'
    });
  }

  return normalizedStatus;
};

const normalizeRoleKeys = (roleKeys = []) => {
  const rawRoleKeys = Array.isArray(roleKeys) ? roleKeys : [roleKeys];
  return Array.from(new Set(
    rawRoleKeys
      .map((roleKey) => normalizeText(roleKey).toLowerCase())
      .filter(Boolean)
  ));
};

const assertEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AppError('Debes indicar un correo válido.', {
      statusCode: 400,
      code: 'INVALID_EMAIL'
    });
  }

  return normalizedEmail;
};

const assertPassword = (password) => {
  const normalizedPassword = String(password || '');
  if (normalizedPassword.length < PASSWORD_MIN_LENGTH) {
    throw new AppError(
      `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
      {
        statusCode: 400,
        code: 'WEAK_PASSWORD'
      }
    );
  }

  return normalizedPassword;
};

const generateTemporaryPassword = (length = 12) => {
  let password = '';

  for (let index = 0; index < length; index += 1) {
    const randomIndex = crypto.randomInt(0, TEMP_PASSWORD_ALPHABET.length);
    password += TEMP_PASSWORD_ALPHABET[randomIndex];
  }

  if (/[A-Za-z]/.test(password) && /\d/.test(password)) {
    return password;
  }

  return generateTemporaryPassword(length + 1);
};

const isAdminUser = (authUser) => (
  Array.isArray(authUser?.role_keys)
  && authUser.role_keys.includes(SYSTEM_ADMIN_ROLE_KEY)
);

export const UserService = {
  getMap() {
    return {
      purpose: 'Administrar cuentas del sistema y su vínculo opcional con el directorio operativo.',
      problem: 'Diferenciar cuentas de acceso de la identidad operativa sin duplicar responsabilidad RH.',
      root_entity: 'users',
      lifecycle: ['active', 'inactive'],
      main_flow: ['create_user_account', 'list_users', 'consult_user'],
      critical_actions: ['create', 'view', 'assign_roles', 'link_collaborator'],
      relationships: [
        'users -> roles',
        'users -> permissions',
        'users -> collaborators (opcional)',
        'users -> future tickets',
        'users -> future inventory and access as operator trail'
      ],
      traceability: [
        'users.create'
      ]
    };
  },

  async listUsers(filters = {}) {
    return userModel.list(filters);
  },

  async getUserById(userId) {
    const normalizedUserId = Number(userId);
    if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
      throw new AppError('El identificador del usuario no es válido.', {
        statusCode: 400,
        code: 'INVALID_USER_ID'
      });
    }

    const user = await userModel.getUserByIdWithProfile(normalizedUserId);
    if (!user) {
      throw new AppError('Usuario no encontrado.', {
        statusCode: 404,
        code: 'USER_NOT_FOUND'
      });
    }

    return user;
  },

  async createUser({
    name,
    email,
    password,
    roleKeys = ['requester'],
    collaboratorId = null,
    status = 'active',
    authUser = null,
    requestContext = {}
  }) {
    const normalizedEmail = assertEmail(email);
    const normalizedStatus = normalizeStatus(status);
    const normalizedRoleKeys = normalizeRoleKeys(roleKeys);

    if (normalizedRoleKeys.length === 0) {
      normalizedRoleKeys.push('requester');
    }

    if (normalizedRoleKeys.includes(SYSTEM_ADMIN_ROLE_KEY) && !isAdminUser(authUser)) {
      throw new AppError('Solo un administrador puede asignar el rol admin.', {
        statusCode: 403,
        code: 'FORBIDDEN_ADMIN_ROLE_ASSIGNMENT'
      });
    }

    const existingUser = await userModel.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new AppError('Ya existe un usuario con ese correo.', {
        statusCode: 409,
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    let linkedCollaborator = null;
    if (collaboratorId !== null && collaboratorId !== undefined && collaboratorId !== '') {
      linkedCollaborator = await collaboratorModel.findById(Number(collaboratorId));

      if (!linkedCollaborator) {
        throw new AppError('El colaborador indicado no existe.', {
          statusCode: 404,
          code: 'COLLABORATOR_NOT_FOUND'
        });
      }

      if (linkedCollaborator.linked_user) {
        throw new AppError('Ese colaborador ya está vinculado a otra cuenta del sistema.', {
          statusCode: 409,
          code: 'COLLABORATOR_ALREADY_LINKED'
        });
      }
    }

    const normalizedName = normalizeText(name)
      || linkedCollaborator?.full_name
      || null;

    if (!normalizedName) {
      throw new AppError('Debes indicar el nombre visible del usuario.', {
        statusCode: 400,
        code: 'INVALID_USER_NAME'
      });
    }

    const resolvedPassword = normalizeText(password) || generateTemporaryPassword();
    const normalizedPassword = assertPassword(resolvedPassword);
    const passwordHash = await bcrypt.hash(normalizedPassword, 12);
    const roles = await userModel.findRolesByKeys(normalizedRoleKeys);

    if (roles.length !== normalizedRoleKeys.length) {
      const foundRoleKeys = roles.map((role) => role.role_key);
      const missingRoleKeys = normalizedRoleKeys.filter((roleKey) => !foundRoleKeys.includes(roleKey));

      throw new AppError(`No existen los roles solicitados: ${missingRoleKeys.join(', ')}.`, {
        statusCode: 400,
        code: 'INVALID_ROLE_KEYS'
      });
    }

    const userId = await userModel.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      collaboratorId: linkedCollaborator?.id || null,
      mustChangePassword: true,
      passwordChangedAt: null,
      status: normalizedStatus
    });

    await userModel.replaceUserRoles({
      userId,
      roleIds: roles.map((role) => role.id),
      assignedByUserId: authUser?.id || null
    });

    const createdUser = await userModel.getUserByIdWithProfile(userId);

    await AuditService.record({
      operatorId: authUser?.id || null,
      action: 'users.create',
      entityType: 'users',
      entityId: userId,
      afterSnapshot: createdUser,
      details: {
        temporary_password_generated: !normalizeText(password),
        role_keys: normalizedRoleKeys
      },
      requestContext
    });

    return {
      user: createdUser,
      credentials: {
        temporary_password: resolvedPassword,
        generated_automatically: !normalizeText(password),
        must_change_password: true
      }
    };
  }
};
