import { BaseModel } from './BaseModel.js';

const toBoolean = (value) => value === true || value === 1 || value === '1';

const mapCollaboratorRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    employee_id: Number(row.employee_id),
    first_name: row.first_name,
    last_name: row.last_name,
    full_name: `${row.first_name} ${row.last_name}`.trim(),
    area_name: row.area_name,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    linked_user: row.linked_user_id ? {
      id: Number(row.linked_user_id),
      name: row.linked_user_name,
      email: row.linked_user_email,
      status: row.linked_user_status,
      must_change_password: toBoolean(row.linked_user_must_change_password)
    } : null
  };
};

export class CollaboratorModel extends BaseModel {
  constructor(db) {
    super('collaborators', db);
  }

  async list({ search = '', status = '', linked = '' } = {}) {
    let query = `
      SELECT
        c.id,
        c.employee_id,
        c.first_name,
        c.last_name,
        c.area_name,
        c.status,
        c.created_at,
        c.updated_at,
        u.id AS linked_user_id,
        u.name AS linked_user_name,
        u.email AS linked_user_email,
        u.status AS linked_user_status,
        u.must_change_password AS linked_user_must_change_password
      FROM collaborators c
      LEFT JOIN users u
        ON u.collaborator_id = c.id
        AND u.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
    `;

    const params = [];
    const normalizedSearch = String(search || '').trim();
    const normalizedStatus = String(status || '').trim().toLowerCase();
    const normalizedLinked = String(linked || '').trim().toLowerCase();

    if (normalizedSearch) {
      query += `
        AND (
          CAST(c.employee_id AS CHAR) LIKE ?
          OR c.first_name LIKE ?
          OR c.last_name LIKE ?
          OR CONCAT(c.first_name, ' ', c.last_name) LIKE ?
          OR COALESCE(c.area_name, '') LIKE ?
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
      query += ' AND c.status = ?';
      params.push(normalizedStatus);
    }

    if (normalizedLinked === 'linked') {
      query += ' AND u.id IS NOT NULL';
    }

    if (normalizedLinked === 'unlinked') {
      query += ' AND u.id IS NULL';
    }

    query += ' ORDER BY c.employee_id ASC';

    const [rows] = await this.db.query(query, params);
    return rows.map(mapCollaboratorRow);
  }

  async findById(collaboratorId) {
    const [rows] = await this.db.query(`
      SELECT
        c.id,
        c.employee_id,
        c.first_name,
        c.last_name,
        c.area_name,
        c.status,
        c.created_at,
        c.updated_at,
        u.id AS linked_user_id,
        u.name AS linked_user_name,
        u.email AS linked_user_email,
        u.status AS linked_user_status,
        u.must_change_password AS linked_user_must_change_password
      FROM collaborators c
      LEFT JOIN users u
        ON u.collaborator_id = c.id
        AND u.deleted_at IS NULL
      WHERE c.id = ?
        AND c.deleted_at IS NULL
      LIMIT 1
    `, [collaboratorId]);

    return mapCollaboratorRow(rows[0] || null);
  }

  async findByEmployeeId(employeeId) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        employee_id,
        first_name,
        last_name,
        area_name,
        status,
        created_at,
        updated_at
      FROM collaborators
      WHERE employee_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [employeeId]);

    return rows[0] || null;
  }

  async create({
    employeeId,
    firstName,
    lastName,
    areaName = null,
    status = 'active'
  }) {
    const [result] = await this.db.query(`
      INSERT INTO collaborators (
        employee_id,
        first_name,
        last_name,
        area_name,
        status
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      employeeId,
      firstName,
      lastName,
      areaName,
      status
    ]);

    return Number(result.insertId);
  }
}
