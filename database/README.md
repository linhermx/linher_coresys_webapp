# CoreSys Database

Base folder para la capa de datos de CoreSys.

## Objetivo inicial

- Centralizar el esquema minimo del proyecto.
- Preparar cimientos para RBAC y auditoria.
- Reservar espacio para tablas de dominio futuras sin definir negocio completo todavia.

## Convenciones

- Motor objetivo: MySQL 8+
- Timezone de aplicación: `America/Mexico_City`
- Charset recomendado: `utf8mb4`
- Tablas en `snake_case`
- Sin prefijos de sistema o branding
- Tablas raíz con sustantivos funcionales en plural: `users`, `tickets`, `assets`, `services`
- Tablas de relación con patrón `<entidad>_<entidad>`: `user_roles`, `role_permissions`
- Tablas hijas con patrón `<raiz>_<detalle>`: `ticket_comments`, `asset_assignments`
- Evitar nombres ambiguos o vagos como `_records`, `_data`, `_list` o `_catalog` si no aportan una diferencia técnica real
- Para módulos amplios, definir primero la entidad raíz antes de crear la tabla. Ejemplo: preferir `phone_lines` a `telephony_records`

## Siguiente paso sugerido

Usar `schema/001_base_foundation.sql` como punto de partida y sumar migraciones incrementales para usuarios, tickets, activos, telefonía y servicios respetando la misma convención de nombres.
