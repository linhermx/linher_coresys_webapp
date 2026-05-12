CREATE TABLE IF NOT EXISTS access_media_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  access_media_id BIGINT UNSIGNED NOT NULL,
  collaborator_id BIGINT UNSIGNED NOT NULL,
  status_id BIGINT UNSIGNED NOT NULL,
  assigned_by_user_id BIGINT UNSIGNED NULL,
  received_by_user_id BIGINT UNSIGNED NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_return_at DATETIME NULL,
  returned_at DATETIME NULL,
  assignment_note VARCHAR(255) NULL,
  closure_note VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_access_media_assignments_access_media_id (access_media_id),
  KEY idx_access_media_assignments_collaborator_id (collaborator_id),
  KEY idx_access_media_assignments_status_id (status_id),
  KEY idx_access_media_assignments_assigned_by_user_id (assigned_by_user_id),
  KEY idx_access_media_assignments_received_by_user_id (received_by_user_id),
  KEY idx_access_media_assignments_assigned_at (assigned_at),
  CONSTRAINT fk_access_media_assignments_access_media_id
    FOREIGN KEY (access_media_id) REFERENCES access_media (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_access_media_assignments_collaborator_id
    FOREIGN KEY (collaborator_id) REFERENCES collaborators (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_access_media_assignments_status_id
    FOREIGN KEY (status_id) REFERENCES access_assignment_statuses (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_access_media_assignments_assigned_by_user_id
    FOREIGN KEY (assigned_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_access_media_assignments_received_by_user_id
    FOREIGN KEY (received_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
