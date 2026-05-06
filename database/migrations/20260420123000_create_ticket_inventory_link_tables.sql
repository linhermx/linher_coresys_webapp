CREATE TABLE IF NOT EXISTS ticket_asset_units (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT UNSIGNED NOT NULL,
  asset_unit_id BIGINT UNSIGNED NOT NULL,
  linked_by_user_id BIGINT UNSIGNED NULL,
  unlinked_by_user_id BIGINT UNSIGNED NULL,
  link_reason VARCHAR(255) NULL,
  unlink_reason VARCHAR(255) NULL,
  linked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unlinked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ticket_asset_units_ticket_id (ticket_id),
  KEY idx_ticket_asset_units_asset_unit_id (asset_unit_id),
  KEY idx_ticket_asset_units_linked_by_user_id (linked_by_user_id),
  KEY idx_ticket_asset_units_unlinked_by_user_id (unlinked_by_user_id),
  KEY idx_ticket_asset_units_linked_at (linked_at),
  KEY idx_ticket_asset_units_unlinked_at (unlinked_at),
  CONSTRAINT fk_ticket_asset_units_ticket_id
    FOREIGN KEY (ticket_id) REFERENCES tickets (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_ticket_asset_units_asset_unit_id
    FOREIGN KEY (asset_unit_id) REFERENCES asset_units (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_ticket_asset_units_linked_by_user_id
    FOREIGN KEY (linked_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_ticket_asset_units_unlinked_by_user_id
    FOREIGN KEY (unlinked_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_asset_stocks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT UNSIGNED NOT NULL,
  asset_id BIGINT UNSIGNED NOT NULL,
  inventory_movement_line_id BIGINT UNSIGNED NULL,
  action_key VARCHAR(40) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ticket_asset_stocks_ticket_id (ticket_id),
  KEY idx_ticket_asset_stocks_asset_id (asset_id),
  KEY idx_ticket_asset_stocks_inventory_movement_line_id (inventory_movement_line_id),
  KEY idx_ticket_asset_stocks_created_by_user_id (created_by_user_id),
  KEY idx_ticket_asset_stocks_action_key (action_key),
  KEY idx_ticket_asset_stocks_created_at (created_at),
  CONSTRAINT fk_ticket_asset_stocks_ticket_id
    FOREIGN KEY (ticket_id) REFERENCES tickets (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_ticket_asset_stocks_asset_id
    FOREIGN KEY (asset_id) REFERENCES assets (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_ticket_asset_stocks_inventory_movement_line_id
    FOREIGN KEY (inventory_movement_line_id) REFERENCES inventory_movement_lines (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_ticket_asset_stocks_created_by_user_id
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT chk_ticket_asset_stocks_quantity_positive CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
