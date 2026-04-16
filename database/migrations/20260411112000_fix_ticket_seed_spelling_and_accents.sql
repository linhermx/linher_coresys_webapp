UPDATE users
SET name = CASE email
  WHEN 'ivan.mendoza@linher.com.mx' THEN 'Iván Mendoza'
  WHEN 'sandra.lopez@linher.com.mx' THEN 'Sandra López'
  WHEN 'ricardo.jimenez@linher.com.mx' THEN 'Ricardo Jiménez'
  WHEN 'daniela.perez@linher.com.mx' THEN 'Daniela Pérez'
  WHEN 'jorge.nunez@linher.com.mx' THEN 'Jorge Núñez'
  WHEN 'monica.valdez@linher.com.mx' THEN 'Mónica Valdez'
  ELSE name
END
WHERE email IN (
  'ivan.mendoza@linher.com.mx',
  'sandra.lopez@linher.com.mx',
  'ricardo.jimenez@linher.com.mx',
  'daniela.perez@linher.com.mx',
  'jorge.nunez@linher.com.mx',
  'monica.valdez@linher.com.mx'
);

UPDATE tickets
SET title = CONCAT(
      CASE category_key
        WHEN 'hardware_equipo' THEN 'Revisión de equipo en área'
        WHEN 'software_aplicacion' THEN 'Instalación y validación de software'
        WHEN 'red_conectividad' THEN 'Falla de conectividad en segmento interno'
        WHEN 'correo_colaboracion' THEN 'Incidencia de correo y colaboración'
        WHEN 'acceso_logico' THEN 'Solicitud de acceso a plataforma corporativa'
        WHEN 'acceso_fisico' THEN 'Incidencia en lector y RFID'
        WHEN 'impresion_perifericos' THEN 'Soporte a impresión y periféricos'
        WHEN 'telefonia_soporte' THEN 'Soporte de telefonía corporativa'
        ELSE title
      END,
      ' #',
      LPAD(CAST(RIGHT(folio, 3) AS UNSIGNED), 3, '0')
    ),
    summary = CONCAT(
      'Caso operativo generado para pruebas de paginación y pipeline. ',
      'Se documenta seguimiento del ticket ',
      LPAD(CAST(RIGHT(folio, 3) AS UNSIGNED), 3, '0'),
      ' en entorno de desarrollo.'
    )
WHERE summary LIKE 'Caso operativo generado para pruebas de paginacion y pipeline.%'
   OR summary LIKE 'Caso operativo generado para pruebas de paginación y pipeline.%'
   OR summary LIKE 'Caso operativo generado para pruebas de paginaci% y pipeline.%';

UPDATE ticket_events te
INNER JOIN tickets t
  ON t.id = te.ticket_id
SET te.event_title = CASE
      WHEN te.event_title = 'Se movio a En proceso' OR te.event_title LIKE 'Se movi% a En proceso' THEN 'Se movió a En proceso'
      WHEN te.event_title = 'En espera de validacion del area' OR te.event_title LIKE 'En espera de validaci%n del %rea' THEN 'En espera de validación del área'
      WHEN te.event_title = 'Se marco como resuelto' OR te.event_title LIKE 'Se marc% como resuelto' THEN 'Se marcó como resuelto'
      WHEN te.event_title IN ('Ticket cerrado por confirmacion') THEN 'Ticket cerrado por confirmación'
      WHEN te.event_title LIKE 'Se agreg% evidencia de soporte' THEN 'Se agregó evidencia de soporte'
      WHEN te.event_title LIKE 'Se agreg% un adjunto' THEN 'Se agregó un adjunto'
      ELSE te.event_title
    END,
    te.event_meta = REPLACE(
      REPLACE(te.event_meta, CONCAT(' ', CHAR(194 USING utf8mb4), CHAR(183 USING utf8mb4), ' '), ' · '),
      ' ? ',
      ' · '
    )
WHERE t.summary LIKE 'Caso operativo generado para pruebas de paginación y pipeline.%';
