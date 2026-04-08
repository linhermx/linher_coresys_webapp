INSERT INTO permissions (
  permission_key,
  module_key,
  action_key,
  name,
  description
) VALUES
  ('users.view', 'users', 'view', 'Ver usuarios', 'Permite consultar cuentas del sistema.'),
  ('users.create', 'users', 'create', 'Crear usuarios', 'Permite registrar cuentas del sistema.'),
  ('users.update', 'users', 'update', 'Actualizar usuarios', 'Permite actualizar cuentas del sistema.'),
  ('users.delete', 'users', 'delete', 'Eliminar usuarios', 'Permite desactivar o eliminar cuentas del sistema.'),
  ('collaborators.view', 'collaborators', 'view', 'Ver colaboradores', 'Permite consultar el directorio operativo.'),
  ('collaborators.create', 'collaborators', 'create', 'Crear colaboradores', 'Permite registrar colaboradores en el directorio operativo.'),
  ('collaborators.update', 'collaborators', 'update', 'Actualizar colaboradores', 'Permite actualizar el directorio operativo.')
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
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'collaborators.view',
    'collaborators.create',
    'collaborators.update'
  )
WHERE r.role_key = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
  ON p.permission_key IN (
    'users.view',
    'users.create',
    'users.update',
    'collaborators.view',
    'collaborators.create',
    'collaborators.update'
  )
WHERE r.role_key = 'operator';
