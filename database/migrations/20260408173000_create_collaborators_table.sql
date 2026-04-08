CREATE TABLE IF NOT EXISTS collaborators (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id BIGINT UNSIGNED NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  area_name VARCHAR(120) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_collaborators_employee_id (employee_id),
  KEY idx_collaborators_status (status),
  KEY idx_collaborators_name (last_name, first_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users
  ADD COLUMN collaborator_id BIGINT UNSIGNED NULL AFTER photo_path,
  ADD CONSTRAINT uq_users_collaborator_id UNIQUE (collaborator_id),
  ADD CONSTRAINT fk_users_collaborator_id
    FOREIGN KEY (collaborator_id) REFERENCES collaborators (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;
