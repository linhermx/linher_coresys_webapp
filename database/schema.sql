USE linher_coresys;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_name (name)
);

CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_slug (slug)
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id BIGINT UNSIGNED NULL,
  photo_path VARCHAR(255) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_id (role_id),
  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role
    FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_role_permissions_permission
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  granted TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, permission_id),
  CONSTRAINT fk_user_permissions_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_permissions_permission
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(512) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_token (token),
  KEY idx_refresh_tokens_user_id (user_id),
  KEY idx_refresh_tokens_expires_at (expires_at),
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  operator_id BIGINT UNSIGNED NULL,
  operator_role VARCHAR(64) NULL,
  module_name VARCHAR(64) NOT NULL,
  action_key VARCHAR(120) NOT NULL,
  entity_name VARCHAR(120) NOT NULL,
  entity_id VARCHAR(120) NULL,
  before_snapshot JSON NULL,
  after_snapshot JSON NULL,
  metadata JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_logs_operator_id (operator_id),
  KEY idx_audit_logs_module_name (module_name),
  KEY idx_audit_logs_action_key (action_key),
  KEY idx_audit_logs_created_at (created_at),
  CONSTRAINT fk_audit_logs_operator
    FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS employees (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_key VARCHAR(64) NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  external_employee_code VARCHAR(32) NULL,
  display_name VARCHAR(160) NOT NULL,
  department_name VARCHAR(120) NULL,
  work_area VARCHAR(120) NULL,
  requires_physical_access TINYINT(1) NOT NULL DEFAULT 0,
  notes VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employees_employee_key (employee_key),
  UNIQUE KEY uq_employees_external_employee_code (external_employee_code),
  UNIQUE KEY uq_employees_user_id (user_id),
  KEY idx_employees_status (status),
  CONSTRAINT fk_employees_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS employee_operational_ids (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id BIGINT UNSIGNED NOT NULL,
  operational_id VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  assigned_by BIGINT UNSIGNED NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employee_operational_ids_operational_id (operational_id),
  KEY idx_employee_operational_ids_employee_id (employee_id),
  KEY idx_employee_operational_ids_status (status),
  CONSTRAINT fk_employee_operational_ids_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id),
  CONSTRAINT fk_employee_operational_ids_assigned_by
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS access_media_types (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_access_media_types_name (name)
);

CREATE TABLE IF NOT EXISTS access_media_statuses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_access_media_statuses_name (name)
);

CREATE TABLE IF NOT EXISTS access_media (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  access_media_type_id BIGINT UNSIGNED NOT NULL,
  access_media_status_id BIGINT UNSIGNED NOT NULL,
  media_code VARCHAR(64) NOT NULL,
  access_scope VARCHAR(64) NOT NULL DEFAULT 'bathroom',
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_access_media_media_code (media_code),
  KEY idx_access_media_status (access_media_status_id),
  KEY idx_access_media_type (access_media_type_id),
  CONSTRAINT fk_access_media_type
    FOREIGN KEY (access_media_type_id) REFERENCES access_media_types(id),
  CONSTRAINT fk_access_media_status
    FOREIGN KEY (access_media_status_id) REFERENCES access_media_statuses(id)
);

CREATE TABLE IF NOT EXISTS access_media_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  access_media_id BIGINT UNSIGNED NOT NULL,
  employee_id BIGINT UNSIGNED NOT NULL,
  assigned_by BIGINT UNSIGNED NULL,
  assignment_status VARCHAR(32) NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  released_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_access_media_assignments_media_id (access_media_id),
  KEY idx_access_media_assignments_employee_id (employee_id),
  KEY idx_access_media_assignments_status (assignment_status),
  CONSTRAINT fk_access_media_assignments_media
    FOREIGN KEY (access_media_id) REFERENCES access_media(id),
  CONSTRAINT fk_access_media_assignments_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id),
  CONSTRAINT fk_access_media_assignments_assigned_by
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ticket_statuses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ticket_statuses_name (name)
);

CREATE TABLE IF NOT EXISTS ticket_priorities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ticket_priorities_name (name)
);

CREATE TABLE IF NOT EXISTS ticket_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ticket_categories_name (name)
);

CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  folio VARCHAR(24) NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  ticket_status_id BIGINT UNSIGNED NOT NULL,
  ticket_priority_id BIGINT UNSIGNED NOT NULL,
  ticket_category_id BIGINT UNSIGNED NULL,
  requester_name VARCHAR(120) NOT NULL,
  requester_email VARCHAR(120) NULL,
  requester_area VARCHAR(120) NULL,
  assignee_user_id BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NULL,
  due_at DATETIME NULL,
  resolved_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tickets_folio (folio),
  KEY idx_tickets_status_id (ticket_status_id),
  KEY idx_tickets_priority_id (ticket_priority_id),
  KEY idx_tickets_category_id (ticket_category_id),
  KEY idx_tickets_assignee_user_id (assignee_user_id),
  KEY idx_tickets_created_by (created_by),
  KEY idx_tickets_due_at (due_at),
  CONSTRAINT fk_tickets_status
    FOREIGN KEY (ticket_status_id) REFERENCES ticket_statuses(id),
  CONSTRAINT fk_tickets_priority
    FOREIGN KEY (ticket_priority_id) REFERENCES ticket_priorities(id),
  CONSTRAINT fk_tickets_category
    FOREIGN KEY (ticket_category_id) REFERENCES ticket_categories(id),
  CONSTRAINT fk_tickets_assignee
    FOREIGN KEY (assignee_user_id) REFERENCES users(id),
  CONSTRAINT fk_tickets_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ticket_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT UNSIGNED NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(64) NOT NULL,
  message VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ticket_events_ticket_id (ticket_id),
  KEY idx_ticket_events_actor_user_id (actor_user_id),
  KEY idx_ticket_events_event_type (event_type),
  CONSTRAINT fk_ticket_events_ticket
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_ticket_events_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

-- Convenciones para siguientes dominios:
-- - usar snake_case
-- - sin prefijos de sistema o branding
-- - relaciones con patrón <entidad>_<entidad>
-- - detalle con patrón <raiz>_<detalle>
-- - evitar nombres vagos como *_records, *_data, *_list o *_catalog
