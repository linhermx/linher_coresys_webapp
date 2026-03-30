# TODO.md

## 1. Objetivo

Plan de trabajo para construir CoreSys como sistema real, por fases, con evolución controlada y entregables usables desde etapas tempranas.

Este plan asume:
- la base actual es un scaffold inicial
- la estructura visual actual no es la versión final
- la UI, la BBDD y el backend deben evolucionar en paralelo
- el orden por feature sigue la regla de `AGENTS.md`: schema, models, services, controllers, routes, frontend

---

## 2. Estrategia de ejecución

Reglas operativas:
- trabajar por slices verticales, no por capas aisladas durante demasiado tiempo
- cada fase debe dejar algo visible y usable
- no modelar todos los dominios a profundidad desde el día uno
- cerrar primero foundation, luego operaciones core, luego extensiones
- extender módulos existentes antes de abrir nuevos módulos

Cada slice debe cubrir:
- diseño de entidad y relaciones
- cambios de esquema SQL
- modelos y servicios
- controladores y rutas
- UI mínima usable
- validación de accesibilidad
- validación visual en `/system-ui` si se tocaron primitives o shell

Definición de terminado por slice:
- frontend compila
- backend levanta
- esquema documentado
- naming consistente
- UI en español
- light y dark correctos
- sin romper shell, tokens o accesibilidad base

---

## 3. Ruta de desarrollo

## Fase 0. Reestructura base y checkpoint técnico

Objetivo:
- convertir el scaffold actual en una base real de construcción antes de entrar a módulos con lógica

### BBDD
- definir estrategia de scripts SQL: base, catálogos, seeds y evolución
- consolidar nomenclatura oficial de tablas y columnas
- aterrizar foundation schema para auth, RBAC y auditoría
- definir qué catálogos serán tablas separadas desde el inicio

### Backend
- estabilizar `config`, `database`, `middleware` y arranque del servidor
- dejar auth, RBAC y auditoría como base reusable, aunque la lógica siga parcial
- definir contratos de respuesta y manejo de errores
- dejar healthcheck, timezone y bootstrap consistentes

### Frontend / UI
- reestructurar shell hacia una versión más cercana a la organización final
- redefinir la arquitectura del topbar y dashboard para evitar información regada
- cerrar primitives faltantes del sistema:
  - `Input`
  - `Modal` o `Drawer`
  - `Tabs`
- validar densidad, tamaños, sidebar y jerarquía visual
- mantener `System UI` como panel de verificación del design system

### Salida esperada
- base de datos foundation clara
- shell y primitives listas para construir producto real
- documentación operativa actualizada
- primer punto estable para empezar desarrollo modular real

---

## Fase 1. Foundation usable

Objetivo:
- dejar lista la base operativa común del sistema

### BBDD
- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `audit_logs`
- tablas auxiliares mínimas para autenticación y sesión, si aplican

### Backend
- módulo `auth` con sesión base
- módulo `users` con perfil base y consulta de usuario actual
- enforcement inicial de RBAC en API
- auditoría base en acciones relevantes

### Frontend / UI
- flujo base de sesión
- contexto de usuario real en shell
- dashboard foundation orientado a operación
- placeholders de módulos ya alineados a la navegación final

### Criterio de cierre
- login y sesión base listos
- usuario visible en shell
- RBAC y auditoría ya no solo como estructura pasiva

---

## Fase 2. Tickets

Objetivo:
- construir el primer módulo operativo real

### BBDD
- `ticket_statuses`
- `ticket_priorities`
- `ticket_categories`
- `tickets`
- `ticket_comments`
- `ticket_events`
- tablas relacionadas solo si aportan a flujo real

### Backend
- crear ticket
- listar tickets
- ver detalle
- actualizar ticket
- cambiar estado
- asignar responsable
- registrar auditoría y eventos

### Frontend / UI
- vista de listado con filtros y búsqueda clara
- vista de detalle
- timeline o historial
- formulario de alta y edición
- tabs internas si ayudan a separar detalle, comentarios y eventos

### Criterio de cierre
- módulo usable por operador
- trazabilidad visible
- tablas y detalle sin saturación visual

---

## Fase 3. Inventario y resguardos

Objetivo:
- controlar activos administrados por Systems y su asignación

### BBDD
- `asset_types`
- `asset_statuses`
- `assets`
- `asset_assignments`
- catálogos adicionales solo si ya son necesarios

### Backend
- intake de activo
- alta y edición de inventario
- asignación y devolución
- historial de movimientos
- auditoría de cambios sensibles

### Frontend / UI
- listado de inventario
- ficha de activo
- flujo de asignación
- historial por activo
- filtros por estado, tipo y resguardo

### Criterio de cierre
- inventario real de Systems controlable desde UI
- resguardos operables y trazables

---

## Fase 4. Telefonía, servicios y calendario

Objetivo:
- cubrir las extensiones operativas que más dependen de vencimientos y seguimiento

### BBDD
- `phone_lines`
- `sim_cards`
- `recharge_events`
- `services`
- `service_renewals`
- `calendar_events`

### Backend
- telefonía: líneas, SIMs y recargas
- servicios: alta, vencimientos, pagos y renovaciones
- calendario operativo ligado a eventos reales
- eventos de notificación base relacionados con vencimientos

### Frontend / UI
- módulo de telefonía con tabs por líneas, SIMs y recargas
- módulo de servicios con renovaciones y estados
- calendario operativo conectado a tickets, recargas o renovaciones cuando aplique

### Criterio de cierre
- seguimiento de vencimientos y recargas funcionando
- UI modular sin inflar el sidebar innecesariamente

---

## Fase 5. Accesos, notificaciones y red

Objetivo:
- cubrir dominios avanzados que requieren más madurez de foundation

### BBDD
- `access_accounts`
- `notification_rules`
- `telegram_groups`
- `network_devices`
- `network_segments`
- `ip_assignments`

### Backend
- gestión de cuentas técnicas bajo control de Systems
- motor base de notificaciones orientado a eventos
- integración Telegram desacoplada del dominio central
- módulo inicial de red e infraestructura

### Frontend / UI
- módulo de accesos con foco en trazabilidad
- módulo de notificaciones y reglas
- módulo de red con vistas operativas compactas

### Criterio de cierre
- nuevos módulos ya montados sobre patrones maduros
- sin duplicar lógica ni diseño

---

## Fase 6. Base de conocimiento, reportes y optimización

Objetivo:
- cerrar el MAP con herramientas de soporte y mejora operativa

### BBDD
- `knowledge_articles`
- tablas de soporte para reportes solo si son necesarias

### Backend
- consultas agregadas para reportes
- optimización de endpoints
- afinamiento de auditoría y performance

### Frontend / UI
- base de conocimiento
- reportes operativos
- refinamiento general de UX, densidad, accesibilidad y navegación

### Criterio de cierre
- plataforma usable de punta a punta
- consistencia transversal en todos los módulos

---

## 4. Backlog inmediato recomendado

Orden sugerido para empezar de verdad:
- cerrar Fase 0 antes de abrir lógica pesada de negocio
- iniciar Fase 1 apenas el shell y el foundation schema queden estabilizados
- entrar a Tickets como primer módulo operativo completo
- entrar a Inventario y resguardos como segundo bloque real

Siguiente slice recomendado:
- definir foundation schema real de auth, RBAC y auditoría
- rediseñar topbar y dashboard a una arquitectura final de información
- completar `Input`, `Modal` o `Drawer` y `Tabs`
- dejar listo el flujo de sesión base

---

## 5. Estrategia de Git recomendada

Estado actual observado:
- el repositorio todavía no tiene commits
- todo el scaffold actual sigue como baseline local

Recomendación:
- sí conviene empezar a hacer commits, pero no comenzar con commits diminutos sobre un repo sin checkpoint
- primero conviene crear un commit base que congele el scaffold actual aceptado
- después de ese punto, sí conviene trabajar con commits pequeños y coherentes por slice

Secuencia sugerida:
1. commit base del proyecto
2. commit de reestructura del shell y foundation UI
3. commit de foundation schema y backend base
4. commits por módulo o submódulo, siempre en slices coherentes

Qué sí es un buen commit pequeño:
- una reestructura clara del shell
- un bloque de schema SQL coherente
- RBAC base end-to-end
- Tickets listado y detalle

Qué no conviene:
- commits cosméticos aislados sin valor de checkpoint
- mezclar varios módulos en un mismo commit
- dejar un commit a mitad de schema o a mitad de flujo

Branching sugerido:
- `main` como base estable
- trabajo en `feature/<modulo>-<objetivo-corto>`

Conclusión práctica:
- no esperaría a tener “la organización final completa” para empezar a commitear
- sí haría primero un checkpoint base
- después avanzaría por slices pequeños y funcionales
