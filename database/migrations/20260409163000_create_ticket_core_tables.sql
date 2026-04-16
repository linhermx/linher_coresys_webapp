CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  folio VARCHAR(24) NOT NULL,
  title VARCHAR(220) NOT NULL,
  summary TEXT NOT NULL,
  status VARCHAR(40) NOT NULL,
  priority VARCHAR(40) NOT NULL,
  ticket_type VARCHAR(40) NOT NULL,
  category_key VARCHAR(80) NOT NULL,
  requester_user_id BIGINT UNSIGNED NOT NULL,
  requester_name VARCHAR(160) NOT NULL,
  requester_area VARCHAR(120) NOT NULL,
  assignee_user_id BIGINT UNSIGNED NULL,
  assignee_name VARCHAR(160) NULL,
  due_at DATETIME NULL,
  channel VARCHAR(80) NOT NULL DEFAULT 'Portal',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tickets_folio (folio),
  KEY idx_tickets_status (status),
  KEY idx_tickets_priority (priority),
  KEY idx_tickets_type (ticket_type),
  KEY idx_tickets_requester_user_id (requester_user_id),
  KEY idx_tickets_assignee_user_id (assignee_user_id),
  KEY idx_tickets_due_at (due_at),
  KEY idx_tickets_created_at (created_at),
  CONSTRAINT fk_tickets_requester_user_id
    FOREIGN KEY (requester_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_tickets_assignee_user_id
    FOREIGN KEY (assignee_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT UNSIGNED NOT NULL,
  event_title VARCHAR(220) NOT NULL,
  event_meta VARCHAR(220) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ticket_events_ticket_id (ticket_id),
  KEY idx_ticket_events_created_at (created_at),
  CONSTRAINT fk_ticket_events_ticket_id
    FOREIGN KEY (ticket_id) REFERENCES tickets (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_attachments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT UNSIGNED NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_label VARCHAR(40) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ticket_attachments_ticket_id (ticket_id),
  CONSTRAINT fk_ticket_attachments_ticket_id
    FOREIGN KEY (ticket_id) REFERENCES tickets (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT UNSIGNED NOT NULL,
  author_user_id BIGINT UNSIGNED NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_ticket_comments_ticket_id (ticket_id),
  KEY idx_ticket_comments_author_user_id (author_user_id),
  KEY idx_ticket_comments_created_at (created_at),
  CONSTRAINT fk_ticket_comments_ticket_id
    FOREIGN KEY (ticket_id) REFERENCES tickets (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_ticket_comments_author_user_id
    FOREIGN KEY (author_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
