CREATE DATABASE IF NOT EXISTS linher_coresys
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE linher_coresys;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_key VARCHAR(64) NOT NULL,
  employee_code VARCHAR(32) NULL,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NULL,
  display_name VARCHAR(160) NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  timezone VARCHAR(64) NOT NULL DEFAULT 'America/Mexico_City',
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_user_key (user_key),
  UNIQUE KEY uq_users_employee_code (employee_code),
  UNIQUE KEY uq_users_email (email)
);

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_key VARCHAR(64) NOT NULL,
  label VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_role_key (role_key)
);

CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  resource_key VARCHAR(64) NOT NULL,
  action_key VARCHAR(32) NOT NULL,
  permission_key VARCHAR(120) NOT NULL,
  label VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_permission_key (permission_key),
  UNIQUE KEY uq_permissions_resource_action (resource_key, action_key)
);

CREATE TABLE IF NOT EXISTS user_roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  assigned_by BIGINT UNSIGNED NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_roles_user_role (user_id, role_id),
  KEY idx_user_roles_assigned_by (assigned_by),
  CONSTRAINT fk_user_roles_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_roles_role
    FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_user_roles_assigned_by
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_role_permissions_role_permission (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role
    FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_role_permissions_permission
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  session_token CHAR(64) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_sessions_session_token (session_token),
  KEY idx_auth_sessions_user_id (user_id),
  KEY idx_auth_sessions_expires_at (expires_at),
  CONSTRAINT fk_auth_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
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

INSERT IGNORE INTO roles (role_key, label, description, status)
VALUES
  ('admin_systems', 'Administrador de Systems', 'Acceso total a configuración, catálogos y operaciones.', 'active'),
  ('operator', 'Operador', 'Operación diaria sobre tickets, activos, servicios y telefonía.', 'active'),
  ('requester', 'Solicitante', 'Registro y seguimiento limitado de solicitudes propias.', 'active'),
  ('viewer', 'Consulta', 'Visualización de tableros y lectura limitada.', 'active');

INSERT IGNORE INTO permissions (resource_key, action_key, permission_key, label, description)
VALUES
  ('dashboard', 'view', 'dashboard.view', 'Ver dashboard', 'Consulta del panel operativo.'),
  ('tickets', 'view', 'tickets.view', 'Ver tickets', 'Consulta de tickets.'),
  ('tickets', 'create', 'tickets.create', 'Crear tickets', 'Alta de tickets.'),
  ('tickets', 'update', 'tickets.update', 'Actualizar tickets', 'Edición y cambios de tickets.'),
  ('tickets', 'assign', 'tickets.assign', 'Asignar tickets', 'Asignación de responsable.'),
  ('assets', 'view', 'assets.view', 'Ver activos', 'Consulta de inventario IT.'),
  ('assets', 'create', 'assets.create', 'Crear activos', 'Alta de activos.'),
  ('assets', 'update', 'assets.update', 'Actualizar activos', 'Edición de activos.'),
  ('assets', 'assign', 'assets.assign', 'Asignar activos', 'Resguardos y asignaciones.'),
  ('telephony', 'view', 'telephony.view', 'Ver telefonía', 'Consulta de líneas, SIMs y recargas.'),
  ('telephony', 'create', 'telephony.create', 'Registrar telefonía', 'Alta de líneas, SIMs o recargas.'),
  ('telephony', 'update', 'telephony.update', 'Actualizar telefonía', 'Edición de elementos de telefonía.'),
  ('services', 'view', 'services.view', 'Ver servicios', 'Consulta de servicios, pagos y renovaciones.'),
  ('services', 'create', 'services.create', 'Registrar servicios', 'Alta de servicios o renovaciones.'),
  ('services', 'update', 'services.update', 'Actualizar servicios', 'Edición de servicios o renovaciones.'),
  ('users', 'view', 'users.view', 'Ver usuarios', 'Consulta de usuarios del sistema.'),
  ('users', 'create', 'users.create', 'Crear usuarios', 'Alta de usuarios del sistema.'),
  ('users', 'update', 'users.update', 'Actualizar usuarios', 'Edición de usuarios del sistema.'),
  ('users', 'delete', 'users.delete', 'Eliminar usuarios', 'Baja lógica o eliminación autorizada.'),
  ('audit', 'view', 'audit.view', 'Ver auditoría', 'Consulta de trazabilidad operativa.'),
  ('accounts', 'view_sensitive', 'accounts.view_sensitive', 'Ver accesos sensibles', 'Consulta de cuentas técnicas sensibles.');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles
JOIN permissions
  ON roles.role_key = 'admin_systems'
  OR (
    roles.role_key = 'operator'
    AND permissions.permission_key IN (
      'dashboard.view',
      'tickets.view',
      'tickets.create',
      'tickets.update',
      'tickets.assign',
      'assets.view',
      'assets.create',
      'assets.update',
      'assets.assign',
      'telephony.view',
      'telephony.create',
      'telephony.update',
      'services.view',
      'services.create',
      'services.update',
      'users.view',
      'audit.view'
    )
  )
  OR (
    roles.role_key = 'requester'
    AND permissions.permission_key IN (
      'dashboard.view',
      'tickets.view',
      'tickets.create',
      'services.view'
    )
  )
  OR (
    roles.role_key = 'viewer'
    AND permissions.permission_key IN (
      'dashboard.view',
      'tickets.view',
      'assets.view',
      'telephony.view',
      'services.view'
    )
  );

-- Convenciones de nomenclatura para migraciones futuras:
-- - usar snake_case
-- - sin prefijos de sistema o branding
-- - tablas raíz en plural funcional: users, tickets, assets, services
-- - relaciones con patrón <entidad>_<entidad>: user_roles, role_permissions
-- - detalle con patrón <raiz>_<detalle>: ticket_comments, asset_assignments
-- - evitar nombres vagos como *_records, *_data, *_list o *_catalog si no describen una diferencia técnica real
-- - para telefonía, definir primero la entidad raíz y luego nombrarla: phone_lines, phone_extensions, phone_assignments, etc.
--
-- Tablas de dominio planeadas para migraciones futuras:
-- tickets
-- ticket_comments
-- ticket_events
-- assets
-- asset_assignments
-- services
-- service_renewals
-- phone_lines
-- sim_cards
-- recharge_events
