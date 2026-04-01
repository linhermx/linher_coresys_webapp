import { userModel } from "../models/userModel.js";
import { getPool } from "../config/database.js";
import { getRbacBlueprint } from "./rbacService.js";

export const getUsersBlueprint = () => ({
  model: userModel,
  filters: ["status", "role", "search"],
  rbac: getRbacBlueprint(),
});

export const getUserProfileBlueprint = (userId) => ({
  id: userId,
  status: "placeholder",
  profile: userModel.fields,
});

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const { password, ...safeUser } = user;
  return safeUser;
};

export const getUserByIdWithPermissions = async (userId) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role_id,
        u.photo_path,
        u.status,
        u.created_at,
        u.updated_at,
        u.password,
        r.name AS role_name,
        r.description AS role_description
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
      LIMIT 1
    `,
    [userId],
  );

  if (!rows.length) {
    return null;
  }

  const user = rows[0];

  const [rolePermissionRows] = await pool.query(
    `
      SELECT p.slug
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      ORDER BY p.slug ASC
    `,
    [user.role_id],
  );

  const [userPermissionRows] = await pool.query(
    `
      SELECT p.slug
      FROM user_permissions up
      JOIN permissions p ON p.id = up.permission_id
      WHERE up.user_id = ? AND up.granted = 1
      ORDER BY p.slug ASC
    `,
    [userId],
  );

  const rolePermissions = rolePermissionRows.map((item) => item.slug);
  const individualPermissions = userPermissionRows.map((item) => item.slug);

  return sanitizeUser({
    ...user,
    role_permissions: rolePermissions,
    individual_permissions: individualPermissions,
    permissions: Array.from(new Set([...rolePermissions, ...individualPermissions])),
    roleLabel: user.role_name ?? null,
  });
};

export const listUsersCatalog = async ({ search = "", status = "" } = {}) => {
  const pool = getPool();
  let query = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.role_id,
      u.photo_path,
      u.status,
      u.created_at,
      u.updated_at,
      r.name AS role_name
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE 1 = 1
  `;

  const params = [];

  if (search.trim()) {
    query += " AND (u.name LIKE ? OR u.email LIKE ?)";
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  if (["active", "inactive"].includes(status)) {
    query += " AND u.status = ?";
    params.push(status);
  }

  query += " ORDER BY u.created_at DESC";

  const [rows] = await pool.query(query, params);
  return rows.map((row) =>
    sanitizeUser({
      ...row,
      roleLabel: row.role_name ?? null,
    }),
  );
};
