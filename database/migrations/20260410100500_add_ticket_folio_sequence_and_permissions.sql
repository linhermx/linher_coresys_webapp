CREATE TABLE IF NOT EXISTS ticket_folio_sequences (
  period_key CHAR(4) NOT NULL,
  last_value INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (period_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO permissions (
  permission_key,
  module_key,
  action_key,
  name,
  description
) VALUES
  ('tickets.view', 'tickets', 'view', 'Ver tickets', 'Permite consultar tickets y su detalle.'),
  ('tickets.create', 'tickets', 'create', 'Crear tickets', 'Permite registrar nuevos tickets.'),
  ('tickets.update', 'tickets', 'update', 'Actualizar tickets', 'Permite complementar y editar tickets.'),
  ('tickets.assign', 'tickets', 'assign', 'Asignar tickets', 'Permite mover estado y reasignar responsables.')
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
    'tickets.view',
    'tickets.create',
    'tickets.update',
    'tickets.assign'
  )
WHERE r.role_key IN ('admin', 'operator');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
  ON p.permission_key IN (
    'tickets.view',
    'tickets.create',
    'tickets.update'
  )
WHERE r.role_key = 'requester';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
  ON p.permission_key = 'tickets.view'
WHERE r.role_key = 'viewer';

WITH ranked_tickets AS (
  SELECT
    id,
    DATE_FORMAT(created_at, '%m%y') AS period_key,
    ROW_NUMBER() OVER (
      PARTITION BY DATE_FORMAT(created_at, '%m%y')
      ORDER BY created_at ASC, id ASC
    ) AS sequence_number
  FROM tickets
  WHERE deleted_at IS NULL
)
UPDATE tickets t
INNER JOIN ranked_tickets rt
  ON rt.id = t.id
SET t.folio = CONCAT(
  'TK-',
  rt.period_key,
  LPAD(rt.sequence_number, 3, '0')
);

INSERT INTO ticket_folio_sequences (
  period_key,
  last_value
)
SELECT
  SUBSTRING(folio, 4, 4) AS period_key,
  MAX(CAST(SUBSTRING(folio, 8, 3) AS UNSIGNED)) AS last_value
FROM tickets
WHERE deleted_at IS NULL
  AND folio REGEXP '^TK-[0-9]{7}$'
GROUP BY SUBSTRING(folio, 4, 4)
ON DUPLICATE KEY UPDATE
  last_value = GREATEST(last_value, VALUES(last_value));
