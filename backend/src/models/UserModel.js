import { BaseModel } from './BaseModel.js';
import { AuthModel } from './AuthModel.js';

const mapUserListRow = (row) => ({
  id: Number(row.id),
  name: row.name,
  email: row.email,
  photo_path: row.photo_path,
  collaborator_id: row.collaborator_id ? Number(row.collaborator_id) : null,
  must_change_password: Boolean(row.must_change_password),
  password_changed_at: row.password_changed_at,
  status: row.status,
  last_login_at: row.last_login_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
  role_keys: row.role_keys ? String(row.role_keys).split(',').filter(Boolean) : [],
  collaborator: row.collaborator_id ? {
    id: Number(row.collaborator_id),
    employee_id: Number(row.employee_id),
    first_name: row.first_name,
    last_name: row.last_name,
    full_name: `${row.first_name} ${row.last_name}`.trim(),
    area_name: row.area_name,
    status: row.collaborator_status
  } : null
});

export class UserModel extends BaseModel {
  constructor(db) {
    super('users', db);
    this.authModel = new AuthModel(db);
  }

  async list({ search = '', status = '', roleKey = '', linked = '' } = {}) {
    let query = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.photo_path,
        u.collaborator_id,
        u.must_change_password,
        u.password_changed_at,
        u.status,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        c.employee_id,
        c.first_name,
        c.last_name,
        c.area_name,
        c.status AS collaborator_status,
        GROUP_CONCAT(DISTINCT r.role_key ORDER BY r.role_key SEPARATOR ',') AS role_keys
      FROM users u
      LEFT JOIN collaborators c
        ON c.id = u.collaborator_id
        AND c.deleted_at IS NULL
      LEFT JOIN user_roles ur
        ON ur.user_id = u.id
      LEFT JOIN roles r
        ON r.id = ur.role_id
        AND r.deleted_at IS NULL
      WHERE u.deleted_at IS NULL
    `;

    const params = [];
    const normalizedSearch = String(search || '').trim();
    const normalizedStatus = String(status || '').trim().toLowerCase();
    const normalizedRoleKey = String(roleKey || '').trim().toLowerCase();
    const normalizedLinked = String(linked || '').trim().toLowerCase();

    if (normalizedSearch) {
      query += `
        AND (
          u.name LIKE ?
          OR u.email LIKE ?
          OR COALESCE(c.first_name, '') LIKE ?
          OR COALESCE(c.last_name, '') LIKE ?
          OR CAST(COALESCE(c.employee_id, '') AS CHAR) LIKE ?
        )
      `;
      params.push(
        `%${normalizedSearch}%`,
        `%${normalizedSearch}%`,
        `%${normalizedSearch}%`,
        `%${normalizedSearch}%`,
        `%${normalizedSearch}%`
      );
    }

    if (['active', 'inactive'].includes(normalizedStatus)) {
      query += ' AND u.status = ?';
      params.push(normalizedStatus);
    }

    if (normalizedLinked === 'linked') {
      query += ' AND u.collaborator_id IS NOT NULL';
    }

    if (normalizedLinked === 'unlinked') {
      query += ' AND u.collaborator_id IS NULL';
    }

    if (normalizedRoleKey) {
      query += `
        AND EXISTS (
          SELECT 1
          FROM user_roles ur_filter
          INNER JOIN roles r_filter
            ON r_filter.id = ur_filter.role_id
          WHERE ur_filter.user_id = u.id
            AND r_filter.role_key = ?
            AND r_filter.deleted_at IS NULL
        )
      `;
      params.push(normalizedRoleKey);
    }

    query += `
      GROUP BY
        u.id,
        u.name,
        u.email,
        u.photo_path,
        u.collaborator_id,
        u.must_change_password,
        u.password_changed_at,
        u.status,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        c.employee_id,
        c.first_name,
        c.last_name,
        c.area_name,
        c.status
      ORDER BY u.created_at DESC
    `;

    const [rows] = await this.db.query(query, params);
    return rows.map(mapUserListRow);
  }

  async findByEmail(email) {
    const [rows] = await this.db.query(`
      SELECT id, email
      FROM users
      WHERE email = ?
      LIMIT 1
    `, [String(email || '').trim().toLowerCase()]);

    return rows[0] || null;
  }

  async getUserByIdWithProfile(userId) {
    const [rows] = await this.db.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.photo_path,
        u.collaborator_id,
        u.must_change_password,
        u.password_changed_at,
        u.status,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        c.employee_id,
        c.first_name,
        c.last_name,
        c.area_name,
        c.status AS collaborator_status
      FROM users u
      LEFT JOIN collaborators c
        ON c.id = u.collaborator_id
        AND c.deleted_at IS NULL
      WHERE u.id = ?
        AND u.deleted_at IS NULL
      LIMIT 1
    `, [userId]);

    const userRow = rows[0];
    if (!userRow) {
      return null;
    }

    const accessProfile = await this.authModel.getUserByIdWithAccess(userId);
    if (!accessProfile) {
      return null;
    }

    return {
      ...accessProfile,
      collaborator: userRow.collaborator_id ? {
        id: Number(userRow.collaborator_id),
        employee_id: Number(userRow.employee_id),
        first_name: userRow.first_name,
        last_name: userRow.last_name,
        full_name: `${userRow.first_name} ${userRow.last_name}`.trim(),
        area_name: userRow.area_name,
        status: userRow.collaborator_status
      } : null
    };
  }

  async findRolesByKeys(roleKeys = []) {
    const normalizedRoleKeys = Array.from(new Set(
      (Array.isArray(roleKeys) ? roleKeys : [roleKeys])
        .map((roleKey) => String(roleKey || '').trim().toLowerCase())
        .filter(Boolean)
    ));

    if (normalizedRoleKeys.length === 0) {
      return [];
    }

    const [rows] = await this.db.query(`
      SELECT id, role_key, name
      FROM roles
      WHERE role_key IN (?)
        AND deleted_at IS NULL
      ORDER BY name ASC
    `, [normalizedRoleKeys]);

    return rows;
  }

  async create({
    name,
    email,
    passwordHash,
    collaboratorId = null,
    mustChangePassword = true,
    passwordChangedAt = null,
    status = 'active'
  }) {
    const [result] = await this.db.query(`
      INSERT INTO users (
        name,
        email,
        password_hash,
        collaborator_id,
        must_change_password,
        password_changed_at,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      email,
      passwordHash,
      collaboratorId,
      mustChangePassword ? 1 : 0,
      passwordChangedAt,
      status
    ]);

    return Number(result.insertId);
  }

  async replaceUserRoles({ userId, roleIds = [], assignedByUserId = null }) {
    await this.db.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return;
    }

    const values = roleIds.map((roleId) => [userId, roleId, assignedByUserId]);
    await this.db.query(`
      INSERT INTO user_roles (
        user_id,
        role_id,
        assigned_by_user_id
      ) VALUES ?
    `, [values]);
  }
}
