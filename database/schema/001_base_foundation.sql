CREATE DATABASE IF NOT EXISTS linher_coresys
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE linher_coresys;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_key VARCHAR(64) NOT NULL,
  label VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_role_key (role_key)
);

CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  permission_key VARCHAR(120) NOT NULL,
  label VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_permission_key (permission_key)
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

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id BIGINT UNSIGNED NULL,
  actor_role VARCHAR(64) NULL,
  module_name VARCHAR(64) NOT NULL,
  action_key VARCHAR(120) NOT NULL,
  target_type VARCHAR(120) NULL,
  target_id VARCHAR(120) NULL,
  metadata JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_logs_module_name (module_name),
  KEY idx_audit_logs_action_key (action_key),
  KEY idx_audit_logs_created_at (created_at)
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
-- users
-- user_roles
-- tickets
-- assets
-- services
-- phone_lines
