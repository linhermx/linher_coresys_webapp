ALTER TABLE roles
  ADD CONSTRAINT uq_roles_name UNIQUE (name);

ALTER TABLE users
  ADD COLUMN photo_path VARCHAR(500) NULL AFTER password_hash,
  ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER photo_path,
  ADD COLUMN password_changed_at TIMESTAMP NULL DEFAULT NULL AFTER must_change_password;

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  granted TINYINT(1) NOT NULL DEFAULT 1,
  granted_by_user_id BIGINT UNSIGNED NULL,
  granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, permission_id),
  KEY idx_user_permissions_permission_id (permission_id),
  KEY idx_user_permissions_granted_by_user_id (granted_by_user_id),
  CONSTRAINT fk_user_permissions_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_user_permissions_permission_id
    FOREIGN KEY (permission_id) REFERENCES permissions (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_user_permissions_granted_by_user_id
    FOREIGN KEY (granted_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(512) NOT NULL,
  expires_at DATETIME NOT NULL,
  last_used_at DATETIME NULL,
  revoked_at DATETIME NULL,
  revoked_reason VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_token (token),
  KEY idx_refresh_tokens_user_id (user_id),
  KEY idx_refresh_tokens_expires_at (expires_at),
  KEY idx_refresh_tokens_revoked_at (revoked_at),
  CONSTRAINT fk_refresh_tokens_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE audit_logs
  ADD COLUMN details JSON NULL AFTER after_snapshot;
