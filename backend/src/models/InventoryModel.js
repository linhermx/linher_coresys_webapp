import { BaseModel } from './BaseModel.js';

const normalizeLimit = (value, fallback = 50, max = 200) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
};

const normalizeSearch = (value) => String(value || '').trim();

export class InventoryModel extends BaseModel {
  constructor(db) {
    super('assets', db);
  }

  async getTrackingModeByKey(modeKey) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        mode_key,
        name
      FROM asset_tracking_modes
      WHERE mode_key = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [modeKey]);

    return rows[0] || null;
  }

  async getTrackingModeById(trackingModeId) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        mode_key,
        name
      FROM asset_tracking_modes
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [trackingModeId]);

    return rows[0] || null;
  }

  async getAssetCategoryById(assetCategoryId) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        category_key,
        name
      FROM asset_categories
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [assetCategoryId]);

    return rows[0] || null;
  }

  async getAssetTypeById(assetTypeId) {
    const [rows] = await this.db.query(`
      SELECT
        at.id,
        at.asset_category_id,
        ac.category_key,
        ac.name AS category_name,
        at.type_key,
        at.code_prefix,
        at.name,
        at.default_tracking_mode_id,
        atm.mode_key AS default_tracking_mode_key,
        atm.name AS default_tracking_mode_name,
        at.description,
        at.deleted_at
      FROM asset_types at
      INNER JOIN asset_categories ac
        ON ac.id = at.asset_category_id
      LEFT JOIN asset_tracking_modes atm
        ON atm.id = at.default_tracking_mode_id
      WHERE at.id = ?
      LIMIT 1
    `, [assetTypeId]);

    return rows[0] || null;
  }

  async getMovementTypeByKey(movementTypeKey) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        movement_type_key,
        name,
        direction
      FROM inventory_movement_types
      WHERE movement_type_key = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [movementTypeKey]);

    return rows[0] || null;
  }

  async getLocationById(locationId) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        location_type_id,
        name,
        code,
        parent_location_id,
        status
      FROM locations
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [locationId]);

    return rows[0] || null;
  }

  async getLocationTypeById(locationTypeId) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        type_key,
        code_prefix,
        name,
        description,
        deleted_at
      FROM location_types
      WHERE id = ?
      LIMIT 1
    `, [locationTypeId]);

    return rows[0] || null;
  }

  async getAssetUnitById(assetUnitId) {
    const [rows] = await this.db.query(`
      SELECT
        au.id,
        au.asset_id,
        au.asset_tag,
        au.serial_number,
        au.asset_unit_status_id,
        aus.status_key,
        au.current_location_id
      FROM asset_units au
      INNER JOIN asset_unit_statuses aus
        ON aus.id = au.asset_unit_status_id
      WHERE au.id = ?
        AND au.deleted_at IS NULL
      LIMIT 1
    `, [assetUnitId]);

    return rows[0] || null;
  }

  async listTrackingModes() {
    const [rows] = await this.db.query(`
      SELECT
        id,
        mode_key,
        name,
        description
      FROM asset_tracking_modes
      WHERE deleted_at IS NULL
      ORDER BY name ASC
    `);

    return rows;
  }

  async listAssetCategories() {
    const [rows] = await this.db.query(`
      SELECT
        id,
        category_key,
        name,
        description
      FROM asset_categories
      WHERE deleted_at IS NULL
      ORDER BY name ASC
    `);

    return rows;
  }

  async listAssetTypes({ includeInactive = false } = {}) {
    const whereClause = includeInactive
      ? 'WHERE ac.deleted_at IS NULL'
      : 'WHERE at.deleted_at IS NULL AND ac.deleted_at IS NULL';

    const [rows] = await this.db.query(`
      SELECT
        at.id,
        at.asset_category_id,
        ac.category_key,
        ac.name AS category_name,
        at.type_key,
        at.code_prefix,
        at.name,
        at.default_tracking_mode_id,
        atm.mode_key AS default_tracking_mode_key,
        atm.name AS default_tracking_mode_name,
        at.description,
        at.deleted_at
      FROM asset_types at
      INNER JOIN asset_categories ac
        ON ac.id = at.asset_category_id
      LEFT JOIN asset_tracking_modes atm
        ON atm.id = at.default_tracking_mode_id
      ${whereClause}
      ORDER BY ac.name ASC, at.name ASC
    `);

    return rows;
  }

  async listAssetUnitStatuses() {
    const [rows] = await this.db.query(`
      SELECT
        id,
        status_key,
        name,
        description,
        is_terminal
      FROM asset_unit_statuses
      WHERE deleted_at IS NULL
      ORDER BY name ASC
    `);

    return rows;
  }

  async listLocationTypes({ includeInactive = false } = {}) {
    const whereClause = includeInactive
      ? ''
      : 'WHERE deleted_at IS NULL';

    const [rows] = await this.db.query(`
      SELECT
        id,
        type_key,
        code_prefix,
        name,
        description,
        deleted_at
      FROM location_types
      ${whereClause}
      ORDER BY name ASC
    `);

    return rows;
  }

  async listMovementTypes() {
    const [rows] = await this.db.query(`
      SELECT
        id,
        movement_type_key,
        name,
        direction,
        description
      FROM inventory_movement_types
      WHERE deleted_at IS NULL
      ORDER BY name ASC
    `);

    return rows;
  }

  async listLocations({ status = '' } = {}) {
    const normalizedStatus = normalizeSearch(status).toLowerCase();
    const params = [];

    let whereClause = 'WHERE l.deleted_at IS NULL';
    if (normalizedStatus) {
      whereClause += ' AND l.status = ?';
      params.push(normalizedStatus);
    }

    const [rows] = await this.db.query(`
      SELECT
        l.id,
        l.location_type_id,
        lt.type_key AS location_type_key,
        lt.name AS location_type_name,
        l.name,
        l.code,
        l.parent_location_id,
        parent.name AS parent_location_name,
        l.description,
        l.status,
        l.created_at,
        l.updated_at
      FROM locations l
      INNER JOIN location_types lt
        ON lt.id = l.location_type_id
      LEFT JOIN locations parent
        ON parent.id = l.parent_location_id
      ${whereClause}
      ORDER BY l.name ASC
    `, params);

    return rows;
  }

  async createAssetType(db, {
    assetCategoryId,
    typeKey,
    codePrefix,
    name,
    defaultTrackingModeId,
    description = null
  }) {
    const [result] = await db.query(`
      INSERT INTO asset_types (
        asset_category_id,
        type_key,
        code_prefix,
        name,
        default_tracking_mode_id,
        description
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      assetCategoryId,
      typeKey,
      codePrefix,
      name,
      defaultTrackingModeId,
      description
    ]);

    return Number(result.insertId);
  }

  async updateAssetType(db, {
    assetTypeId,
    assetCategoryId,
    codePrefix,
    name,
    defaultTrackingModeId,
    description = null
  }) {
    const [result] = await db.query(`
      UPDATE asset_types
      SET
        asset_category_id = ?,
        code_prefix = ?,
        name = ?,
        default_tracking_mode_id = ?,
        description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      assetCategoryId,
      codePrefix,
      name,
      defaultTrackingModeId,
      description,
      assetTypeId
    ]);

    return result.affectedRows > 0;
  }

  async deactivateAssetType(db, assetTypeId) {
    const [result] = await db.query(`
      UPDATE asset_types
      SET
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND deleted_at IS NULL
    `, [assetTypeId]);

    return result.affectedRows > 0;
  }

  async reactivateAssetType(db, assetTypeId) {
    const [result] = await db.query(`
      UPDATE asset_types
      SET
        deleted_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND deleted_at IS NOT NULL
    `, [assetTypeId]);

    return result.affectedRows > 0;
  }

  async createLocationType(db, {
    typeKey,
    codePrefix,
    name,
    description = null
  }) {
    const [result] = await db.query(`
      INSERT INTO location_types (
        type_key,
        code_prefix,
        name,
        description
      ) VALUES (?, ?, ?, ?)
    `, [
      typeKey,
      codePrefix,
      name,
      description
    ]);

    return Number(result.insertId);
  }

  async updateLocationType(db, {
    locationTypeId,
    codePrefix,
    name,
    description = null
  }) {
    const [result] = await db.query(`
      UPDATE location_types
      SET
        code_prefix = ?,
        name = ?,
        description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      codePrefix,
      name,
      description,
      locationTypeId
    ]);

    return result.affectedRows > 0;
  }

  async deactivateLocationType(db, locationTypeId) {
    const [result] = await db.query(`
      UPDATE location_types
      SET
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND deleted_at IS NULL
    `, [locationTypeId]);

    return result.affectedRows > 0;
  }

  async reactivateLocationType(db, locationTypeId) {
    const [result] = await db.query(`
      UPDATE location_types
      SET
        deleted_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND deleted_at IS NOT NULL
    `, [locationTypeId]);

    return result.affectedRows > 0;
  }

  async findAssetTypeByName(name, { excludeId = null } = {}) {
    const params = [name];
    let query = `
      SELECT id
      FROM asset_types
      WHERE LOWER(name) = LOWER(?)
    `;

    if (excludeId) {
      query += ' AND id <> ?';
      params.push(excludeId);
    }

    query += ' LIMIT 1';
    const [rows] = await this.db.query(query, params);
    return rows[0] || null;
  }

  async findAssetTypeByCodePrefix(codePrefix, { excludeId = null } = {}) {
    const params = [codePrefix];
    let query = `
      SELECT id
      FROM asset_types
      WHERE code_prefix = ?
    `;

    if (excludeId) {
      query += ' AND id <> ?';
      params.push(excludeId);
    }

    query += ' LIMIT 1';
    const [rows] = await this.db.query(query, params);
    return rows[0] || null;
  }

  async findAssetTypeByTypeKey(typeKey, { excludeId = null } = {}) {
    const params = [typeKey];
    let query = `
      SELECT id
      FROM asset_types
      WHERE type_key = ?
    `;

    if (excludeId) {
      query += ' AND id <> ?';
      params.push(excludeId);
    }

    query += ' LIMIT 1';
    const [rows] = await this.db.query(query, params);
    return rows[0] || null;
  }

  async findLocationTypeByName(name, { excludeId = null } = {}) {
    const params = [name];
    let query = `
      SELECT id
      FROM location_types
      WHERE LOWER(name) = LOWER(?)
    `;

    if (excludeId) {
      query += ' AND id <> ?';
      params.push(excludeId);
    }

    query += ' LIMIT 1';
    const [rows] = await this.db.query(query, params);
    return rows[0] || null;
  }

  async findLocationTypeByCodePrefix(codePrefix, { excludeId = null } = {}) {
    const params = [codePrefix];
    let query = `
      SELECT id
      FROM location_types
      WHERE code_prefix = ?
    `;

    if (excludeId) {
      query += ' AND id <> ?';
      params.push(excludeId);
    }

    query += ' LIMIT 1';
    const [rows] = await this.db.query(query, params);
    return rows[0] || null;
  }

  async findLocationTypeByTypeKey(typeKey, { excludeId = null } = {}) {
    const params = [typeKey];
    let query = `
      SELECT id
      FROM location_types
      WHERE type_key = ?
    `;

    if (excludeId) {
      query += ' AND id <> ?';
      params.push(excludeId);
    }

    query += ' LIMIT 1';
    const [rows] = await this.db.query(query, params);
    return rows[0] || null;
  }

  async getAssetUnitStatusByKey(statusKey) {
    const [rows] = await this.db.query(`
      SELECT
        id,
        status_key,
        name,
        is_terminal
      FROM asset_unit_statuses
      WHERE status_key = ?
        AND deleted_at IS NULL
      LIMIT 1
    `, [statusKey]);

    return rows[0] || null;
  }

  async getActiveAssetAssignmentByUnitId(assetUnitId) {
    const [rows] = await this.db.query(`
      SELECT
        aa.id,
        aa.asset_unit_id,
        aa.collaborator_id,
        aa.assigned_by_user_id,
        aa.received_by_user_id,
        aa.assigned_at,
        aa.expected_return_at,
        aa.returned_at,
        aa.delivery_condition,
        aa.return_condition,
        aa.status,
        aa.notes
      FROM asset_assignments aa
      WHERE aa.asset_unit_id = ?
        AND aa.deleted_at IS NULL
        AND aa.status = 'active'
        AND aa.returned_at IS NULL
      ORDER BY aa.assigned_at DESC, aa.id DESC
      LIMIT 1
    `, [assetUnitId]);

    return rows[0] || null;
  }

  async getAssetAssignmentById(assignmentId) {
    const [rows] = await this.db.query(`
      SELECT
        aa.id,
        aa.asset_unit_id,
        aa.collaborator_id,
        aa.assigned_by_user_id,
        aa.received_by_user_id,
        aa.assigned_at,
        aa.expected_return_at,
        aa.returned_at,
        aa.delivery_condition,
        aa.return_condition,
        aa.status,
        aa.notes
      FROM asset_assignments aa
      WHERE aa.id = ?
        AND aa.deleted_at IS NULL
      LIMIT 1
    `, [assignmentId]);

    return rows[0] || null;
  }

  async closeAssetAssignment(db, {
    assignmentId,
    returnedAt,
    returnCondition = null,
    notes = null
  }) {
    const [result] = await db.query(`
      UPDATE asset_assignments
      SET
        returned_at = COALESCE(?, CURRENT_TIMESTAMP),
        return_condition = ?,
        notes = ?,
        status = 'closed',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND deleted_at IS NULL
        AND status = 'active'
    `, [
      returnedAt,
      returnCondition,
      notes,
      assignmentId
    ]);

    return result.affectedRows > 0;
  }

  async updateAssetUnit(db, {
    assetUnitId,
    assetUnitStatusId,
    currentLocationId = null,
    notes
  }) {
    const nextNotes = notes === undefined ? undefined : notes;
    const [result] = await db.query(`
      UPDATE asset_units
      SET
        asset_unit_status_id = ?,
        current_location_id = ?,
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND deleted_at IS NULL
    `, [
      assetUnitStatusId,
      currentLocationId,
      nextNotes,
      assetUnitId
    ]);

    return result.affectedRows > 0;
  }

  async getLastAssetInternalCodeByType(assetTypeId) {
    const [rows] = await this.db.query(`
      SELECT internal_code
      FROM assets
      WHERE asset_type_id = ?
        AND internal_code IS NOT NULL
        AND deleted_at IS NULL
      ORDER BY id DESC
      LIMIT 1
    `, [assetTypeId]);

    return rows[0]?.internal_code || null;
  }

  async getLastAssetTagByAsset(assetId) {
    const [rows] = await this.db.query(`
      SELECT asset_tag
      FROM asset_units
      WHERE asset_id = ?
        AND asset_tag IS NOT NULL
        AND deleted_at IS NULL
      ORDER BY id DESC
      LIMIT 1
    `, [assetId]);

    return rows[0]?.asset_tag || null;
  }

  async findLocationByCode(code, { excludeLocationId = null } = {}) {
    const params = [code];
    let query = `
      SELECT id
      FROM locations
      WHERE code = ?
        AND deleted_at IS NULL
    `;

    if (excludeLocationId) {
      query += ' AND id <> ?';
      params.push(excludeLocationId);
    }

    query += ' LIMIT 1';
    const [rows] = await this.db.query(query, params);
    return rows[0] || null;
  }

  async listAssets({ trackingModeKey = '', status = '', search = '' } = {}) {
    const normalizedTrackingModeKey = normalizeSearch(trackingModeKey).toLowerCase();
    const normalizedStatus = normalizeSearch(status).toLowerCase();
    const normalizedSearch = normalizeSearch(search);
    const params = [];

    let whereClause = 'WHERE a.deleted_at IS NULL';

    if (normalizedTrackingModeKey) {
      whereClause += ' AND atm.mode_key = ?';
      params.push(normalizedTrackingModeKey);
    }

    if (normalizedStatus) {
      whereClause += ' AND a.status = ?';
      params.push(normalizedStatus);
    }

    if (normalizedSearch) {
      whereClause += `
        AND (
          a.asset_name LIKE ?
          OR a.internal_code LIKE ?
          OR at.name LIKE ?
          OR ac.name LIKE ?
        )
      `;

      params.push(
        `%${normalizedSearch}%`,
        `%${normalizedSearch}%`,
        `%${normalizedSearch}%`,
        `%${normalizedSearch}%`
      );
    }

    const [rows] = await this.db.query(`
      SELECT
        a.id,
        a.asset_type_id,
        at.type_key,
        at.name AS type_name,
        ac.id AS asset_category_id,
        ac.category_key,
        ac.name AS category_name,
        a.tracking_mode_id,
        atm.mode_key AS tracking_mode_key,
        atm.name AS tracking_mode_name,
        a.asset_name,
        a.internal_code,
        a.brand,
        a.model,
        a.min_quantity,
        a.status,
        a.description,
        a.created_at,
        a.updated_at,
        COALESCE(unit_stats.units_count, 0) AS units_count,
        COALESCE(stock_stats.stock_quantity, 0) AS stock_quantity
      FROM assets a
      INNER JOIN asset_types at
        ON at.id = a.asset_type_id
      INNER JOIN asset_categories ac
        ON ac.id = at.asset_category_id
      INNER JOIN asset_tracking_modes atm
        ON atm.id = a.tracking_mode_id
      LEFT JOIN (
        SELECT
          au.asset_id,
          COUNT(*) AS units_count
        FROM asset_units au
        WHERE au.deleted_at IS NULL
        GROUP BY au.asset_id
      ) unit_stats
        ON unit_stats.asset_id = a.id
      LEFT JOIN (
        SELECT
          iml.asset_id,
          SUM(
            CASE
              WHEN imt.direction = 'in' THEN iml.quantity
              WHEN imt.direction = 'out' THEN -iml.quantity
              WHEN imt.direction IN ('transfer', 'adjustment') THEN
                CASE
                  WHEN iml.from_location_id IS NULL AND iml.to_location_id IS NOT NULL THEN iml.quantity
                  WHEN iml.from_location_id IS NOT NULL AND iml.to_location_id IS NULL THEN -iml.quantity
                  ELSE 0
                END
              ELSE 0
            END
          ) AS stock_quantity
        FROM inventory_movement_lines iml
        INNER JOIN inventory_movements im
          ON im.id = iml.inventory_movement_id
        INNER JOIN inventory_movement_types imt
          ON imt.id = im.movement_type_id
        GROUP BY iml.asset_id
      ) stock_stats
        ON stock_stats.asset_id = a.id
      ${whereClause}
      ORDER BY a.created_at DESC, a.id DESC
    `, params);

    return rows;
  }

  async getAssetById(assetId) {
    const [rows] = await this.db.query(`
      SELECT
        a.id,
        a.asset_type_id,
        at.type_key,
        at.name AS type_name,
        ac.id AS asset_category_id,
        ac.category_key,
        ac.name AS category_name,
        a.tracking_mode_id,
        atm.mode_key AS tracking_mode_key,
        atm.name AS tracking_mode_name,
        a.asset_name,
        a.internal_code,
        a.brand,
        a.model,
        a.min_quantity,
        a.status,
        a.description,
        a.created_at,
        a.updated_at
      FROM assets a
      INNER JOIN asset_types at
        ON at.id = a.asset_type_id
      INNER JOIN asset_categories ac
        ON ac.id = at.asset_category_id
      INNER JOIN asset_tracking_modes atm
        ON atm.id = a.tracking_mode_id
      WHERE a.id = ?
        AND a.deleted_at IS NULL
      LIMIT 1
    `, [assetId]);

    return rows[0] || null;
  }

  async listAssetUnits(assetId) {
    const [rows] = await this.db.query(`
      SELECT
        au.id,
        au.asset_id,
        au.asset_tag,
        au.serial_number,
        au.asset_unit_status_id,
        aus.status_key,
        aus.name AS status_name,
        au.current_location_id,
        l.name AS current_location_name,
        au.acquired_at,
        au.warranty_expires_at,
        au.notes,
        au.created_at,
        au.updated_at
      FROM asset_units au
      INNER JOIN asset_unit_statuses aus
        ON aus.id = au.asset_unit_status_id
      LEFT JOIN locations l
        ON l.id = au.current_location_id
      WHERE au.asset_id = ?
        AND au.deleted_at IS NULL
      ORDER BY au.created_at DESC, au.id DESC
    `, [assetId]);

    return rows;
  }

  async listInventoryMovementsByAsset(assetId, { limit = 50 } = {}) {
    const safeLimit = normalizeLimit(limit);
    const [rows] = await this.db.query(`
      SELECT
        im.id,
        im.movement_type_id,
        imt.movement_type_key,
        imt.name AS movement_type_name,
        imt.direction,
        im.operator_id,
        u.name AS operator_name,
        im.reason,
        im.reference_type,
        im.reference_id,
        im.happened_at,
        im.created_at,
        iml.id AS movement_line_id,
        iml.asset_unit_id,
        iml.quantity,
        iml.from_location_id,
        from_loc.name AS from_location_name,
        iml.to_location_id,
        to_loc.name AS to_location_name,
        iml.notes AS movement_line_notes
      FROM inventory_movement_lines iml
      INNER JOIN inventory_movements im
        ON im.id = iml.inventory_movement_id
      INNER JOIN inventory_movement_types imt
        ON imt.id = im.movement_type_id
      LEFT JOIN users u
        ON u.id = im.operator_id
      LEFT JOIN locations from_loc
        ON from_loc.id = iml.from_location_id
      LEFT JOIN locations to_loc
        ON to_loc.id = iml.to_location_id
      WHERE iml.asset_id = ?
      ORDER BY im.happened_at DESC, im.id DESC, iml.id DESC
      LIMIT ?
    `, [assetId, safeLimit]);

    return rows;
  }

  async listInventoryMovements({ limit = 80 } = {}) {
    const safeLimit = normalizeLimit(limit, 80, 300);
    const [rows] = await this.db.query(`
      SELECT
        im.id,
        im.movement_type_id,
        imt.movement_type_key,
        imt.name AS movement_type_name,
        imt.direction,
        im.operator_id,
        u.name AS operator_name,
        im.reason,
        im.reference_type,
        im.reference_id,
        im.happened_at,
        im.created_at,
        iml.id AS movement_line_id,
        iml.asset_id,
        a.asset_name,
        iml.asset_unit_id,
        iml.quantity,
        iml.from_location_id,
        from_loc.name AS from_location_name,
        iml.to_location_id,
        to_loc.name AS to_location_name,
        iml.notes AS movement_line_notes
      FROM inventory_movement_lines iml
      INNER JOIN inventory_movements im
        ON im.id = iml.inventory_movement_id
      INNER JOIN inventory_movement_types imt
        ON imt.id = im.movement_type_id
      INNER JOIN assets a
        ON a.id = iml.asset_id
      LEFT JOIN users u
        ON u.id = im.operator_id
      LEFT JOIN locations from_loc
        ON from_loc.id = iml.from_location_id
      LEFT JOIN locations to_loc
        ON to_loc.id = iml.to_location_id
      ORDER BY im.happened_at DESC, im.id DESC, iml.id DESC
      LIMIT ?
    `, [safeLimit]);

    return rows;
  }

  async listAssetAssignmentsByUnit(assetUnitId) {
    const [rows] = await this.db.query(`
      SELECT
        aa.id,
        aa.asset_unit_id,
        aa.collaborator_id,
        c.employee_id,
        c.first_name,
        c.last_name,
        c.area_name,
        aa.assigned_by_user_id,
        assigned_user.name AS assigned_by_user_name,
        aa.received_by_user_id,
        received_user.name AS received_by_user_name,
        aa.assigned_at,
        aa.expected_return_at,
        aa.returned_at,
        aa.delivery_condition,
        aa.return_condition,
        aa.status,
        aa.notes,
        aa.created_at,
        aa.updated_at
      FROM asset_assignments aa
      INNER JOIN collaborators c
        ON c.id = aa.collaborator_id
      LEFT JOIN users assigned_user
        ON assigned_user.id = aa.assigned_by_user_id
      LEFT JOIN users received_user
        ON received_user.id = aa.received_by_user_id
      WHERE aa.asset_unit_id = ?
        AND aa.deleted_at IS NULL
      ORDER BY aa.assigned_at DESC, aa.id DESC
    `, [assetUnitId]);

    return rows;
  }

  async createAsset(db, {
    assetTypeId,
    trackingModeId,
    assetName,
    internalCode = null,
    brand = null,
    model = null,
    minQuantity = 0,
    status = 'active',
    description = null
  }) {
    const [result] = await db.query(`
      INSERT INTO assets (
        asset_type_id,
        tracking_mode_id,
        asset_name,
        internal_code,
        brand,
        model,
        min_quantity,
        status,
        description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      assetTypeId,
      trackingModeId,
      assetName,
      internalCode,
      brand,
      model,
      minQuantity,
      status,
      description
    ]);

    return Number(result.insertId);
  }

  async createLocation(db, {
    locationTypeId,
    name,
    code = null,
    parentLocationId = null,
    description = null,
    status = 'active'
  }) {
    const [result] = await db.query(`
      INSERT INTO locations (
        location_type_id,
        name,
        code,
        parent_location_id,
        description,
        status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      locationTypeId,
      name,
      code,
      parentLocationId,
      description,
      status
    ]);

    return Number(result.insertId);
  }

  async updateLocation(db, {
    locationId,
    locationTypeId,
    name,
    code = null,
    parentLocationId = null,
    description = null,
    status = 'active'
  }) {
    const [result] = await db.query(`
      UPDATE locations
      SET
        location_type_id = ?,
        name = ?,
        code = ?,
        parent_location_id = ?,
        description = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND deleted_at IS NULL
    `, [
      locationTypeId,
      name,
      code,
      parentLocationId,
      description,
      status,
      locationId
    ]);

    return result.affectedRows > 0;
  }

  async createAssetUnit(db, {
    assetId,
    assetTag,
    serialNumber = null,
    assetUnitStatusId,
    currentLocationId = null,
    acquiredAt = null,
    warrantyExpiresAt = null,
    notes = null
  }) {
    const [result] = await db.query(`
      INSERT INTO asset_units (
        asset_id,
        asset_tag,
        serial_number,
        asset_unit_status_id,
        current_location_id,
        acquired_at,
        warranty_expires_at,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      assetId,
      assetTag,
      serialNumber,
      assetUnitStatusId,
      currentLocationId,
      acquiredAt,
      warrantyExpiresAt,
      notes
    ]);

    return Number(result.insertId);
  }

  async createInventoryMovement(db, {
    movementTypeId,
    operatorId = null,
    reason,
    referenceType = null,
    referenceId = null,
    happenedAt = null
  }) {
    const [result] = await db.query(`
      INSERT INTO inventory_movements (
        movement_type_id,
        operator_id,
        reason,
        reference_type,
        reference_id,
        happened_at
      ) VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
    `, [
      movementTypeId,
      operatorId,
      reason,
      referenceType,
      referenceId,
      happenedAt
    ]);

    return Number(result.insertId);
  }

  async createInventoryMovementLine(db, {
    inventoryMovementId,
    assetId,
    assetUnitId = null,
    quantity,
    fromLocationId = null,
    toLocationId = null,
    notes = null
  }) {
    const [result] = await db.query(`
      INSERT INTO inventory_movement_lines (
        inventory_movement_id,
        asset_id,
        asset_unit_id,
        quantity,
        from_location_id,
        to_location_id,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      inventoryMovementId,
      assetId,
      assetUnitId,
      quantity,
      fromLocationId,
      toLocationId,
      notes
    ]);

    return Number(result.insertId);
  }

  async createAssetAssignment(db, {
    assetUnitId,
    collaboratorId,
    assignedByUserId = null,
    receivedByUserId = null,
    assignedAt = null,
    expectedReturnAt = null,
    returnedAt = null,
    deliveryCondition = null,
    returnCondition = null,
    status = 'active',
    notes = null
  }) {
    const [result] = await db.query(`
      INSERT INTO asset_assignments (
        asset_unit_id,
        collaborator_id,
        assigned_by_user_id,
        received_by_user_id,
        assigned_at,
        expected_return_at,
        returned_at,
        delivery_condition,
        return_condition,
        status,
        notes
      ) VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?, ?, ?, ?)
    `, [
      assetUnitId,
      collaboratorId,
      assignedByUserId,
      receivedByUserId,
      assignedAt,
      expectedReturnAt,
      returnedAt,
      deliveryCondition,
      returnCondition,
      status,
      notes
    ]);

    return Number(result.insertId);
  }

  async createAssetEvent(db, {
    assetId = null,
    assetUnitId = null,
    operatorId = null,
    actionKey,
    entityType,
    entityId = null,
    reason = null,
    beforeSnapshot = null,
    afterSnapshot = null
  }) {
    const [result] = await db.query(`
      INSERT INTO asset_events (
        asset_id,
        asset_unit_id,
        operator_id,
        action_key,
        entity_type,
        entity_id,
        reason,
        before_snapshot,
        after_snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      assetId,
      assetUnitId,
      operatorId,
      actionKey,
      entityType,
      entityId,
      reason,
      beforeSnapshot ? JSON.stringify(beforeSnapshot) : null,
      afterSnapshot ? JSON.stringify(afterSnapshot) : null
    ]);

    return Number(result.insertId);
  }
}
