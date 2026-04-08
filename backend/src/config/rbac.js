export const BASE_ROLES = Object.freeze([
  'admin',
  'operator',
  'requester',
  'viewer'
]);

export const BASE_PERMISSIONS = Object.freeze([
  'view',
  'create',
  'update',
  'delete',
  'assign',
  'view_sensitive'
]);

export const ROLE_PERMISSION_MATRIX = Object.freeze({
  admin: [...BASE_PERMISSIONS],
  operator: ['view', 'create', 'update', 'assign'],
  requester: ['view', 'create'],
  viewer: ['view']
});

export const SYSTEM_ADMIN_ROLE_KEY = 'admin';
