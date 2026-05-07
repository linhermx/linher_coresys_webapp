const SYSTEM_ADMIN_ROLE_KEY = 'admin';

export const hasRole = (authUser, roleKey) => (
  Array.isArray(authUser?.role_keys)
  && authUser.role_keys.includes(String(roleKey || '').trim().toLowerCase())
);

export const hasPermission = (authUser, permissionKey) => {
  const normalizedPermission = String(permissionKey || '').trim();

  if (!normalizedPermission) {
    return true;
  }

  return (
    hasRole(authUser, SYSTEM_ADMIN_ROLE_KEY)
    || (
      Array.isArray(authUser?.permissions)
      && authUser.permissions.includes(normalizedPermission)
    )
  );
};

export const hasAnyPermission = (authUser, permissionKeys = []) => {
  const normalizedPermissions = Array.isArray(permissionKeys)
    ? permissionKeys.filter(Boolean)
    : [permissionKeys].filter(Boolean);

  if (normalizedPermissions.length === 0) {
    return true;
  }

  return normalizedPermissions.some((permissionKey) => hasPermission(authUser, permissionKey));
};
