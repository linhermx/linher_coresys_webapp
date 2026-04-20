CREATE TABLE IF NOT EXISTS asset_tracking_modes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  mode_key VARCHAR(40) NOT NULL,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_asset_tracking_modes_mode_key (mode_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_key VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_asset_categories_category_key (category_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_types (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_category_id BIGINT UNSIGNED NOT NULL,
  type_key VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  default_tracking_mode_id BIGINT UNSIGNED NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_asset_types_type_key (type_key),
  KEY idx_asset_types_asset_category_id (asset_category_id),
  KEY idx_asset_types_default_tracking_mode_id (default_tracking_mode_id),
  CONSTRAINT fk_asset_types_asset_category_id
    FOREIGN KEY (asset_category_id) REFERENCES asset_categories (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_asset_types_default_tracking_mode_id
    FOREIGN KEY (default_tracking_mode_id) REFERENCES asset_tracking_modes (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_unit_statuses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  status_key VARCHAR(60) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  is_terminal TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_asset_unit_statuses_status_key (status_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS location_types (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  type_key VARCHAR(60) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_location_types_type_key (type_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS locations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  location_type_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  code VARCHAR(80) NULL,
  parent_location_id BIGINT UNSIGNED NULL,
  description VARCHAR(255) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_locations_code (code),
  KEY idx_locations_location_type_id (location_type_id),
  KEY idx_locations_parent_location_id (parent_location_id),
  KEY idx_locations_status (status),
  CONSTRAINT fk_locations_location_type_id
    FOREIGN KEY (location_type_id) REFERENCES location_types (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_locations_parent_location_id
    FOREIGN KEY (parent_location_id) REFERENCES locations (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_type_id BIGINT UNSIGNED NOT NULL,
  tracking_mode_id BIGINT UNSIGNED NOT NULL,
  asset_name VARCHAR(180) NOT NULL,
  internal_code VARCHAR(80) NULL,
  brand VARCHAR(120) NULL,
  model VARCHAR(120) NULL,
  min_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assets_internal_code (internal_code),
  KEY idx_assets_asset_type_id (asset_type_id),
  KEY idx_assets_tracking_mode_id (tracking_mode_id),
  KEY idx_assets_status (status),
  CONSTRAINT fk_assets_asset_type_id
    FOREIGN KEY (asset_type_id) REFERENCES asset_types (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_assets_tracking_mode_id
    FOREIGN KEY (tracking_mode_id) REFERENCES asset_tracking_modes (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_assets_min_quantity_non_negative CHECK (min_quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_units (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  asset_tag VARCHAR(80) NOT NULL,
  serial_number VARCHAR(120) NULL,
  asset_unit_status_id BIGINT UNSIGNED NOT NULL,
  current_location_id BIGINT UNSIGNED NULL,
  acquired_at DATE NULL,
  warranty_expires_at DATE NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_asset_units_asset_tag (asset_tag),
  UNIQUE KEY uq_asset_units_serial_number (serial_number),
  KEY idx_asset_units_asset_id (asset_id),
  KEY idx_asset_units_asset_unit_status_id (asset_unit_status_id),
  KEY idx_asset_units_current_location_id (current_location_id),
  CONSTRAINT fk_asset_units_asset_id
    FOREIGN KEY (asset_id) REFERENCES assets (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_asset_units_asset_unit_status_id
    FOREIGN KEY (asset_unit_status_id) REFERENCES asset_unit_statuses (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_asset_units_current_location_id
    FOREIGN KEY (current_location_id) REFERENCES locations (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_movement_types (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  movement_type_key VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  direction VARCHAR(20) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inventory_movement_types_movement_type_key (movement_type_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  movement_type_id BIGINT UNSIGNED NOT NULL,
  operator_id BIGINT UNSIGNED NULL,
  reason VARCHAR(255) NOT NULL,
  reference_type VARCHAR(80) NULL,
  reference_id BIGINT UNSIGNED NULL,
  happened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inventory_movements_movement_type_id (movement_type_id),
  KEY idx_inventory_movements_operator_id (operator_id),
  KEY idx_inventory_movements_reference (reference_type, reference_id),
  KEY idx_inventory_movements_happened_at (happened_at),
  CONSTRAINT fk_inventory_movements_movement_type_id
    FOREIGN KEY (movement_type_id) REFERENCES inventory_movement_types (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_inventory_movements_operator_id
    FOREIGN KEY (operator_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_movement_lines (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inventory_movement_id BIGINT UNSIGNED NOT NULL,
  asset_id BIGINT UNSIGNED NOT NULL,
  asset_unit_id BIGINT UNSIGNED NULL,
  quantity DECIMAL(12,2) NOT NULL,
  from_location_id BIGINT UNSIGNED NULL,
  to_location_id BIGINT UNSIGNED NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inventory_movement_lines_inventory_movement_id (inventory_movement_id),
  KEY idx_inventory_movement_lines_asset_id (asset_id),
  KEY idx_inventory_movement_lines_asset_unit_id (asset_unit_id),
  KEY idx_inventory_movement_lines_from_location_id (from_location_id),
  KEY idx_inventory_movement_lines_to_location_id (to_location_id),
  CONSTRAINT fk_inventory_movement_lines_inventory_movement_id
    FOREIGN KEY (inventory_movement_id) REFERENCES inventory_movements (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_inventory_movement_lines_asset_id
    FOREIGN KEY (asset_id) REFERENCES assets (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_inventory_movement_lines_asset_unit_id
    FOREIGN KEY (asset_unit_id) REFERENCES asset_units (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_inventory_movement_lines_from_location_id
    FOREIGN KEY (from_location_id) REFERENCES locations (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_inventory_movement_lines_to_location_id
    FOREIGN KEY (to_location_id) REFERENCES locations (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT chk_inventory_movement_lines_quantity_positive CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_unit_id BIGINT UNSIGNED NOT NULL,
  collaborator_id BIGINT UNSIGNED NOT NULL,
  assigned_by_user_id BIGINT UNSIGNED NULL,
  received_by_user_id BIGINT UNSIGNED NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_return_at DATETIME NULL,
  returned_at DATETIME NULL,
  delivery_condition VARCHAR(160) NULL,
  return_condition VARCHAR(160) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_asset_assignments_asset_unit_id (asset_unit_id),
  KEY idx_asset_assignments_collaborator_id (collaborator_id),
  KEY idx_asset_assignments_assigned_by_user_id (assigned_by_user_id),
  KEY idx_asset_assignments_received_by_user_id (received_by_user_id),
  KEY idx_asset_assignments_assigned_at (assigned_at),
  KEY idx_asset_assignments_status (status),
  CONSTRAINT fk_asset_assignments_asset_unit_id
    FOREIGN KEY (asset_unit_id) REFERENCES asset_units (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_asset_assignments_collaborator_id
    FOREIGN KEY (collaborator_id) REFERENCES collaborators (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_asset_assignments_assigned_by_user_id
    FOREIGN KEY (assigned_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_asset_assignments_received_by_user_id
    FOREIGN KEY (received_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NULL,
  asset_unit_id BIGINT UNSIGNED NULL,
  operator_id BIGINT UNSIGNED NULL,
  action_key VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  reason VARCHAR(255) NULL,
  before_snapshot JSON NULL,
  after_snapshot JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_asset_events_asset_id (asset_id),
  KEY idx_asset_events_asset_unit_id (asset_unit_id),
  KEY idx_asset_events_operator_id (operator_id),
  KEY idx_asset_events_entity (entity_type, entity_id),
  KEY idx_asset_events_created_at (created_at),
  CONSTRAINT fk_asset_events_asset_id
    FOREIGN KEY (asset_id) REFERENCES assets (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_asset_events_asset_unit_id
    FOREIGN KEY (asset_unit_id) REFERENCES asset_units (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_asset_events_operator_id
    FOREIGN KEY (operator_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
