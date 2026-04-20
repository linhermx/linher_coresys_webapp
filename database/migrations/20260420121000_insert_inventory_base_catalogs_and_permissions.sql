INSERT INTO asset_tracking_modes (
  mode_key,
  name,
  description
) VALUES
  ('unit', 'Unitario', 'Control por unidad individual con identificador propio.'),
  ('stock', 'Stock', 'Control por existencias agregadas sin serialización por unidad.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  deleted_at = NULL;

INSERT INTO asset_unit_statuses (
  status_key,
  name,
  description,
  is_terminal
) VALUES
  ('available', 'Disponible', 'Unidad disponible para asignación u operación.', 0),
  ('assigned', 'Asignado', 'Unidad entregada a una persona colaboradora.', 0),
  ('in_repair', 'En reparación', 'Unidad en mantenimiento o diagnóstico.', 0),
  ('retired', 'Baja', 'Unidad fuera de operación de forma definitiva.', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_terminal = VALUES(is_terminal),
  deleted_at = NULL;

INSERT INTO location_types (
  type_key,
  name,
  description
) VALUES
  ('caja_personal', 'Caja personal', 'Ubicación física tipo caja personal.'),
  ('rack', 'Rack', 'Ubicación en rack técnico.'),
  ('area_fabrica', 'Área de fábrica', 'Ubicación en área productiva o de planta.'),
  ('estacion_trabajo', 'Estación de trabajo', 'Puesto físico operativo.'),
  ('zona_camaras', 'Zona de cámaras', 'Área relacionada con CCTV o videovigilancia.'),
  ('almacen', 'Almacén', 'Ubicación de resguardo general de inventario.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  deleted_at = NULL;

INSERT INTO asset_categories (
  category_key,
  name,
  description
) VALUES
  ('hardware_equipo', 'Equipos de cómputo', 'Laptops, desktops y equipos de operación.'),
  ('hardware_periferico', 'Periféricos', 'Monitores, teclados, mouse y accesorios de trabajo.'),
  ('network_device', 'Red e infraestructura', 'Switches, routers y equipo de red.'),
  ('telephony_device', 'Telefonía', 'Teléfonos corporativos y accesorios de telefonía.'),
  ('access_device', 'Acceso físico', 'Tarjetas, chips y medios RFID administrados por Sistemas.'),
  ('consumable', 'Consumibles e insumos', 'Cables, adaptadores y materiales de reposición.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  deleted_at = NULL;

INSERT INTO inventory_movement_types (
  movement_type_key,
  name,
  direction,
  description
) VALUES
  ('purchase_in', 'Entrada por compra', 'in', 'Ingreso por adquisición de inventario.'),
  ('assignment_out', 'Salida por asignación', 'out', 'Salida por entrega de activo a colaborador.'),
  ('internal_use_out', 'Salida por uso interno', 'out', 'Salida por operación interna de Sistemas.'),
  ('consumption_out', 'Salida por consumo', 'out', 'Salida por consumo de stock no serializable.'),
  ('return_in', 'Entrada por devolución', 'in', 'Reingreso por devolución de activo.'),
  ('transfer', 'Traslado', 'transfer', 'Movimiento entre ubicaciones.'),
  ('adjustment', 'Ajuste', 'adjustment', 'Ajuste por corrección de conteo o regularización.'),
  ('repair_out', 'Salida a reparación', 'out', 'Salida para proceso de mantenimiento o reparación.'),
  ('repair_in', 'Entrada de reparación', 'in', 'Reingreso tras completar reparación.'),
  ('retire_out', 'Baja definitiva', 'out', 'Salida definitiva por obsolescencia, pérdida o daño.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  direction = VALUES(direction),
  description = VALUES(description),
  deleted_at = NULL;

INSERT INTO asset_types (
  asset_category_id,
  type_key,
  name,
  default_tracking_mode_id,
  description
)
SELECT
  c.id,
  src.type_key,
  src.name,
  tm.id,
  src.description
FROM (
  SELECT 'laptop' AS type_key, 'Laptop' AS name, 'hardware_equipo' AS category_key, 'unit' AS mode_key, 'Equipo portátil asignable.' AS description
  UNION ALL SELECT 'monitor', 'Monitor', 'hardware_periferico', 'unit', 'Monitor para estación de trabajo.'
  UNION ALL SELECT 'switch', 'Switch', 'network_device', 'unit', 'Equipo de red para infraestructura interna.'
  UNION ALL SELECT 'telefono_corporativo', 'Teléfono corporativo', 'telephony_device', 'unit', 'Dispositivo móvil corporativo.'
  UNION ALL SELECT 'rfid_tag', 'Tarjeta o chip RFID', 'access_device', 'unit', 'Medio físico de acceso administrado por Sistemas.'
  UNION ALL SELECT 'cable', 'Cable', 'consumable', 'stock', 'Insumo de cableado para operación.'
  UNION ALL SELECT 'adaptador', 'Adaptador', 'consumable', 'stock', 'Insumo de conectividad y energía.'
) AS src
INNER JOIN asset_categories c
  ON c.category_key = src.category_key
INNER JOIN asset_tracking_modes tm
  ON tm.mode_key = src.mode_key
ON DUPLICATE KEY UPDATE
  asset_category_id = VALUES(asset_category_id),
  name = VALUES(name),
  default_tracking_mode_id = VALUES(default_tracking_mode_id),
  description = VALUES(description),
  deleted_at = NULL;

INSERT INTO permissions (
  permission_key,
  module_key,
  action_key,
  name,
  description
) VALUES
  ('inventory.view', 'inventory', 'view', 'Ver inventario', 'Permite consultar activos, ubicaciones y movimientos de inventario.'),
  ('inventory.create', 'inventory', 'create', 'Crear inventario', 'Permite registrar activos, unidades y entradas iniciales.'),
  ('inventory.update', 'inventory', 'update', 'Actualizar inventario', 'Permite actualizar datos operativos del inventario.'),
  ('inventory.delete', 'inventory', 'delete', 'Eliminar inventario', 'Permite desactivar registros de inventario por baja lógica.'),
  ('inventory.assign', 'inventory', 'assign', 'Asignar activos', 'Permite asignar y devolver activos unitarios a colaboradores.'),
  ('inventory.view_sensitive', 'inventory', 'view_sensitive', 'Ver datos sensibles de inventario', 'Permite visualizar datos sensibles como números de serie completos.')
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
    'inventory.view',
    'inventory.create',
    'inventory.update',
    'inventory.delete',
    'inventory.assign',
    'inventory.view_sensitive'
  )
WHERE r.role_key = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
  ON p.permission_key IN (
    'inventory.view',
    'inventory.create',
    'inventory.update',
    'inventory.assign'
  )
WHERE r.role_key = 'operator';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
  ON p.permission_key IN ('inventory.view')
WHERE r.role_key IN ('requester', 'viewer');
