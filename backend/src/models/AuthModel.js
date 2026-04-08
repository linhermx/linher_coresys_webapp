import { BaseModel } from './BaseModel.js';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const toBoolean = (value) => value === true || value === 1 || value === '1';

const serializeUserRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    ...row,
    must_change_password: toBoolean(row.must_change_password)
  };
};

export class AuthModel extends BaseModel {
  constructor(db) {
    super('users', db);
  }

  async countUsers() {
    const [rows] = await this.db.query('SELECT COUNT(*) AS total FROM users');
    return Number(rows[0]?.total || 0);
  }

  async listRoles() {
    const [rows] = await this.db.query(`
      SELECT
        id,
        role_key,
        name,
        description,
        is_system,
        created_at,
        updated_at
      FROM roles
      WHERE deleted_at IS NULL
      ORDER BY is_system DESC, name ASC
    `);

    return rows.map((row) => ({
      ...row,
      is_system: toBoolean(row.is_system)
    }));
  }

  async findRoleByKey(roleKey) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        role_key,
        name,
        description,
        is_system,
        created_at,
        updated_at
      FROM roles
      WHERE role_key = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [String(roleKey || '').trim().toLowerCase()]);

    return rows[0]
      ? {
          ...rows[0],
          is_system: toBoolean(rows[0].is_system)
        }
      : null;
  }

  async listPermissions() {
    const [rows] = await this.db.query(`
      SELECT
        id,
        permission_key,
        module_key,
        action_key,
        name,
        description,
        created_at,
        updated_at
      FROM permissions
      WHERE deleted_at IS NULL
      ORDER BY
        CASE WHEN module_key IS NULL OR module_key = '' THEN 0 ELSE 1 END,
        module_key ASC,
        action_key ASC,
        name ASC
    `);

    return rows;
  }

  async findActiveUserByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    const [rows] = await this.db.query(`
      SELECT
        id,
        name,
        email,
        password_hash,
        photo_path,
        must_change_password,
        password_changed_at,
        status,
        last_login_at,
        created_at,
        updated_at,
        deleted_at
      FROM users
      WHERE email = ?
        AND status = 'active'
        AND deleted_at IS NULL
      LIMIT 1
    `, [normalizedEmail]);

    return serializeUserRow(rows[0] || null);
  }

  async findUserById(userId) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        name,
        email,
        photo_path,
        must_change_password,
        password_changed_at,
        status,
        last_login_at,
        created_at,
        updated_at,
        deleted_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `, [userId]);

    return serializeUserRow(rows[0] || null);
  }

  async createUser({
    name,
    email,
    passwordHash,
    photoPath = null,
    mustChangePassword = false,
    passwordChangedAt = null,
    status = 'active'
  }) {
    const [result] = await this.db.query(`
      INSERT INTO users (
        name,
        email,
        password_hash,
        photo_path,
        must_change_password,
        password_changed_at,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      String(name || '').trim(),
      normalizeEmail(email),
      passwordHash,
      photoPath,
      mustChangePassword ? 1 : 0,
      passwordChangedAt,
      status
    ]);

    return Number(result.insertId);
  }

  async assignRoleToUser({ userId, roleId, assignedByUserId = null }) {
    await this.db.query(`
      INSERT INTO user_roles (
        user_id,
        role_id,
        assigned_by_user_id
      ) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        assigned_by_user_id = VALUES(assigned_by_user_id),
        assigned_at = CURRENT_TIMESTAMP
    `, [userId, roleId, assignedByUserId]);
  }

  async updateLastLoginAt(userId) {
    await this.db.query(`
      UPDATE users
      SET last_login_at = NOW()
      WHERE id = ?
      LIMIT 1
    `, [userId]);
  }

  async getUserRoles(userId) {
    const [rows] = await this.db.query(`
      SELECT
        r.id,
        r.role_key,
        r.name,
        r.description,
        r.is_system,
        ur.assigned_at,
        ur.assigned_by_user_id
      FROM user_roles ur
      INNER JOIN roles r
        ON r.id = ur.role_id
      WHERE ur.user_id = ?
        AND r.deleted_at IS NULL
      ORDER BY r.is_system DESC, r.name ASC
    `, [userId]);

    return rows.map((row) => ({
      ...row,
      is_system: toBoolean(row.is_system)
    }));
  }

  async getEffectivePermissions(userId) {
    const [rolePermissionRows] = await this.db.query(`
      SELECT DISTINCT
        p.id,
        p.permission_key,
        p.module_key,
        p.action_key,
        p.name,
        p.description
      FROM user_roles ur
      INNER JOIN role_permissions rp
        ON rp.role_id = ur.role_id
      INNER JOIN permissions p
        ON p.id = rp.permission_id
      WHERE ur.user_id = ?
        AND p.deleted_at IS NULL
      ORDER BY p.permission_key ASC
    `, [userId]);

    const [userPermissionRows] = await this.db.query(`
      SELECT
        p.id,
        p.permission_key,
        p.module_key,
        p.action_key,
        p.name,
        p.description,
        up.granted
      FROM user_permissions up
      INNER JOIN permissions p
        ON p.id = up.permission_id
      WHERE up.user_id = ?
        AND p.deleted_at IS NULL
      ORDER BY p.permission_key ASC
    `, [userId]);

    const permissionMap = new Map(
      rolePermissionRows.map((permission) => [permission.permission_key, permission])
    );

    userPermissionRows.forEach((permission) => {
      if (toBoolean(permission.granted)) {
        permissionMap.set(permission.permission_key, {
          id: permission.id,
          permission_key: permission.permission_key,
          module_key: permission.module_key,
          action_key: permission.action_key,
          name: permission.name,
          description: permission.description
        });
        return;
      }

      permissionMap.delete(permission.permission_key);
    });

    return Array.from(permissionMap.values()).sort((left, right) => (
      left.permission_key.localeCompare(right.permission_key)
    ));
  }

  async getUserByIdWithAccess(userId) {
    const user = await this.findUserById(userId);
    if (!user || user.deleted_at) {
      return null;
    }

    const [roles, permissions] = await Promise.all([
      this.getUserRoles(userId),
      this.getEffectivePermissions(userId)
    ]);

    const { deleted_at: deletedAt, ...safeUser } = user;

    return {
      ...safeUser,
      roles,
      role_keys: roles.map((role) => role.role_key),
      primary_role_key: roles[0]?.role_key || null,
      permissions: permissions.map((permission) => permission.permission_key),
      permission_details: permissions
    };
  }

  async createRefreshToken({ userId, token, expiresAt }) {
    const [result] = await this.db.query(`
      INSERT INTO refresh_tokens (
        user_id,
        token,
        expires_at,
        last_used_at
      ) VALUES (?, ?, ?, NOW())
    `, [userId, token, expiresAt]);

    return Number(result.insertId);
  }

  async findRefreshToken(token) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        user_id,
        token,
        expires_at,
        last_used_at,
        revoked_at,
        revoked_reason,
        created_at
      FROM refresh_tokens
      WHERE token = ?
      LIMIT 1
    `, [token]);

    return rows[0] || null;
  }

  async touchRefreshToken(token) {
    await this.db.query(`
      UPDATE refresh_tokens
      SET last_used_at = NOW()
      WHERE token = ?
      LIMIT 1
    `, [token]);
  }

  async revokeRefreshToken(token, reason = 'revoked') {
    const [result] = await this.db.query(`
      UPDATE refresh_tokens
      SET
        revoked_at = COALESCE(revoked_at, NOW()),
        revoked_reason = COALESCE(revoked_reason, ?),
        last_used_at = NOW()
      WHERE token = ?
        AND revoked_at IS NULL
      LIMIT 1
    `, [reason, token]);

    return result.affectedRows > 0;
  }

  async revokeExpiredRefreshTokens() {
    const [result] = await this.db.query(`
      UPDATE refresh_tokens
      SET
        revoked_at = COALESCE(revoked_at, NOW()),
        revoked_reason = COALESCE(revoked_reason, 'expired')
      WHERE revoked_at IS NULL
        AND expires_at < NOW()
    `);

    return Number(result.affectedRows || 0);
  }
}
