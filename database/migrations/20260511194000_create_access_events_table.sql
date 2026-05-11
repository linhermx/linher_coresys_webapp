CREATE TABLE IF NOT EXISTS access_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_type VARCHAR(80) NOT NULL,
  operator_id BIGINT UNSIGNED NULL,
  collaborator_id BIGINT UNSIGNED NULL,
  access_system_id BIGINT UNSIGNED NULL,
  access_media_id BIGINT UNSIGNED NULL,
  access_media_assignment_id BIGINT UNSIGNED NULL,
  access_enrollment_id BIGINT UNSIGNED NULL,
  notes VARCHAR(255) NULL,
  happened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_access_events_event_type (event_type),
  KEY idx_access_events_operator_id (operator_id),
  KEY idx_access_events_collaborator_id (collaborator_id),
  KEY idx_access_events_access_system_id (access_system_id),
  KEY idx_access_events_access_media_id (access_media_id),
  KEY idx_access_events_access_media_assignment_id (access_media_assignment_id),
  KEY idx_access_events_access_enrollment_id (access_enrollment_id),
  KEY idx_access_events_happened_at (happened_at),
  CONSTRAINT fk_access_events_operator_id
    FOREIGN KEY (operator_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_access_events_collaborator_id
    FOREIGN KEY (collaborator_id) REFERENCES collaborators (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_access_events_access_system_id
    FOREIGN KEY (access_system_id) REFERENCES access_systems (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_access_events_access_media_id
    FOREIGN KEY (access_media_id) REFERENCES access_media (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_access_events_access_media_assignment_id
    FOREIGN KEY (access_media_assignment_id) REFERENCES access_media_assignments (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_access_events_access_enrollment_id
    FOREIGN KEY (access_enrollment_id) REFERENCES access_enrollments (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
