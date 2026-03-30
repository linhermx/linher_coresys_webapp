import { RBAC_SEED } from "../config/rbac.js";

export const getRolesCatalog = () => RBAC_SEED.roles;

export const getPermissionsCatalog = () => RBAC_SEED.permissions;

export const getPermissionsForRole = (roleKey) => RBAC_SEED.matrix[roleKey] ?? [];

export const getRbacBlueprint = () => ({
  roles: getRolesCatalog(),
  permissions: getPermissionsCatalog(),
  matrix: RBAC_SEED.matrix,
});
