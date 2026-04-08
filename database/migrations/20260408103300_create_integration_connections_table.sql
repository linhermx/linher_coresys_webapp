CREATE TABLE IF NOT EXISTS integration_connections (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_key VARCHAR(80) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'disconnected',
  account_identifier VARCHAR(180) NULL,
  connected_by_user_id BIGINT UNSIGNED NULL,
  connected_at DATETIME NULL,
  disconnected_at DATETIME NULL,
  last_synced_at DATETIME NULL,
  last_error_at DATETIME NULL,
  last_error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_integration_connections_provider_key (provider_key),
  KEY idx_integration_connections_status (status),
  KEY idx_integration_connections_connected_by_user_id (connected_by_user_id),
  CONSTRAINT fk_integration_connections_connected_by_user_id
    FOREIGN KEY (connected_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
