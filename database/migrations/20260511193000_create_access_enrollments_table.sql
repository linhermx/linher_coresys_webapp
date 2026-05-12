CREATE TABLE IF NOT EXISTS access_enrollments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  collaborator_id BIGINT UNSIGNED NOT NULL,
  access_system_id BIGINT UNSIGNED NOT NULL,
  media_assignment_id BIGINT UNSIGNED NULL,
  status_id BIGINT UNSIGNED NOT NULL,
  activated_at DATETIME NULL,
  deactivated_at DATETIME NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_access_enrollments_collaborator_id (collaborator_id),
  KEY idx_access_enrollments_access_system_id (access_system_id),
  KEY idx_access_enrollments_media_assignment_id (media_assignment_id),
  KEY idx_access_enrollments_status_id (status_id),
  KEY idx_access_enrollments_collaborator_system (collaborator_id, access_system_id),
  CONSTRAINT fk_access_enrollments_collaborator_id
    FOREIGN KEY (collaborator_id) REFERENCES collaborators (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_access_enrollments_access_system_id
    FOREIGN KEY (access_system_id) REFERENCES access_systems (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_access_enrollments_media_assignment_id
    FOREIGN KEY (media_assignment_id) REFERENCES access_media_assignments (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_access_enrollments_status_id
    FOREIGN KEY (status_id) REFERENCES access_enrollment_statuses (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
