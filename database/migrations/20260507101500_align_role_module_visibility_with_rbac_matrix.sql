INSERT INTO permissions (
  permission_key,
  module_key,
  action_key,
  name,
  description
) VALUES
  ('access.view', 'access', 'view', 'Ver accesos', 'Permite consultar cuentas técnicas, identificadores operativos y medios de acceso.'),
  ('telephony.view', 'telephony', 'view', 'Ver telefonía', 'Permite consultar líneas, SIMs y recargas corporativas.'),
  ('services.view', 'services', 'view', 'Ver servicios', 'Permite consultar servicios, pagos y renovaciones administrados por Sistemas.'),
  ('infrastructure.view', 'infrastructure', 'view', 'Ver infraestructura', 'Permite consultar red e infraestructura operativa.'),
  ('notifications.view', 'notifications', 'view', 'Ver notificaciones', 'Permite consultar notificaciones del sistema.'),
  ('knowledge_base.view', 'knowledge_base', 'view', 'Ver base de conocimiento', 'Permite consultar artículos y documentación operativa.')
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
    'telephony.view',
    'services.view',
    'infrastructure.view',
    'notifications.view',
    'knowledge_base.view'
  )
WHERE r.role_key = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
  ON p.permission_key IN (
    'access.view',
    'telephony.view',
    'services.view',
    'infrastructure.view',
    'notifications.view',
    'knowledge_base.view'
  )
WHERE r.role_key = 'operator';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
  ON p.permission_key IN (
    'notifications.view',
    'knowledge_base.view'
  )
WHERE r.role_key = 'requester';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
  ON p.permission_key IN (
    'notifications.view',
    'knowledge_base.view'
  )
WHERE r.role_key = 'viewer';

DELETE rp
FROM role_permissions rp
INNER JOIN roles r
  ON r.id = rp.role_id
INNER JOIN permissions p
  ON p.id = rp.permission_id
WHERE r.role_key IN ('requester', 'viewer')
  AND p.permission_key IN (
    'inventory.view'
  );
