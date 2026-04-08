INSERT INTO roles (
  role_key,
  name,
  description,
  is_system
) VALUES
  ('admin', 'Administrador', 'Acceso total al sistema.', 1),
  ('operator', 'Operador', 'Operación diaria del área de Sistemas.', 1),
  ('requester', 'Solicitante', 'Creación y seguimiento de solicitudes.', 1),
  ('viewer', 'Consulta', 'Consulta de información sin cambios.', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_system = VALUES(is_system),
  deleted_at = NULL;

INSERT INTO permissions (
  permission_key,
  module_key,
  action_key,
  name,
  description
) VALUES
  ('view', 'global', 'view', 'Ver', 'Permite consultar información.'),
  ('create', 'global', 'create', 'Crear', 'Permite registrar información nueva.'),
  ('update', 'global', 'update', 'Actualizar', 'Permite modificar información existente.'),
  ('delete', 'global', 'delete', 'Eliminar', 'Permite eliminar o desactivar registros.'),
  ('assign', 'global', 'assign', 'Asignar', 'Permite asignar recursos o responsables.'),
  ('view_sensitive', 'global', 'view_sensitive', 'Ver sensible', 'Permite consultar información sensible.')
ON DUPLICATE KEY UPDATE
  module_key = VALUES(module_key),
  action_key = VALUES(action_key),
  name = VALUES(name),
  description = VALUES(description),
  deleted_at = NULL;

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
  ON p.permission_key IN ('view', 'create', 'update', 'delete', 'assign', 'view_sensitive')
WHERE r.role_key = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
  ON p.permission_key IN ('view', 'create', 'update', 'assign')
WHERE r.role_key = 'operator';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
  ON p.permission_key IN ('view', 'create')
WHERE r.role_key = 'requester';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
  ON p.permission_key = 'view'
WHERE r.role_key = 'viewer';
