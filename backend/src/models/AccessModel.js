import { BaseModel } from './BaseModel.js';

const normalizeLimit = (value, fallback = 50, max = 200) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
};

const normalizeSearch = (value) => String(value || '').trim();

export class AccessModel extends BaseModel {
  constructor(db) {
    super('access_media', db);
  }

  async getAccessSystemById(accessSystemId) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        system_key,
        name,
        description,
        status
      FROM access_systems
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [accessSystemId]);

    return rows[0] || null;
  }

  async getAccessSystemByKey(systemKey) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        system_key,
        name,
        description,
        status
      FROM access_systems
      WHERE system_key = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [systemKey]);

    return rows[0] || null;
  }

  async listAccessSystems() {
    const [rows] = await this.db.query(`
      SELECT
        id,
        system_key,
        name,
        description,
        status
      FROM access_systems
      WHERE deleted_at IS NULL
      ORDER BY name ASC
    `);

    return rows;
  }

  async getMediumTypeById(mediumTypeId) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        type_key,
        name,
        description
      FROM access_medium_types
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [mediumTypeId]);

    return rows[0] || null;
  }

  async getMediumTypeByKey(typeKey) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        type_key,
        name,
        description
      FROM access_medium_types
      WHERE type_key = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [typeKey]);

    return rows[0] || null;
  }

  async listMediumTypes() {
    const [rows] = await this.db.query(`
      SELECT
        id,
        type_key,
        name,
        description
      FROM access_medium_types
      WHERE deleted_at IS NULL
      ORDER BY name ASC
    `);

    return rows;
  }

  async getMediaStatusById(statusId) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        status_key,
        name,
        description,
        is_terminal
      FROM access_media_statuses
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [statusId]);

    return rows[0] || null;
  }

  async getMediaStatusByKey(statusKey) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        status_key,
        name,
        description,
        is_terminal
      FROM access_media_statuses
      WHERE status_key = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [statusKey]);

    return rows[0] || null;
  }

  async listMediaStatuses() {
    const [rows] = await this.db.query(`
      SELECT
        id,
        status_key,
        name,
        description,
        is_terminal
      FROM access_media_statuses
      WHERE deleted_at IS NULL
      ORDER BY name ASC
    `);

    return rows;
  }

  async getAssignmentStatusById(statusId) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        status_key,
        name,
        description,
        is_terminal
      FROM access_assignment_statuses
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [statusId]);

    return rows[0] || null;
  }

  async getAssignmentStatusByKey(statusKey) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        status_key,
        name,
        description,
        is_terminal
      FROM access_assignment_statuses
      WHERE status_key = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [statusKey]);

    return rows[0] || null;
  }

  async listAssignmentStatuses() {
    const [rows] = await this.db.query(`
      SELECT
        id,
        status_key,
        name,
        description,
        is_terminal
      FROM access_assignment_statuses
      WHERE deleted_at IS NULL
      ORDER BY name ASC
    `);

    return rows;
  }

  async getEnrollmentStatusById(statusId) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        status_key,
        name,
        description,
        is_terminal
      FROM access_enrollment_statuses
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [statusId]);

    return rows[0] || null;
  }

  async getEnrollmentStatusByKey(statusKey) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        status_key,
        name,
        description,
        is_terminal
      FROM access_enrollment_statuses
      WHERE status_key = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [statusKey]);

    return rows[0] || null;
  }

  async listEnrollmentStatuses() {
    const [rows] = await this.db.query(`
      SELECT
        id,
        status_key,
        name,
        description,
        is_terminal
      FROM access_enrollment_statuses
      WHERE deleted_at IS NULL
      ORDER BY name ASC
    `);

    return rows;
  }

  async getAccessMediaById(accessMediaId) {
    const [rows] = await this.db.query(`
      SELECT
        am.id,
        am.medium_type_id,
        amt.type_key AS medium_type_key,
        amt.name AS medium_type_name,
        am.status_id,
        ams.status_key,
        ams.name AS status_name,
        ams.is_terminal AS status_is_terminal,
        am.asset_unit_id,
        am.tag_code,
        am.notes,
        am.created_at,
        am.updated_at,
        au.asset_id,
        au.asset_tag,
        au.serial_number
      FROM access_media am
      INNER JOIN access_medium_types amt
        ON amt.id = am.medium_type_id
      INNER JOIN access_media_statuses ams
        ON ams.id = am.status_id
      INNER JOIN asset_units au
        ON au.id = am.asset_unit_id
      WHERE am.id = ?
        AND am.deleted_at IS NULL
      LIMIT 1
    `, [accessMediaId]);

    return rows[0] || null;
  }

  async getAccessMediaByTagCode(tagCode) {
    const [rows] = await this.db.query(`
      SELECT
        am.id,
        am.medium_type_id,
        amt.type_key AS medium_type_key,
        amt.name AS medium_type_name,
        am.status_id,
        ams.status_key,
        ams.name AS status_name,
        ams.is_terminal AS status_is_terminal,
        am.asset_unit_id,
        am.tag_code,
        am.notes,
        am.created_at,
        am.updated_at,
        au.asset_id,
        au.asset_tag,
        au.serial_number
      FROM access_media am
      INNER JOIN access_medium_types amt
        ON amt.id = am.medium_type_id
      INNER JOIN access_media_statuses ams
        ON ams.id = am.status_id
      INNER JOIN asset_units au
        ON au.id = am.asset_unit_id
      WHERE am.tag_code = ?
        AND am.deleted_at IS NULL
      LIMIT 1
    `, [tagCode]);

    return rows[0] || null;
  }

  async getAccessMediaByAssetUnitId(assetUnitId) {
    const [rows] = await this.db.query(`
      SELECT
        am.id,
        am.medium_type_id,
        amt.type_key AS medium_type_key,
        amt.name AS medium_type_name,
        am.status_id,
        ams.status_key,
        ams.name AS status_name,
        ams.is_terminal AS status_is_terminal,
        am.asset_unit_id,
        am.tag_code,
        am.notes,
        am.created_at,
        am.updated_at,
        au.asset_id,
        au.asset_tag,
        au.serial_number
      FROM access_media am
      INNER JOIN access_medium_types amt
        ON amt.id = am.medium_type_id
      INNER JOIN access_media_statuses ams
        ON ams.id = am.status_id
      INNER JOIN asset_units au
        ON au.id = am.asset_unit_id
      WHERE am.asset_unit_id = ?
        AND am.deleted_at IS NULL
      LIMIT 1
    `, [assetUnitId]);

    return rows[0] || null;
  }

  async listAccessMedia({ mediumTypeKey = '', statusKey = '', search = '' } = {}) {
    const normalizedMediumTypeKey = normalizeSearch(mediumTypeKey).toLowerCase();
    const normalizedStatusKey = normalizeSearch(statusKey).toLowerCase();
    const normalizedSearch = normalizeSearch(search);
    const params = [];

    let whereClause = 'WHERE am.deleted_at IS NULL';

    if (normalizedMediumTypeKey) {
      whereClause += ' AND amt.type_key = ?';
      params.push(normalizedMediumTypeKey);
    }

    if (normalizedStatusKey) {
      whereClause += ' AND ams.status_key = ?';
      params.push(normalizedStatusKey);
    }

    if (normalizedSearch) {
      whereClause += `
        AND (
          am.tag_code LIKE ?
          OR au.asset_tag LIKE ?
          OR COALESCE(au.serial_number, '') LIKE ?
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
        `%${normalizedSearch}%`,
        `%${normalizedSearch}%`
      );
    }

    const [rows] = await this.db.query(`
      SELECT
        am.id,
        am.medium_type_id,
        amt.type_key AS medium_type_key,
        amt.name AS medium_type_name,
        am.status_id,
        ams.status_key,
        ams.name AS status_name,
        ams.is_terminal AS status_is_terminal,
        am.asset_unit_id,
        am.tag_code,
        am.notes,
        am.created_at,
        am.updated_at,
        au.asset_id,
        au.asset_tag,
        au.serial_number,
        current_assignment.id AS active_assignment_id,
        current_assignment.assigned_at AS active_assignment_assigned_at,
        c.id AS active_collaborator_id,
        c.employee_id AS active_collaborator_employee_id,
        CONCAT(c.first_name, ' ', c.last_name) AS active_collaborator_name
      FROM access_media am
      INNER JOIN access_medium_types amt
        ON amt.id = am.medium_type_id
      INNER JOIN access_media_statuses ams
        ON ams.id = am.status_id
      INNER JOIN asset_units au
        ON au.id = am.asset_unit_id
      LEFT JOIN access_media_assignments current_assignment
        ON current_assignment.access_media_id = am.id
        AND current_assignment.deleted_at IS NULL
        AND current_assignment.status_id = (
          SELECT id
          FROM access_assignment_statuses
          WHERE status_key = 'active'
          LIMIT 1
        )
      LEFT JOIN collaborators c
        ON c.id = current_assignment.collaborator_id
      ${whereClause}
      ORDER BY am.created_at DESC, am.id DESC
    `, params);

    return rows;
  }

  async createAccessMedia(db, {
    mediumTypeId,
    statusId,
    assetUnitId,
    tagCode,
    notes = null
  }) {
    const [result] = await db.query(`
      INSERT INTO access_media (
        medium_type_id,
        status_id,
        asset_unit_id,
        tag_code,
        notes
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      mediumTypeId,
      statusId,
      assetUnitId,
      tagCode,
      notes
    ]);

    return Number(result.insertId);
  }

  async updateAccessMediaStatus(db, {
    accessMediaId,
    statusId,
    notes
  }) {
    const nextNotes = notes === undefined ? undefined : notes;
    const [result] = await db.query(`
      UPDATE access_media
      SET
        status_id = ?,
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND deleted_at IS NULL
    `, [
      statusId,
      nextNotes,
      accessMediaId
    ]);

    return result.affectedRows > 0;
  }

}
