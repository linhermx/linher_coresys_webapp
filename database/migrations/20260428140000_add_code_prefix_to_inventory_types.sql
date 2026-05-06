ALTER TABLE asset_types
  ADD COLUMN code_prefix VARCHAR(12) NULL AFTER type_key;

UPDATE asset_types
SET code_prefix = CASE type_key
  WHEN 'laptop' THEN 'LAP'
  WHEN 'monitor' THEN 'MON'
  WHEN 'switch' THEN 'SWT'
  WHEN 'telefono_corporativo' THEN 'TEL'
  WHEN 'rfid_tag' THEN 'RFD'
  WHEN 'cable' THEN 'CAB'
  WHEN 'adaptador' THEN 'ADP'
  ELSE UPPER(LEFT(REPLACE(type_key, '_', ''), 12))
END
WHERE code_prefix IS NULL;

ALTER TABLE asset_types
  MODIFY COLUMN code_prefix VARCHAR(12) NOT NULL;

ALTER TABLE asset_types
  ADD CONSTRAINT uq_asset_types_code_prefix UNIQUE (code_prefix);

ALTER TABLE location_types
  ADD COLUMN code_prefix VARCHAR(12) NULL AFTER type_key;

UPDATE location_types
SET code_prefix = CASE type_key
  WHEN 'almacen' THEN 'ALM'
  WHEN 'caja_personal' THEN 'CAJ'
  WHEN 'rack' THEN 'RCK'
  WHEN 'area_fabrica' THEN 'FAB'
  WHEN 'estacion_trabajo' THEN 'EST'
  WHEN 'zona_camaras' THEN 'CAM'
  ELSE UPPER(LEFT(REPLACE(type_key, '_', ''), 12))
END
WHERE code_prefix IS NULL;

ALTER TABLE location_types
  MODIFY COLUMN code_prefix VARCHAR(12) NOT NULL;

ALTER TABLE location_types
  ADD CONSTRAINT uq_location_types_code_prefix UNIQUE (code_prefix);
