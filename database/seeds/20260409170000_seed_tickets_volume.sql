SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';

INSERT IGNORE INTO users (name, email, password_hash, status)
VALUES
  ('Iván Mendoza', 'ivan.mendoza@linher.com.mx', NULL, 'active'),
  ('Mariana Ruiz', 'mariana.ruiz@linher.com.mx', NULL, 'active'),
  ('Laura Santiago', 'laura.santiago@linher.com.mx', NULL, 'active'),
  ('Sandra López', 'sandra.lopez@linher.com.mx', NULL, 'active'),
  ('Ernesto Vera', 'ernesto.vera@linher.com.mx', NULL, 'active'),
  ('Gabriel Torres', 'gabriel.torres@linher.com.mx', NULL, 'active'),
  ('Ricardo Jiménez', 'ricardo.jimenez@linher.com.mx', NULL, 'active'),
  ('Daniela Pérez', 'daniela.perez@linher.com.mx', NULL, 'active'),
  ('Jorge Núñez', 'jorge.nunez@linher.com.mx', NULL, 'active'),
  ('Mónica Valdez', 'monica.valdez@linher.com.mx', NULL, 'active'),
  ('Arturo Campos', 'arturo.campos@linher.com.mx', NULL, 'active'),
  ('Patricia Soto', 'patricia.soto@linher.com.mx', NULL, 'active');

UPDATE users
SET photo_path = CASE email
  WHEN 'ivan.mendoza@linher.com.mx' THEN 'https://i.pravatar.cc/128?img=11'
  WHEN 'mariana.ruiz@linher.com.mx' THEN 'https://i.pravatar.cc/128?img=5'
  WHEN 'laura.santiago@linher.com.mx' THEN 'https://i.pravatar.cc/128?img=20'
  WHEN 'sandra.lopez@linher.com.mx' THEN 'https://i.pravatar.cc/128?img=32'
  WHEN 'ernesto.vera@linher.com.mx' THEN 'https://i.pravatar.cc/128?img=15'
  WHEN 'gabriel.torres@linher.com.mx' THEN 'https://i.pravatar.cc/128?img=53'
  WHEN 'ricardo.jimenez@linher.com.mx' THEN 'https://i.pravatar.cc/128?img=18'
  WHEN 'daniela.perez@linher.com.mx' THEN 'https://i.pravatar.cc/128?img=26'
  WHEN 'jorge.nunez@linher.com.mx' THEN 'https://i.pravatar.cc/128?img=49'
  WHEN 'monica.valdez@linher.com.mx' THEN 'https://i.pravatar.cc/128?img=38'
  WHEN 'arturo.campos@linher.com.mx' THEN 'https://i.pravatar.cc/128?img=64'
  WHEN 'patricia.soto@linher.com.mx' THEN 'https://i.pravatar.cc/128?img=44'
  ELSE photo_path
END
WHERE email IN (
  'ivan.mendoza@linher.com.mx',
  'mariana.ruiz@linher.com.mx',
  'laura.santiago@linher.com.mx',
  'sandra.lopez@linher.com.mx',
  'ernesto.vera@linher.com.mx',
  'gabriel.torres@linher.com.mx',
  'ricardo.jimenez@linher.com.mx',
  'daniela.perez@linher.com.mx',
  'jorge.nunez@linher.com.mx',
  'monica.valdez@linher.com.mx',
  'arturo.campos@linher.com.mx',
  'patricia.soto@linher.com.mx'
);

DROP TEMPORARY TABLE IF EXISTS tmp_ticket_seed_users;
CREATE TEMPORARY TABLE tmp_ticket_seed_users (
  slot INT NOT NULL PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  area_name VARCHAR(120) NOT NULL
) ENGINE=MEMORY;

INSERT INTO tmp_ticket_seed_users (slot, user_id, full_name, area_name)
SELECT 1, id, 'Iván Mendoza', 'Compras' FROM users WHERE email = 'ivan.mendoza@linher.com.mx' LIMIT 1;
INSERT INTO tmp_ticket_seed_users (slot, user_id, full_name, area_name)
SELECT 2, id, 'Mariana Ruiz', 'Ventas' FROM users WHERE email = 'mariana.ruiz@linher.com.mx' LIMIT 1;
INSERT INTO tmp_ticket_seed_users (slot, user_id, full_name, area_name)
SELECT 3, id, 'Laura Santiago', 'Almacén' FROM users WHERE email = 'laura.santiago@linher.com.mx' LIMIT 1;
INSERT INTO tmp_ticket_seed_users (slot, user_id, full_name, area_name)
SELECT 4, id, 'Sandra López', 'Dirección' FROM users WHERE email = 'sandra.lopez@linher.com.mx' LIMIT 1;
INSERT INTO tmp_ticket_seed_users (slot, user_id, full_name, area_name)
SELECT 5, id, 'Ernesto Vera', 'Logística' FROM users WHERE email = 'ernesto.vera@linher.com.mx' LIMIT 1;
INSERT INTO tmp_ticket_seed_users (slot, user_id, full_name, area_name)
SELECT 6, id, 'Gabriel Torres', 'Ingeniería' FROM users WHERE email = 'gabriel.torres@linher.com.mx' LIMIT 1;
INSERT INTO tmp_ticket_seed_users (slot, user_id, full_name, area_name)
SELECT 7, id, 'Ricardo Jiménez', 'Calidad' FROM users WHERE email = 'ricardo.jimenez@linher.com.mx' LIMIT 1;
INSERT INTO tmp_ticket_seed_users (slot, user_id, full_name, area_name)
SELECT 8, id, 'Daniela Pérez', 'Finanzas' FROM users WHERE email = 'daniela.perez@linher.com.mx' LIMIT 1;
INSERT INTO tmp_ticket_seed_users (slot, user_id, full_name, area_name)
SELECT 9, id, 'Jorge Núñez', 'Operaciones' FROM users WHERE email = 'jorge.nunez@linher.com.mx' LIMIT 1;
INSERT INTO tmp_ticket_seed_users (slot, user_id, full_name, area_name)
SELECT 10, id, 'Mónica Valdez', 'Dirección' FROM users WHERE email = 'monica.valdez@linher.com.mx' LIMIT 1;
INSERT INTO tmp_ticket_seed_users (slot, user_id, full_name, area_name)
SELECT 11, id, 'Arturo Campos', 'Producción' FROM users WHERE email = 'arturo.campos@linher.com.mx' LIMIT 1;
INSERT INTO tmp_ticket_seed_users (slot, user_id, full_name, area_name)
SELECT 12, id, 'Patricia Soto', 'Soporte' FROM users WHERE email = 'patricia.soto@linher.com.mx' LIMIT 1;

SET @programador_user_id := (
  SELECT id
  FROM users
  WHERE email = 'programador@linher.com.mx'
  LIMIT 1
);

SET @ticket_seed_period := DATE_FORMAT(NOW(), '%m%y');
SET @ticket_seed_base := CAST((
  SELECT COALESCE(MAX(CAST(SUBSTRING(folio, 8, 3) AS UNSIGNED)), 0)
  FROM tickets
  WHERE deleted_at IS NULL
    AND folio REGEXP '^TK-[0-9]{7}$'
    AND SUBSTRING(folio, 4, 4) = @ticket_seed_period
) AS UNSIGNED);

DELETE FROM tickets
WHERE summary LIKE 'Caso operativo generado para pruebas de paginaci% y pipeline.%';

INSERT INTO tickets (
  folio,
  title,
  summary,
  status,
  priority,
  ticket_type,
  category_key,
  requester_user_id,
  requester_name,
  requester_area,
  assignee_user_id,
  assignee_name,
  due_at,
  channel,
  created_at,
  updated_at
)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 96
),
base_data AS (
  SELECT
    n,
    1 + MOD(n - 1, 12) AS requester_slot,
    CASE MOD(n, 5)
      WHEN 1 THEN 'nuevo'
      WHEN 2 THEN 'en_proceso'
      WHEN 3 THEN 'en_espera'
      WHEN 4 THEN 'resuelto'
      ELSE 'cerrado'
    END AS status_key,
    CASE MOD(n, 4)
      WHEN 1 THEN 'media'
      WHEN 2 THEN 'alta'
      WHEN 3 THEN 'critica'
      ELSE 'baja'
    END AS priority_key,
    CASE MOD(n, 2)
      WHEN 0 THEN 'incidencia'
      ELSE 'solicitud'
    END AS type_key,
    CASE MOD(n, 8)
      WHEN 1 THEN 'hardware_equipo'
      WHEN 2 THEN 'software_aplicacion'
      WHEN 3 THEN 'red_conectividad'
      WHEN 4 THEN 'correo_colaboracion'
      WHEN 5 THEN 'acceso_logico'
      WHEN 6 THEN 'acceso_fisico'
      WHEN 7 THEN 'impresion_perifericos'
      ELSE 'telefonia_soporte'
    END AS category_key
  FROM seq
)
SELECT
  CONCAT('TK-', @ticket_seed_period, LPAD(CAST(@ticket_seed_base + b.n AS UNSIGNED), 3, '0')) AS folio,
  CONCAT(
    CASE b.category_key
      WHEN 'hardware_equipo' THEN 'Revisión de equipo en área'
      WHEN 'software_aplicacion' THEN 'Instalación y validación de software'
      WHEN 'red_conectividad' THEN 'Falla de conectividad en segmento interno'
      WHEN 'correo_colaboracion' THEN 'Incidencia de correo y colaboración'
      WHEN 'acceso_logico' THEN 'Solicitud de acceso a plataforma corporativa'
      WHEN 'acceso_fisico' THEN 'Incidencia en lector y RFID'
      WHEN 'impresion_perifericos' THEN 'Soporte a impresión y periféricos'
      ELSE 'Soporte de telefonía corporativa'
    END,
    ' #',
    LPAD(b.n, 3, '0')
  ) AS title,
  CONCAT(
    'Caso operativo generado para pruebas de paginación y pipeline. ',
    'Se documenta seguimiento del ticket ',
    LPAD(b.n, 3, '0'),
    ' en entorno de desarrollo.'
  ) AS summary,
  b.status_key,
  b.priority_key,
  b.type_key,
  b.category_key,
  u.user_id AS requester_user_id,
  u.full_name AS requester_name,
  u.area_name AS requester_area,
  CASE MOD(b.n, 3)
    WHEN 0 THEN @programador_user_id
    ELSE NULL
  END AS assignee_user_id,
  CASE MOD(b.n, 3)
    WHEN 0 THEN 'Programador'
    WHEN 1 THEN 'Soporte interno'
    ELSE 'Licenciamiento'
  END AS assignee_name,
  CASE
    WHEN b.status_key IN ('resuelto', 'cerrado') THEN NULL
    ELSE DATE_ADD(NOW(), INTERVAL MOD(b.n, 42) - 12 HOUR)
  END AS due_at,
  CASE MOD(b.n, 3)
    WHEN 0 THEN 'Portal'
    WHEN 1 THEN 'Captura interna'
    ELSE 'Captura interna'
  END AS channel,
  DATE_SUB(NOW(), INTERVAL (96 - b.n) HOUR) AS created_at,
  DATE_ADD(DATE_SUB(NOW(), INTERVAL (96 - b.n) HOUR), INTERVAL MOD(b.n, 4) HOUR) AS updated_at
FROM base_data b
INNER JOIN tmp_ticket_seed_users u
  ON u.slot = b.requester_slot;

INSERT INTO ticket_comments (ticket_id, author_user_id, comment_text, created_at)
SELECT
  t.id,
  @programador_user_id,
  CONCAT('Seguimiento operativo ', c.step, ' para ', t.folio),
  DATE_ADD(t.created_at, INTERVAL c.step HOUR)
FROM tickets t
INNER JOIN (
  SELECT 1 AS step
  UNION ALL SELECT 2
  UNION ALL SELECT 3
  UNION ALL SELECT 4
  UNION ALL SELECT 5
) c
  ON c.step <= 1 + MOD(t.id, 5)
WHERE t.summary LIKE 'Caso operativo generado para pruebas de paginaci% y pipeline.%';

INSERT INTO ticket_events (ticket_id, event_title, event_meta, created_at)
SELECT
  t.id,
  'Ticket creado desde portal interno',
  CONCAT(t.requester_name, ' · ', DATE_FORMAT(t.created_at, '%H:%i')),
  t.created_at
FROM tickets t
WHERE t.summary LIKE 'Caso operativo generado para pruebas de paginaci% y pipeline.%';

INSERT INTO ticket_events (ticket_id, event_title, event_meta, created_at)
SELECT
  t.id,
  CASE t.status
    WHEN 'nuevo' THEN 'Solicitud registrada'
    WHEN 'en_proceso' THEN 'Se movió a En proceso'
    WHEN 'en_espera' THEN 'En espera de validación del área'
    WHEN 'resuelto' THEN 'Se marcó como resuelto'
    ELSE 'Ticket cerrado por confirmación'
  END AS event_title,
  CONCAT(COALESCE(t.assignee_name, 'Sistema'), ' · ', DATE_FORMAT(DATE_ADD(t.created_at, INTERVAL 1 HOUR), '%H:%i')),
  DATE_ADD(t.created_at, INTERVAL 1 HOUR)
FROM tickets t
WHERE t.summary LIKE 'Caso operativo generado para pruebas de paginaci% y pipeline.%';

INSERT INTO ticket_events (ticket_id, event_title, event_meta, created_at)
SELECT
  t.id,
  'Se agregó evidencia de soporte',
  CONCAT(t.requester_name, ' · ', DATE_FORMAT(DATE_ADD(t.created_at, INTERVAL 2 HOUR), '%H:%i')),
  DATE_ADD(t.created_at, INTERVAL 2 HOUR)
FROM tickets t
WHERE t.summary LIKE 'Caso operativo generado para pruebas de paginaci% y pipeline.%'
  AND MOD(t.id, 2) = 0;

INSERT INTO ticket_attachments (ticket_id, file_name, file_size_label, created_at)
SELECT
  t.id,
  CONCAT('evidencia-', LOWER(REPLACE(t.folio, 'TK-', 'tk-')), '.png'),
  CONCAT(220 + MOD(t.id, 1200), ' KB'),
  DATE_ADD(t.created_at, INTERVAL 2 HOUR)
FROM tickets t
WHERE t.summary LIKE 'Caso operativo generado para pruebas de paginaci% y pipeline.%'
  AND MOD(t.id, 3) = 0;

INSERT INTO ticket_attachments (ticket_id, file_name, file_size_label, created_at)
SELECT
  t.id,
  CONCAT('diagnostico-', LOWER(REPLACE(t.folio, 'TK-', 'tk-')), '.txt'),
  CONCAT(12 + MOD(t.id, 80), ' KB'),
  DATE_ADD(t.created_at, INTERVAL 3 HOUR)
FROM tickets t
WHERE t.summary LIKE 'Caso operativo generado para pruebas de paginaci% y pipeline.%'
  AND MOD(t.id, 5) = 0;

DROP TEMPORARY TABLE IF EXISTS tmp_ticket_seed_users;
