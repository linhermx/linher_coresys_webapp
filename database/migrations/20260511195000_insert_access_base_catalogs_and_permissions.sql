INSERT INTO access_systems (
  system_key,
  name,
  description,
  status
) VALUES
  ('production', 'Producción', 'Alta operativa para checador o acceso en producción.', 'active'),
  ('offices', 'Oficinas', 'Alta operativa para oficinas.', 'active'),
  ('bathroom', 'Baño', 'Alta operativa para control de acceso a baño.', 'active'),
  ('admin', 'Administración', 'Alta operativa para accesos administrativos.', 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  status = VALUES(status),
  deleted_at = NULL;

INSERT INTO access_medium_types (
  type_key,
  name,
  description
) VALUES
  ('chip', 'Chip', 'Chip físico de acceso.'),
  ('card', 'Tarjeta', 'Tarjeta física de acceso.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  deleted_at = NULL;

INSERT INTO access_media_statuses (
  status_key,
  name,
  description,
  is_terminal
) VALUES
  ('available', 'Disponible', 'Medio disponible para asignación.', 0),
  ('assigned', 'Asignado', 'Medio actualmente entregado a una persona.', 0),
  ('not_returned', 'No devuelto', 'Medio no devuelto en baja y perdido para reutilización.', 1),
  ('blocked', 'Bloqueado', 'Medio bloqueado temporalmente.', 0),
  ('retired', 'Baja', 'Medio retirado definitivamente.', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_terminal = VALUES(is_terminal),
  deleted_at = NULL;

INSERT INTO access_assignment_statuses (
  status_key,
  name,
  description,
  is_terminal
) VALUES
  ('active', 'Activa', 'Asignación vigente del medio.', 0),
  ('returned', 'Devuelto', 'Asignación cerrada con devolución física.', 1),
  ('not_returned', 'No devuelto', 'Asignación cerrada sin devolución física.', 1),
  ('cancelled', 'Cancelada', 'Asignación cancelada sin efecto operativo.', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_terminal = VALUES(is_terminal),
  deleted_at = NULL;

INSERT INTO access_enrollment_statuses (
  status_key,
  name,
  description,
  is_terminal
) VALUES
  ('pending', 'Pendiente', 'Alta pendiente de activar en el sistema de acceso.', 0),
  ('active', 'Activo', 'Alta vigente en el sistema de acceso.', 0),
  ('suspended', 'Suspendido', 'Alta suspendida temporalmente.', 0),
  ('deactivated', 'Desactivado', 'Alta dada de baja.', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_terminal = VALUES(is_terminal),
  deleted_at = NULL;

INSERT INTO permissions (
  permission_key,
  module_key,
  action_key,
  name,
  description
) VALUES
  ('access.view', 'access', 'view', 'Ver accesos', 'Permite consultar medios, altas e historial de accesos.'),
  ('access.create', 'access', 'create', 'Crear accesos', 'Permite registrar medios y altas de acceso.'),
  ('access.update', 'access', 'update', 'Actualizar accesos', 'Permite actualizar datos operativos del módulo de accesos.'),
  ('access.delete', 'access', 'delete', 'Eliminar accesos', 'Permite desactivar registros del módulo de accesos por baja lógica.'),
  ('access.assign', 'access', 'assign', 'Asignar accesos', 'Permite entregar, devolver y cerrar asignaciones de chips y tarjetas.')
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
  ON p.permission_key IN (
    'access.view',
    'access.create',
    'access.update',
    'access.delete',
    'access.assign'
  )
WHERE r.role_key = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
  ON p.permission_key IN (
    'access.view',
    'access.create',
    'access.update',
    'access.assign'
  )
WHERE r.role_key = 'operator';
