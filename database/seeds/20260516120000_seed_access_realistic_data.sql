SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';

START TRANSACTION;

SET @seed_marker := '[seed_access_demo]';
SET @demo_asset_code := 'INV-DEM-ACC-RFID-001';
SET @demo_location_storage_code := 'LOC-DEM-ACC-ALM';
SET @demo_location_office_code := 'LOC-DEM-ACC-OFI';
SET @demo_location_production_code := 'LOC-DEM-ACC-PROD';
SET @demo_location_retired_code := 'LOC-DEM-ACC-RET';
SET @demo_unit_prefix := 'U-DEM-ACC-';
SET @demo_tag_prefix := 'TAG-DEM-ACC-';
SET @demo_serial_prefix := 'SN-DEM-ACC-';

INSERT INTO users (name, email, password_hash, status)
VALUES ('Programador', 'programador@linher.com.mx', NULL, 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  status = VALUES(status),
  deleted_at = NULL;

SET @programador_user_id := (
  SELECT id
  FROM users
  WHERE email = 'programador@linher.com.mx'
  LIMIT 1
);

INSERT INTO collaborators (employee_id, first_name, last_name, area_name, status)
VALUES
  (910201, 'Carlos', 'Vega', 'Produccion', 'active'),
  (910202, 'Elena', 'Ruiz', 'Oficinas', 'active'),
  (910203, 'Mateo', 'Cruz', 'Calidad', 'active'),
  (910204, 'Lucia', 'Campos', 'Ingenieria', 'active'),
  (910205, 'Andres', 'Ibarra', 'Operaciones', 'active'),
  (910206, 'Sofia', 'Marin', 'Oficinas', 'active'),
  (910207, 'Pablo', 'Rios', 'Recursos compartidos', 'active'),
  (910208, 'Ines', 'Duarte', 'Direccion', 'active')
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  area_name = VALUES(area_name),
  status = VALUES(status),
  deleted_at = NULL;

INSERT INTO locations (location_type_id, name, code, parent_location_id, description, status)
SELECT lt.id, src.name, src.code, NULL, src.description, 'active'
FROM (
  SELECT 'almacen' AS type_key, 'Almacen Access Demo' AS name, @demo_location_storage_code AS code, CONCAT(@seed_marker, ' Resguardo de medios demo de Access.') AS description
  UNION ALL
  SELECT 'estacion_trabajo', 'Oficina Access Demo', @demo_location_office_code, CONCAT(@seed_marker, ' Ubicacion operativa de oficina.')
  UNION ALL
  SELECT 'area_fabrica', 'Produccion Access Demo', @demo_location_production_code, CONCAT(@seed_marker, ' Ubicacion operativa de produccion.')
  UNION ALL
  SELECT 'almacen', 'Baja Access Demo', @demo_location_retired_code, CONCAT(@seed_marker, ' Resguardo de medios retirados.')
) AS src
INNER JOIN location_types lt
  ON lt.type_key = src.type_key
ON DUPLICATE KEY UPDATE
  location_type_id = VALUES(location_type_id),
  name = VALUES(name),
  description = VALUES(description),
  status = VALUES(status),
  deleted_at = NULL;

INSERT INTO assets (
  asset_type_id,
  tracking_mode_id,
  asset_name,
  internal_code,
  brand,
  model,
  min_quantity,
  status,
  description
)
SELECT
  at.id,
  tm.id,
  'Tarjeta RFID Access Demo',
  @demo_asset_code,
  'HID',
  'Demo Access',
  0,
  'active',
  CONCAT(@seed_marker, ' Activo raiz para maquetacion de Access.')
FROM asset_types at
INNER JOIN asset_tracking_modes tm
  ON tm.mode_key = 'unit'
WHERE at.type_key = 'rfid_tag'
ON DUPLICATE KEY UPDATE
  asset_type_id = VALUES(asset_type_id),
  tracking_mode_id = VALUES(tracking_mode_id),
  asset_name = VALUES(asset_name),
  brand = VALUES(brand),
  model = VALUES(model),
  min_quantity = VALUES(min_quantity),
  status = VALUES(status),
  description = VALUES(description),
  deleted_at = NULL;

DELETE ae
FROM access_events ae
WHERE ae.notes LIKE CONCAT(@seed_marker, '%');

DELETE en
FROM access_enrollments en
WHERE en.notes LIKE CONCAT(@seed_marker, '%');

DELETE aa
FROM access_media_assignments aa
WHERE aa.assignment_note LIKE CONCAT(@seed_marker, '%')
   OR aa.closure_note LIKE CONCAT(@seed_marker, '%');

DELETE am
FROM access_media am
WHERE am.tag_code LIKE CONCAT(@demo_tag_prefix, '%')
   OR am.notes LIKE CONCAT(@seed_marker, '%');

DELETE im
FROM inventory_movements im
INNER JOIN inventory_movement_lines iml
  ON iml.inventory_movement_id = im.id
INNER JOIN asset_units au
  ON au.id = iml.asset_unit_id
WHERE au.asset_tag LIKE CONCAT(@demo_unit_prefix, '%');

DELETE ae
FROM asset_events ae
LEFT JOIN asset_units au
  ON au.id = ae.asset_unit_id
LEFT JOIN assets a
  ON a.id = ae.asset_id
WHERE au.asset_tag LIKE CONCAT(@demo_unit_prefix, '%')
   OR a.internal_code = @demo_asset_code;

DELETE ia
FROM asset_assignments ia
INNER JOIN asset_units au
  ON au.id = ia.asset_unit_id
WHERE au.asset_tag LIKE CONCAT(@demo_unit_prefix, '%');

DELETE au
FROM asset_units au
WHERE au.asset_tag LIKE CONCAT(@demo_unit_prefix, '%')
   OR au.notes LIKE CONCAT(@seed_marker, '%');

SET @demo_asset_id := (
  SELECT id
  FROM assets
  WHERE internal_code = @demo_asset_code
  LIMIT 1
);

DROP TEMPORARY TABLE IF EXISTS tmp_access_demo_units;
CREATE TEMPORARY TABLE tmp_access_demo_units (
  code VARCHAR(3) NOT NULL PRIMARY KEY,
  medium_type_key VARCHAR(40) NOT NULL,
  media_status_key VARCHAR(60) NOT NULL,
  unit_status_key VARCHAR(60) NOT NULL,
  location_code VARCHAR(80) NULL,
  unit_note VARCHAR(255) NOT NULL,
  media_note VARCHAR(255) NOT NULL
) ENGINE=MEMORY;

INSERT INTO tmp_access_demo_units (
  code,
  medium_type_key,
  media_status_key,
  unit_status_key,
  location_code,
  unit_note,
  media_note
)
VALUES
  ('001', 'card', 'assigned', 'assigned', @demo_location_production_code, CONCAT(@seed_marker, ' Unit 001 assigned in production.'), CONCAT(@seed_marker, ' Media 001 assigned in production.')),
  ('002', 'card', 'assigned', 'assigned', @demo_location_office_code, CONCAT(@seed_marker, ' Unit 002 assigned in office.'), CONCAT(@seed_marker, ' Media 002 assigned in office.')),
  ('003', 'card', 'available', 'available', @demo_location_storage_code, CONCAT(@seed_marker, ' Unit 003 returned to storage.'), CONCAT(@seed_marker, ' Media 003 returned to storage.')),
  ('004', 'chip', 'available', 'available', @demo_location_storage_code, CONCAT(@seed_marker, ' Unit 004 returned to storage.'), CONCAT(@seed_marker, ' Media 004 returned to storage.')),
  ('005', 'chip', 'not_returned', 'retired', @demo_location_retired_code, CONCAT(@seed_marker, ' Unit 005 not returned and retired.'), CONCAT(@seed_marker, ' Media 005 not returned.')),
  ('006', 'card', 'available', 'available', @demo_location_storage_code, CONCAT(@seed_marker, ' Unit 006 ready for assignment.'), CONCAT(@seed_marker, ' Media 006 available.')),
  ('007', 'chip', 'assigned', 'assigned', @demo_location_office_code, CONCAT(@seed_marker, ' Unit 007 recent office assignment.'), CONCAT(@seed_marker, ' Media 007 recent office assignment.')),
  ('008', 'card', 'available', 'available', @demo_location_storage_code, CONCAT(@seed_marker, ' Unit 008 ready for assignment.'), CONCAT(@seed_marker, ' Media 008 available.')),
  ('009', 'card', 'retired', 'retired', @demo_location_retired_code, CONCAT(@seed_marker, ' Unit 009 retired for reference.'), CONCAT(@seed_marker, ' Media 009 retired.'));

INSERT INTO asset_units (
  asset_id,
  asset_tag,
  serial_number,
  asset_unit_status_id,
  current_location_id,
  acquired_at,
  notes
)
SELECT
  @demo_asset_id,
  CONCAT(@demo_unit_prefix, spec.code),
  CONCAT(@demo_serial_prefix, spec.code),
  aus.id,
  loc.id,
  DATE_SUB(CURDATE(), INTERVAL 120 - CAST(spec.code AS UNSIGNED) DAY),
  spec.unit_note
FROM tmp_access_demo_units spec
INNER JOIN asset_unit_statuses aus
  ON aus.status_key = spec.unit_status_key
LEFT JOIN locations loc
  ON loc.code = spec.location_code;

INSERT INTO access_media (
  medium_type_id,
  status_id,
  asset_unit_id,
  tag_code,
  notes
)
SELECT
  mt.id,
  ms.id,
  au.id,
  CONCAT(@demo_tag_prefix, spec.code),
  spec.media_note
FROM tmp_access_demo_units spec
INNER JOIN access_medium_types mt
  ON mt.type_key = spec.medium_type_key
INNER JOIN access_media_statuses ms
  ON ms.status_key = spec.media_status_key
INNER JOIN asset_units au
  ON au.asset_tag = CONCAT(@demo_unit_prefix, spec.code);

DROP TEMPORARY TABLE IF EXISTS tmp_access_demo_assignments;
CREATE TEMPORARY TABLE tmp_access_demo_assignments (
  code VARCHAR(3) NOT NULL PRIMARY KEY,
  collaborator_employee_id BIGINT UNSIGNED NOT NULL,
  status_key VARCHAR(60) NOT NULL,
  assigned_at DATETIME NOT NULL,
  expected_return_at DATETIME NULL,
  returned_at DATETIME NULL,
  assignment_note VARCHAR(255) NOT NULL,
  closure_note VARCHAR(255) NULL
) ENGINE=MEMORY;

INSERT INTO tmp_access_demo_assignments (
  code,
  collaborator_employee_id,
  status_key,
  assigned_at,
  expected_return_at,
  returned_at,
  assignment_note,
  closure_note
)
SELECT '001', 910201, 'active', DATE_ADD(DATE_SUB(NOW(), INTERVAL 2 DAY), INTERVAL 9 HOUR), DATE_ADD(NOW(), INTERVAL 20 DAY), NULL, CONCAT(@seed_marker, ' Assignment 001 active in production.'), NULL
UNION ALL
SELECT '002', 910202, 'active', DATE_ADD(DATE_SUB(NOW(), INTERVAL 3 DAY), INTERVAL 11 HOUR), DATE_ADD(NOW(), INTERVAL 18 DAY), NULL, CONCAT(@seed_marker, ' Assignment 002 active in offices.'), NULL
UNION ALL
SELECT '003', 910203, 'returned', DATE_ADD(DATE_SUB(NOW(), INTERVAL 7 DAY), INTERVAL 8 HOUR), DATE_ADD(DATE_SUB(NOW(), INTERVAL 1 DAY), INTERVAL 18 HOUR), DATE_ADD(DATE_SUB(NOW(), INTERVAL 5 DAY), INTERVAL 17 HOUR), CONCAT(@seed_marker, ' Assignment 003 returned.'), CONCAT(@seed_marker, ' Assignment 003 returned to storage.')
UNION ALL
SELECT '004', 910204, 'returned', DATE_ADD(DATE_SUB(NOW(), INTERVAL 8 DAY), INTERVAL 10 HOUR), DATE_ADD(DATE_SUB(NOW(), INTERVAL 2 DAY), INTERVAL 18 HOUR), DATE_ADD(DATE_SUB(NOW(), INTERVAL 4 DAY), INTERVAL 16 HOUR), CONCAT(@seed_marker, ' Assignment 004 temporary chip.'), CONCAT(@seed_marker, ' Assignment 004 closed without incidents.')
UNION ALL
SELECT '005', 910205, 'not_returned', DATE_ADD(DATE_SUB(NOW(), INTERVAL 10 DAY), INTERVAL 9 HOUR), DATE_ADD(DATE_SUB(NOW(), INTERVAL 3 DAY), INTERVAL 18 HOUR), DATE_ADD(DATE_SUB(NOW(), INTERVAL 3 DAY), INTERVAL 18 HOUR), CONCAT(@seed_marker, ' Assignment 005 linked to offboarding.'), CONCAT(@seed_marker, ' Assignment 005 closed as not returned.')
UNION ALL
SELECT '007', 910206, 'active', DATE_ADD(DATE_SUB(NOW(), INTERVAL 1 DAY), INTERVAL 12 HOUR), DATE_ADD(NOW(), INTERVAL 24 DAY), NULL, CONCAT(@seed_marker, ' Assignment 007 recent office activation.'), NULL;

INSERT INTO access_media_assignments (
  access_media_id,
  collaborator_id,
  status_id,
  assigned_by_user_id,
  received_by_user_id,
  assigned_at,
  expected_return_at,
  returned_at,
  assignment_note,
  closure_note
)
SELECT
  am.id,
  c.id,
  ast.id,
  @programador_user_id,
  NULL,
  spec.assigned_at,
  spec.expected_return_at,
  spec.returned_at,
  spec.assignment_note,
  spec.closure_note
FROM tmp_access_demo_assignments spec
INNER JOIN collaborators c
  ON c.employee_id = spec.collaborator_employee_id
INNER JOIN access_assignment_statuses ast
  ON ast.status_key = spec.status_key
INNER JOIN access_media am
  ON am.tag_code = CONCAT(@demo_tag_prefix, spec.code);

DROP TEMPORARY TABLE IF EXISTS tmp_access_demo_enrollments;
CREATE TEMPORARY TABLE tmp_access_demo_enrollments (
  enrollment_code VARCHAR(4) NOT NULL PRIMARY KEY,
  collaborator_employee_id BIGINT UNSIGNED NOT NULL,
  system_key VARCHAR(60) NOT NULL,
  assignment_code VARCHAR(3) NULL,
  status_key VARCHAR(60) NOT NULL,
  activated_at DATETIME NULL,
  deactivated_at DATETIME NULL,
  notes VARCHAR(255) NOT NULL
) ENGINE=MEMORY;

INSERT INTO tmp_access_demo_enrollments (
  enrollment_code,
  collaborator_employee_id,
  system_key,
  assignment_code,
  status_key,
  activated_at,
  deactivated_at,
  notes
)
SELECT 'E001', 910201, 'production', '001', 'active', DATE_ADD(DATE_SUB(NOW(), INTERVAL 2 DAY), INTERVAL 9 HOUR), NULL, CONCAT(@seed_marker, ' Enrollment E001 active production.')
UNION ALL
SELECT 'E002', 910201, 'bathroom', '001', 'active', DATE_ADD(DATE_SUB(NOW(), INTERVAL 2 DAY), INTERVAL 10 HOUR), NULL, CONCAT(@seed_marker, ' Enrollment E002 active bathroom.')
UNION ALL
SELECT 'E003', 910202, 'offices', '002', 'active', DATE_ADD(DATE_SUB(NOW(), INTERVAL 3 DAY), INTERVAL 12 HOUR), NULL, CONCAT(@seed_marker, ' Enrollment E003 active offices.')
UNION ALL
SELECT 'E004', 910203, 'offices', '003', 'suspended', DATE_ADD(DATE_SUB(NOW(), INTERVAL 7 DAY), INTERVAL 9 HOUR), NULL, CONCAT(@seed_marker, ' Enrollment E004 suspended offices.')
UNION ALL
SELECT 'E005', 910204, 'production', '004', 'deactivated', DATE_ADD(DATE_SUB(NOW(), INTERVAL 8 DAY), INTERVAL 10 HOUR), DATE_ADD(DATE_SUB(NOW(), INTERVAL 4 DAY), INTERVAL 16 HOUR), CONCAT(@seed_marker, ' Enrollment E005 deactivated production.')
UNION ALL
SELECT 'E006', 910205, 'offices', '005', 'deactivated', DATE_ADD(DATE_SUB(NOW(), INTERVAL 10 DAY), INTERVAL 9 HOUR), DATE_ADD(DATE_SUB(NOW(), INTERVAL 3 DAY), INTERVAL 18 HOUR), CONCAT(@seed_marker, ' Enrollment E006 deactivated after not returned.')
UNION ALL
SELECT 'E007', 910206, 'bathroom', '007', 'pending', DATE_ADD(DATE_SUB(NOW(), INTERVAL 1 DAY), INTERVAL 12 HOUR), NULL, CONCAT(@seed_marker, ' Enrollment E007 pending bathroom activation.')
UNION ALL
SELECT 'E008', 910207, 'offices', NULL, 'active', DATE_ADD(DATE_SUB(NOW(), INTERVAL 6 DAY), INTERVAL 14 HOUR), NULL, CONCAT(@seed_marker, ' Enrollment E008 active without linked media.');

INSERT INTO access_enrollments (
  collaborator_id,
  access_system_id,
  media_assignment_id,
  status_id,
  activated_at,
  deactivated_at,
  notes
)
SELECT
  c.id,
  sys.id,
  ama.id,
  est.id,
  spec.activated_at,
  spec.deactivated_at,
  spec.notes
FROM tmp_access_demo_enrollments spec
INNER JOIN collaborators c
  ON c.employee_id = spec.collaborator_employee_id
INNER JOIN access_systems sys
  ON sys.system_key = spec.system_key
INNER JOIN access_enrollment_statuses est
  ON est.status_key = spec.status_key
LEFT JOIN access_media_assignments ama
  ON spec.assignment_code IS NOT NULL
 AND ama.assignment_note = CONCAT(@seed_marker, ' Assignment ', spec.assignment_code, CASE spec.assignment_code
   WHEN '001' THEN ' active in production.'
   WHEN '002' THEN ' active in offices.'
   WHEN '003' THEN ' returned.'
   WHEN '004' THEN ' temporary chip.'
   WHEN '005' THEN ' linked to offboarding.'
   WHEN '007' THEN ' recent office activation.'
   ELSE ''
 END);

INSERT INTO access_events (
  event_type,
  operator_id,
  collaborator_id,
  access_system_id,
  access_media_id,
  access_media_assignment_id,
  access_enrollment_id,
  notes,
  happened_at
)
SELECT
  'media_created',
  @programador_user_id,
  NULL,
  NULL,
  am.id,
  NULL,
  NULL,
  CONCAT(@seed_marker, ' Event media_created ', spec.code, '.'),
  DATE_SUB(NOW(), INTERVAL 12 - CAST(spec.code AS UNSIGNED) DAY)
FROM tmp_access_demo_units spec
INNER JOIN access_media am
  ON am.tag_code = CONCAT(@demo_tag_prefix, spec.code);

INSERT INTO access_events (
  event_type,
  operator_id,
  collaborator_id,
  access_system_id,
  access_media_id,
  access_media_assignment_id,
  access_enrollment_id,
  notes,
  happened_at
)
SELECT
  'media_assigned',
  @programador_user_id,
  c.id,
  NULL,
  am.id,
  ama.id,
  NULL,
  CONCAT(@seed_marker, ' Event media_assigned ', spec.code, '.'),
  spec.assigned_at
FROM tmp_access_demo_assignments spec
INNER JOIN collaborators c
  ON c.employee_id = spec.collaborator_employee_id
INNER JOIN access_media am
  ON am.tag_code = CONCAT(@demo_tag_prefix, spec.code)
INNER JOIN access_media_assignments ama
  ON ama.access_media_id = am.id
 AND ama.collaborator_id = c.id
 AND ama.assignment_note = spec.assignment_note;

INSERT INTO access_events (
  event_type,
  operator_id,
  collaborator_id,
  access_system_id,
  access_media_id,
  access_media_assignment_id,
  access_enrollment_id,
  notes,
  happened_at
)
SELECT
  'media_returned',
  @programador_user_id,
  c.id,
  NULL,
  am.id,
  ama.id,
  NULL,
  CONCAT(@seed_marker, ' Event media_returned ', spec.code, '.'),
  spec.returned_at
FROM tmp_access_demo_assignments spec
INNER JOIN collaborators c
  ON c.employee_id = spec.collaborator_employee_id
INNER JOIN access_media am
  ON am.tag_code = CONCAT(@demo_tag_prefix, spec.code)
INNER JOIN access_media_assignments ama
  ON ama.access_media_id = am.id
 AND ama.collaborator_id = c.id
 AND ama.assignment_note = spec.assignment_note
WHERE spec.status_key = 'returned';

INSERT INTO access_events (
  event_type,
  operator_id,
  collaborator_id,
  access_system_id,
  access_media_id,
  access_media_assignment_id,
  access_enrollment_id,
  notes,
  happened_at
)
SELECT
  'media_marked_not_returned',
  @programador_user_id,
  c.id,
  NULL,
  am.id,
  ama.id,
  NULL,
  CONCAT(@seed_marker, ' Event media_marked_not_returned ', spec.code, '.'),
  spec.returned_at
FROM tmp_access_demo_assignments spec
INNER JOIN collaborators c
  ON c.employee_id = spec.collaborator_employee_id
INNER JOIN access_media am
  ON am.tag_code = CONCAT(@demo_tag_prefix, spec.code)
INNER JOIN access_media_assignments ama
  ON ama.access_media_id = am.id
 AND ama.collaborator_id = c.id
 AND ama.assignment_note = spec.assignment_note
WHERE spec.status_key = 'not_returned';

INSERT INTO access_events (
  event_type,
  operator_id,
  collaborator_id,
  access_system_id,
  access_media_id,
  access_media_assignment_id,
  access_enrollment_id,
  notes,
  happened_at
)
SELECT
  'enrollment_created',
  @programador_user_id,
  c.id,
  sys.id,
  am.id,
  ama.id,
  en.id,
  CONCAT(@seed_marker, ' Event enrollment_created ', spec.enrollment_code, '.'),
  COALESCE(spec.activated_at, DATE_SUB(NOW(), INTERVAL 1 DAY))
FROM tmp_access_demo_enrollments spec
INNER JOIN collaborators c
  ON c.employee_id = spec.collaborator_employee_id
INNER JOIN access_systems sys
  ON sys.system_key = spec.system_key
INNER JOIN access_enrollments en
  ON en.collaborator_id = c.id
 AND en.access_system_id = sys.id
 AND en.notes = spec.notes
LEFT JOIN access_media_assignments ama
  ON en.media_assignment_id = ama.id
LEFT JOIN access_media am
  ON ama.access_media_id = am.id;

INSERT INTO access_events (
  event_type,
  operator_id,
  collaborator_id,
  access_system_id,
  access_media_id,
  access_media_assignment_id,
  access_enrollment_id,
  notes,
  happened_at
)
SELECT
  'enrollment_activated',
  @programador_user_id,
  c.id,
  sys.id,
  am.id,
  ama.id,
  en.id,
  CONCAT(@seed_marker, ' Event enrollment_activated ', spec.enrollment_code, '.'),
  spec.activated_at
FROM tmp_access_demo_enrollments spec
INNER JOIN collaborators c
  ON c.employee_id = spec.collaborator_employee_id
INNER JOIN access_systems sys
  ON sys.system_key = spec.system_key
INNER JOIN access_enrollments en
  ON en.collaborator_id = c.id
 AND en.access_system_id = sys.id
 AND en.notes = spec.notes
LEFT JOIN access_media_assignments ama
  ON en.media_assignment_id = ama.id
LEFT JOIN access_media am
  ON ama.access_media_id = am.id
WHERE spec.status_key = 'active';

INSERT INTO access_events (
  event_type,
  operator_id,
  collaborator_id,
  access_system_id,
  access_media_id,
  access_media_assignment_id,
  access_enrollment_id,
  notes,
  happened_at
)
SELECT
  'enrollment_suspended',
  @programador_user_id,
  c.id,
  sys.id,
  am.id,
  ama.id,
  en.id,
  CONCAT(@seed_marker, ' Event enrollment_suspended ', spec.enrollment_code, '.'),
  DATE_ADD(spec.activated_at, INTERVAL 2 DAY)
FROM tmp_access_demo_enrollments spec
INNER JOIN collaborators c
  ON c.employee_id = spec.collaborator_employee_id
INNER JOIN access_systems sys
  ON sys.system_key = spec.system_key
INNER JOIN access_enrollments en
  ON en.collaborator_id = c.id
 AND en.access_system_id = sys.id
 AND en.notes = spec.notes
LEFT JOIN access_media_assignments ama
  ON en.media_assignment_id = ama.id
LEFT JOIN access_media am
  ON ama.access_media_id = am.id
WHERE spec.status_key = 'suspended';

INSERT INTO access_events (
  event_type,
  operator_id,
  collaborator_id,
  access_system_id,
  access_media_id,
  access_media_assignment_id,
  access_enrollment_id,
  notes,
  happened_at
)
SELECT
  'enrollment_deactivated',
  @programador_user_id,
  c.id,
  sys.id,
  am.id,
  ama.id,
  en.id,
  CONCAT(@seed_marker, ' Event enrollment_deactivated ', spec.enrollment_code, '.'),
  spec.deactivated_at
FROM tmp_access_demo_enrollments spec
INNER JOIN collaborators c
  ON c.employee_id = spec.collaborator_employee_id
INNER JOIN access_systems sys
  ON sys.system_key = spec.system_key
INNER JOIN access_enrollments en
  ON en.collaborator_id = c.id
 AND en.access_system_id = sys.id
 AND en.notes = spec.notes
LEFT JOIN access_media_assignments ama
  ON en.media_assignment_id = ama.id
LEFT JOIN access_media am
  ON ama.access_media_id = am.id
WHERE spec.status_key = 'deactivated';

INSERT INTO access_events (
  event_type,
  operator_id,
  collaborator_id,
  access_system_id,
  access_media_id,
  access_media_assignment_id,
  access_enrollment_id,
  notes,
  happened_at
)
SELECT
  'collaborator_offboarded',
  @programador_user_id,
  c.id,
  sys.id,
  am.id,
  ama.id,
  en.id,
  CONCAT(@seed_marker, ' Event collaborator_offboarded E006.'),
  DATE_ADD(DATE_SUB(NOW(), INTERVAL 3 DAY), INTERVAL 18 HOUR)
FROM collaborators c
INNER JOIN access_systems sys
  ON sys.system_key = 'offices'
INNER JOIN access_enrollments en
  ON en.collaborator_id = c.id
 AND en.notes = CONCAT(@seed_marker, ' Enrollment E006 deactivated after not returned.')
LEFT JOIN access_media_assignments ama
  ON en.media_assignment_id = ama.id
LEFT JOIN access_media am
  ON ama.access_media_id = am.id
WHERE c.employee_id = 910205;

DROP TEMPORARY TABLE IF EXISTS tmp_access_demo_units;
DROP TEMPORARY TABLE IF EXISTS tmp_access_demo_assignments;
DROP TEMPORARY TABLE IF EXISTS tmp_access_demo_enrollments;

COMMIT;
