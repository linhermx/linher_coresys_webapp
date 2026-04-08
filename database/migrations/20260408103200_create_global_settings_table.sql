CREATE TABLE IF NOT EXISTS global_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(120) NOT NULL,
  setting_value TEXT NULL,
  value_type VARCHAR(40) NOT NULL DEFAULT 'string',
  description VARCHAR(255) NULL,
  updated_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_global_settings_setting_key (setting_key),
  KEY idx_global_settings_updated_by_user_id (updated_by_user_id),
  CONSTRAINT fk_global_settings_updated_by_user_id
    FOREIGN KEY (updated_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
