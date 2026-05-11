CREATE TABLE IF NOT EXISTS access_media (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  medium_type_id BIGINT UNSIGNED NOT NULL,
  status_id BIGINT UNSIGNED NOT NULL,
  asset_unit_id BIGINT UNSIGNED NOT NULL,
  tag_code VARCHAR(80) NOT NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_access_media_asset_unit_id (asset_unit_id),
  UNIQUE KEY uq_access_media_tag_code (tag_code),
  KEY idx_access_media_medium_type_id (medium_type_id),
  KEY idx_access_media_status_id (status_id),
  CONSTRAINT fk_access_media_medium_type_id
    FOREIGN KEY (medium_type_id) REFERENCES access_medium_types (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_access_media_status_id
    FOREIGN KEY (status_id) REFERENCES access_media_statuses (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_access_media_asset_unit_id
    FOREIGN KEY (asset_unit_id) REFERENCES asset_units (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
