UPDATE ticket_events
SET event_title = CONVERT(BINARY(CONVERT(event_title USING latin1)) USING utf8mb4)
WHERE HEX(event_title) LIKE '%C383C2%'
   OR HEX(event_title) LIKE '%C382C2%';

UPDATE ticket_events
SET event_meta = CONVERT(BINARY(CONVERT(event_meta USING latin1)) USING utf8mb4)
WHERE HEX(event_meta) LIKE '%C383C2%'
   OR HEX(event_meta) LIKE '%C382C2%';
