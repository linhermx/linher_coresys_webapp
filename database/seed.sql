USE linher_coresys;

SET NAMES utf8mb4;

INSERT IGNORE INTO roles (id, name, description)
VALUES
  (1, 'Admin', 'Acceso total a configuracion, catalogos y operaciones.'),
  (2, 'Operador', 'Operacion diaria sobre tickets, inventario, servicios y telefonia.'),
  (3, 'Solicitante', 'Registro y seguimiento limitado de solicitudes propias.'),
  (4, 'Consultante', 'Visualizacion de tableros y lectura limitada.');

INSERT IGNORE INTO permissions (slug, name)
VALUES
  ('dashboard.view', 'Ver dashboard'),
  ('tickets.view', 'Ver tickets'),
  ('tickets.create', 'Crear tickets'),
  ('tickets.update', 'Actualizar tickets'),
  ('tickets.assign', 'Asignar tickets'),
  ('inventory.view', 'Ver inventario'),
  ('inventory.create', 'Crear inventario'),
  ('inventory.update', 'Actualizar inventario'),
  ('inventory.assign', 'Asignar inventario'),
  ('telephony.view', 'Ver telefonia'),
  ('telephony.create', 'Registrar telefonia'),
  ('telephony.update', 'Actualizar telefonia'),
  ('services.view', 'Ver servicios'),
  ('services.create', 'Registrar servicios'),
  ('services.update', 'Actualizar servicios'),
  ('access.create', 'Registrar accesos'),
  ('access.update', 'Actualizar accesos'),
  ('access.view_sensitive', 'Ver accesos sensibles'),
  ('infrastructure.create', 'Registrar infraestructura'),
  ('infrastructure.update', 'Actualizar infraestructura'),
  ('infrastructure.view', 'Ver infraestructura'),
  ('users.view', 'Ver usuarios'),
  ('users.create', 'Crear usuarios'),
  ('users.update', 'Actualizar usuarios'),
  ('users.delete', 'Eliminar usuarios'),
  ('audit.view', 'Ver auditoria');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles
JOIN permissions
  ON roles.name = 'Admin'
  OR (
    roles.name = 'Operador'
    AND permissions.slug IN (
      'dashboard.view',
      'tickets.view',
      'tickets.create',
      'tickets.update',
      'tickets.assign',
      'inventory.view',
      'inventory.create',
      'inventory.update',
      'inventory.assign',
      'telephony.view',
      'telephony.create',
      'telephony.update',
      'services.view',
      'services.create',
      'services.update',
      'infrastructure.create',
      'infrastructure.update',
      'infrastructure.view',
      'users.view',
      'audit.view'
    )
  )
  OR (
    roles.name = 'Solicitante'
    AND permissions.slug IN (
      'dashboard.view',
      'tickets.view',
      'tickets.create',
      'services.view'
    )
  )
  OR (
    roles.name = 'Consultante'
    AND permissions.slug IN (
      'dashboard.view',
      'tickets.view',
      'inventory.view',
      'telephony.view',
      'services.view',
      'infrastructure.view'
    )
  );

INSERT IGNORE INTO access_media_types (name, description)
VALUES
  ('chip', 'Dispositivo RFID para control de acceso.'),
  ('card', 'Tarjeta RFID para control de acceso.');

INSERT IGNORE INTO access_media_statuses (name, description)
VALUES
  ('available', 'Medio listo para nueva asignacion.'),
  ('assigned', 'Medio actualmente entregado a un trabajador.'),
  ('cancelled', 'Medio retirado del flujo operativo.');
