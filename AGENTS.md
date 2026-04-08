# AGENTS.md

## 1. Naturaleza del proyecto

Coresys es un sistema web interno para el área de Sistemas / IT.

Se construye como un **MAP (Minimum Awesome Product)**:
- debe ser usable desde etapas tempranas
- no es un prototipo desechable
- no se debe intentar generar el sistema completo en un solo paso

Prioridades permanentes:
- claridad
- mantenibilidad
- trazabilidad
- accesibilidad
- escalabilidad real

Este archivo es una guía local de trabajo:
- debe mantenerse versionado en Git como contrato vivo del proyecto
- no debe contradecir decisiones ya aprobadas por el usuario

---

## 2. Alcance real del producto

Dominios del sistema:
- helpdesk / tickets
- inventario de Sistemas
- resguardos y asignaciones
- telefonía corporativa
- servicios, pagos y renovaciones
- cuentas técnicas administradas por Sistemas
- identificadores operativos para checadores bajo control de Sistemas
- chips y tarjetas RFID para accesos físicos controlados por Sistemas
- calendario operativo
- notificaciones
- red e infraestructura básica
- auditoría y trazabilidad
- base de conocimiento

Restricciones de alcance:
- no es un ERP
- no es un sistema de RH
- no es un sistema de compras
- el inventario inicia cuando Sistemas recibe y administra el activo
- no sustituye el maestro de empleados de RH ni la captura posterior en Microsip
- solo se gestionan credenciales, IDs operativos y medios de acceso bajo control de Sistemas
- no se deben centralizar todas las contraseñas de la empresa
- las integraciones externas no deben contaminar la lógica central del dominio

---

## 3. Referencia de estructura

La referencia principal de esqueleto y organización es `linher_move_pwa`.

Coresys puede ser más complejo que Move, pero debe conservar la misma disciplina:
- pocas capas
- estructura clara
- responsabilidades visibles
- sin paquetes o carpetas extra sin justificación real

### 3.1 Move como estándar operativo

`linher_move_pwa` es el estándar de referencia para decisiones de:
- estructura de carpetas
- nombres de archivos y rutas
- organización de módulos backend
- nombres de tablas y relaciones
- comportamientos repetibles entre dominios
- patrones operativos reutilizables

Antes de crear un nuevo archivo, carpeta, tabla, endpoint o convención, se debe verificar si Move ya resuelve una necesidad equivalente.

Si Move ya define una convención válida:
- reutilizar el mismo criterio de naming y ubicación
- mantener la misma lógica de responsabilidades
- evitar reinventar patrones por preferencia personal

Solo se permite desviarse de Move si:
- el dominio real de Coresys exige una diferencia concreta
- la decisión fue aprobada explícitamente por el usuario

Toda desviación respecto a Move debe ser:
- mínima
- justificada
- consistente en todo el proyecto

Stack obligatorio:
- frontend: React + Vite
- backend: Node.js + Express
- database: MySQL
- styling: CSS puro con design tokens

Estructura raíz aprobada:
- `frontend/`
- `backend/`
- `database/`

No usar:
- `bridge/`
- `shared/`
- `core/`
- capas equivalentes que dupliquen responsabilidades

Esqueleto esperado en frontend:
- `src/assets/`
- `src/components/`
- `src/context/`
- `src/hooks/`
- `src/pages/`
- `src/services/`
- `src/utils/`
- `src/App.jsx`
- `src/main.jsx`
- `src/design-tokens.css`
- `src/index.css`

Reglas de frontend:
- `components/` puede subdividirse en `layout/` y `primitives/`
- no crear `data/` o `layouts/` si la responsabilidad ya cabe en `utils/` o `components/`
- evitar fragmentar estilos globales en muchos archivos
- la metadata y navegación compartida viven en `src/utils/`

Reglas de backend:
- mantener `routes/`, `controllers/`, `services/`, `models/`
- configuración base y blueprints en `src/config/`
- `middleware/` para piezas transversales
- no duplicar lógica entre módulos

---

## 4. Flujo de trabajo

Scripts raíz oficiales:
- `npm run install:all`
- `npm run install-all`
- `npm run dev`
- `npm run backend`
- `npm run frontend`
- `npm run build`
- `npm run preview`
- `npm run start`

Reglas:
- no hacer commit sin petición explícita del usuario
- si se hace commit, usar prefijos en inglés: `Feat:`, `Fix:`, `Refactor:`, `Style:`, `Docs:`, `Chore:`, `Audit:`
- los commits deben ser pequeños y trazables; no agrupar demasiados archivos ni cambios de naturaleza distinta si pueden separarse con claridad
- cada commit debe representar un estado coherente al que se pueda regresar sin arrastrar trabajo no relacionado
- preferir varios commits por fase cuando mejoren la trazabilidad: por ejemplo scaffold raíz, backend base, frontend base, database base o documentación
- `AGENTS.md` debe mantenerse versionado porque define el contrato técnico y operativo del proyecto

### 4.1 Flujo Git (one-dev)

Cuando el usuario indique inicializar Git, el flujo oficial será:
- `main` es la rama principal y la fuente de verdad del proyecto real
- no crear una rama `develop`
- cada cambio se trabaja en una rama corta derivada de `main`
- usar nombres de rama en minúsculas y kebab-case con prefijo por intención: `feature/`, `fix/`, `design/`, `refactor/`, `docs/`, `chore/`
- una rama debe agrupar un cambio coherente; no mezclar features no relacionadas
- una vez validado el cambio, la reintegración ocurre hacia `main`
- integrar ramas a `main` con merge commit usando `git merge --no-ff <branch>` para preservar el grafo visual del flujo de desarrollo
- no usar squash merge salvo instrucción explícita del usuario
- no usar fast-forward merge salvo instrucción explícita del usuario

Mientras Git no exista todavía:
- mantener estas reglas como contrato de trabajo
- no asumir un flujo alterno

### 4.2 Migraciones, seeds y archivos temporales

Aunque algunos artefactos sean de una sola ejecución, deben tener ubicación y criterio explícitos.

Ubicaciones esperadas:
- migraciones versionadas en `database/migrations/`
- seeds iniciales o de entorno no productivo en `database/seeds/`
- scripts SQL o utilitarios de apoyo preservables en `database/scripts/`
- ayudas puramente locales, temporales o no versionables en `.agent/` o una ruta ignorada equivalente

Reglas:
- las migraciones deben ser trazables, ordenables y con naming claro; preferir prefijo temporal `YYYYMMDDHHmmss_<description>.sql`
- un seed inicial no debe ser requisito para producción salvo aprobación explícita del usuario
- los scripts de una sola ejecución no deben mezclarse con código de runtime en `backend/` o `frontend/`
- los archivos temporales deben poder eliminarse sin afectar el runtime productivo
- no dejar archivos sueltos de trabajo en la raíz del proyecto
- si un artefacto deja de aportar trazabilidad o reutilidad real, debe permanecer fuera del versionado

Orden de implementación por feature:
1. esquema de base de datos
2. modelos
3. servicios
4. controladores
5. rutas
6. frontend

Reglas de ejecución:
- no mezclar módulos sin necesidad
- no saltarse arquitectura para “avanzar rápido”
- preferir evolución incremental y controlada

---

## 5. Filosofía de construcción (MAP-driven)

Coresys no es un sistema CRUD.

Es una herramienta operativa para el área de Sistemas.

Toda implementación debe partir del comportamiento del dominio, no del código ni de la interfaz.

---

### 5.1 Principios obligatorios

- Design System First (la implementación respeta el sistema de diseño existente, pero no lo redefine aquí)
- Reuse First
- Accessibility First
- Compact Operational UI (orientado a operación, no a presentación)
- MAP-driven development
- Multi-view operational thinking

---

### 5.2 Regla MAP por módulo (MANDATORY)

Antes de desarrollar cualquier módulo o extensión, la IA debe definir explícitamente:

1. propósito operativo del módulo  
2. problema real que resuelve  
3. entidad raíz  
4. ciclo de vida (estados)  
5. flujo principal de uso  
6. acciones críticas del usuario  
7. relaciones con otros módulos  
8. trazabilidad requerida  

No se permite comenzar implementación sin esta definición.

---

### 5.3 Modelo operativo por dominio (Jira-like, no visual)

Coresys debe comportarse como una herramienta operativa robusta.

No se replica Jira visualmente, pero sí sus principios operativos:

- trabajo basado en estados  
- flujo claro de evolución del objeto  
- historial visible  
- eventos y actividad  
- posibilidad de múltiples vistas sobre el mismo dominio  

Cada módulo debe evaluarse para:

- estados (status lifecycle)
- pipeline lógico (flujo de trabajo)
- historial (timeline)
- actividad (event tracking)
- relaciones entre entidades

Ejemplos:

tickets:
- estados: nuevo → en proceso → en espera → resuelto → cerrado  
- pipeline: sí  
- actividad: comentarios + cambios  
- trazabilidad: completa  

inventory:
- estados: disponible → asignado → en reparación → baja  
- pipeline: no  
- historial: sí (movimientos)  

telephony:
- ciclo basado en fechas  
- eventos: recargas  
- historial: sí  

---

### 5.4 Regla de comportamiento (NO UI, solo lógica)

La IA no debe pensar en diseño visual.

Debe pensar en:

- qué datos existen  
- cómo cambian  
- quién los modifica  
- cuándo cambian  
- qué eventos generan  

La interfaz es consecuencia del modelo, no el origen.

---

### 5.5 Protocolo obligatorio por módulo

Toda implementación debe seguir este orden:

1. definición del módulo (MAP)
2. diseño de entidades (3FN)
3. estados y reglas de negocio
4. relaciones entre entidades
5. eventos y trazabilidad
6. backend:
   - models
   - services
   - controllers
   - routes
7. frontend (solo después)

No saltarse pasos.

---

### 5.6 Regla de evolución del sistema

Cuando aparezca una nueva necesidad:

- extender un módulo existente si pertenece al mismo dominio o ciclo de vida
- crear un módulo nuevo solo si representa un dominio claramente distinto

No duplicar lógica.

---

### 5.7 Regla de navegación

- módulos = dominios de primer nivel en sidebar  
- tabs = variaciones o subflujos dentro del mismo dominio  
- no crear items de sidebar para features menores  

---

### 5.8 Regla de consistencia operativa

Todos los módulos deben:

- tener estados claros (cuando aplique)
- tener trazabilidad
- registrar eventos relevantes
- mantener coherencia entre dominios

---

### 5.9 Regla de dominio para `access`

El módulo `access` agrupa:

- cuentas técnicas  
- identificadores operativos para checadores  
- chips y tarjetas RFID  
- medios de acceso físico  

Siempre que Sistemas sea dueño del proceso.

No separar en módulos independientes si pertenecen al mismo ciclo operativo.

---

### 5.10 Regla crítica de incertidumbre

Si la IA no entiende completamente:

- el flujo del módulo  
- el ciclo de vida  
- o la relación con otros dominios  

Debe:

- preguntar  
- no asumir  
- no programar  

---

### 5.11 Enfoque del sistema

El sistema debe sentirse:

- operativo  
- trazable  
- consistente  
- extensible  

No:

- experimental  
- improvisado  
- basado en CRUD  

---

## 6. Contexto del dominio (modelo operativo)

Coresys modela procesos operativos reales del área de Sistemas (IT).

No es un sistema genérico.

Representa flujos reales que ya existen dentro de la operación diaria.

Cada dominio debe entenderse desde su comportamiento en la vida real antes de diseñar datos o código.

---

### 6.1 Identidad operativa

El área de Sistemas es responsable de asignar la identidad operativa de los colaboradores.

Esto incluye:

- asignar un `employee_id` único (numérico)
- registrar al colaborador en sistemas de acceso (checador)
- vincular la identidad con:
  - tarjetas o chips RFID
  - sistemas de acceso físico (ej. control de baño)

Esto NO es RH.

Es identidad operativa gestionada por Sistemas.

Reglas:
- el `employee_id` es único y no se reutiliza
- la identidad persiste aunque el colaborador se dé de baja
- la identidad se vincula a dispositivos físicos

---

### 6.2 Accesos (físicos y lógicos)

El dominio `access` incluye:

- tarjetas RFID
- chips
- asignación de estos dispositivos
- relación con colaboradores
- sistemas de control de acceso (checador, baño, etc.)

Debe permitir saber:

- quién tiene qué dispositivo
- cuándo se asignó
- cuándo se devolvió
- si está activo o cancelado
- cuando un personal se retira el chip puede ser reasignado.

Este dominio es basado en eventos (no sobrescribir información).

---

### 6.3 Inventario (solo Sistemas)

El inventario registra activos bajo control del área de Sistemas.

NO incluye:
- materiales de producción
- almacén general

Comienza cuando Sistemas recibe o toma control del activo.

Incluye:

- laptops
- periféricos
- teléfonos
- dispositivos de red
- dispositivos RFID
- Etc.

Operaciones:

- alta de activo
- seguimiento de estado
- asignación
- historial de movimientos

---

### 6.4 Resguardos (asignación de activos)

Los activos se asignan a colaboradores.

Se debe registrar:

- a quién se asignó
- cuándo se asignó
- estado al momento de entrega
- estado al momento de devolución
- historial completo

Regla:
- los registros son eventos (no se sobrescriben)

---

### 6.5 Telefonía

Sistemas administra líneas telefónicas corporativas.

Incluye:

- asignación de números a colaboradores
- gestión de SIMs
- control de recargas
- calendario de recargas

Conceptos clave:

- las recargas son eventos en el tiempo
- cada línea tiene ciclo de vida
- se debe conservar historial

---

### 6.6 Servicios y renovaciones

Sistemas administra servicios digitales.

Ejemplos:

- hosting
- SaaS
- licencias

Operaciones:

- registrar servicio
- definir periodicidad
- calcular próxima fecha de pago
- registrar pagos
- detectar vencimientos

Dominio orientado a tiempo y eventos.

---

### 6.7 Tickets (soporte)

Los tickets representan solicitudes o incidencias.

Se usan para:

- seguimiento de problemas
- soporte interno
- gestión de tareas operativas

Características:

- flujo por estados
- comentarios
- historial completo
- relación con:
  - usuarios
  - activos
  - servicios

---

### 6.8 Cuentas de acceso (credenciales técnicas)

Solo incluye cuentas administradas por Sistemas.

Se registra:

- plataforma
- usuario
- responsable
- última actualización
- secreto (opcional y restringido)

Regla:
- no centralizar todas las contraseñas de la empresa

---

### 6.9 Red e infraestructura

Sistemas gestiona infraestructura básica:

- IPs
- segmentos de red
- dispositivos

No es monitoreo avanzado, solo control operativo.

---

### 6.10 Notificaciones

El sistema genera eventos.

Estos disparan:

- notificaciones internas
- mensajes en Telegram

Las notificaciones son configurables por reglas.

---

### 6.11 Calendario operativo

El calendario no es un módulo independiente.

Es una capa que agrega:

- recargas
- renovaciones
- eventos operativos

---

### 6.12 Regla crítica del dominio

Antes de diseñar cualquier tabla o API:

El sistema debe:

1. entender el proceso real
2. identificar el objeto principal
3. identificar eventos y estados
4. definir relaciones

Solo después:

→ diseñar base de datos  
→ diseñar servicios  
→ implementar  

---

## 7. Sistema de diseño

Fuentes de verdad visual:
- `frontend/src/design-tokens.css`
- `frontend/src/index.css`

Contexto visual vivo del proyecto:
- `.impeccable.md`
- `.github/copilot-instructions.md`

Separación de responsabilidades:
- `AGENTS.md` define reglas duras de implementación, estructura y validación
- `.impeccable.md` y `.github/copilot-instructions.md` definen intención visual, personalidad, referencias y anti-referencias
- si hay duplicidad, mantener la regla técnica en `AGENTS.md` y el criterio subjetivo de diseño en los archivos de contexto visual

Reglas base:
- no crear nuevos archivos globales de CSS sin necesidad real
- no hacer styling ad hoc por módulo
- si un patrón ya existe, reutilizarlo
- si falta una pieza reusable, crearla en `components/primitives/` o `components/layout/`
- si se toca la base visual, revisar también `/system-ui`
- toda vista debe priorizar interacción rápida, jerarquía clara, navegación limpia y tablas no saturadas

Primitives base del sistema:
- `Button`
- `Badge`
- `Card`
- `Table`
- `Input`
- `Modal` o `Drawer`
- `Tabs` o elementos equivalentes de navegación interna
- `PageHeader`
- `ThemeToggle`
- `Sidebar`
- `Topbar`
- `AppShell`

Reglas de estilo:
- no usar inline styles salvo para valores realmente dinámicos
- no hardcodear colores en JSX
- si un valor se repite, debe promoverse a token
- las fuentes externas deben cargarse desde Google Fonts cuando estén disponibles

### 7.1 Protocolo de construcción de interfaces

Las interfaces se trabajarán solo cuando el usuario lo indique explícitamente.

Reglas:
- no adelantarse a construir pantallas durante la definición MAP, modelado de datos o backend
- cuando toque trabajo de interfaces, usar la skill `frontend-design` como flujo base y luego pulir con los comandos y herramientas necesarios
- todo trabajo de UI debe seguir sujeto a Move como estándar, al sistema de diseño vigente y a las reglas de accesibilidad
- si la skill `frontend-design` no está disponible en el entorno, se debe informar antes de avanzar con una alternativa

---

## 8. CSS, nomenclatura y densidad

Regla general:
- no usar el nombre del sistema en clases nuevas
- no usar el nombre del sistema en variables CSS nuevas
- no usar el nombre del sistema en módulos o componentes nuevos

Metodología obligatoria:
- usar BEM en clases nuevas

Ejemplos:
- bloque: `.sidebar`
- elemento: `.sidebar__item`
- modificador: `.sidebar--collapsed`

Evitar:
- `.box`
- `.item2`
- `.left`
- nombres ambiguos o acoplados al layout del momento

Tokens esperados:
- color
- spacing
- radius
- shadow
- typography
- layout metrics
- surface and shell tokens

---

## 9. Shell, layout e iconografía

Shell oficial:
- sidebar a la izquierda solo en desktop, mobile buscar estrategia diferente
- topbar superior
- contenido principal con jerarquía clara

Reglas del sidebar:
- branding o nombre del sistema arriba
- estado activo claro
- no poner descripciones largas en cada item

Reglas del topbar:
- no duplicar navegación del sidebar
- funciones generales o sumamente importantes
- debe ordenar contexto, acciones y estado global
- no usar controles redundantes

Iconografía:
- usar iconografía real
- no usar símbolos ASCII como iconos
- `lucide-react` es la librería base actual

---

## 10. Accesibilidad

La accesibilidad no es opcional. Es parte del sistema base.

Base:
- objetivo mínimo: `WCAG AA`
- toda interfaz nueva debe funcionar con teclado
- todo control interactivo debe tener nombre accesible
- no depender solo de color para comunicar estado
- mantener contraste suficiente
- conservar landmarks y headings semánticos
- no eliminar focus visible sin reemplazo equivalente

Formularios:
- todo `input`, `textarea`, `select` o control equivalente debe tener `id`, `name` y label asociada
- si no hay label visible, usar label visualmente oculta o `aria-label`

Icon buttons:
- todo icon button debe llevar `aria-label`
- si un control abre o cierra algo, reflejar el estado con icono, `aria-expanded` o ambos

Overlays:
- todo modal, drawer o menú nuevo debe soportar teclado
- debe cerrar con `Escape` cuando aplique
- debe cerrar con click fuera cuando aplique
- los diálogos deben usar `role="dialog"` y `aria-modal="true"`

Tablas:
- usar `<table>`, `<thead>`, `<tbody>` y `scope="col"` cuando la información sea tabular
- no reemplazar tablas reales por grids con `div`

---

## 11. Backend, RBAC y auditoría

Backend:
- modular por dominio
- sin lógica de negocio en rutas
- los servicios manejan reglas de negocio
- no implementar lógica completa si el usuario no la pidió

Módulos base actuales:
- `auth`
- `users`
- `tickets`
- `inventory`
- `telephony`
- `services`
- `access`
- `infrastructure`

RBAC:
- roles base: `admin`, `operator`, `requester`, `viewer`
- permisos base: `view`, `create`, `update`, `delete`, `assign`, `view_sensitive`
- el enforcement debe existir a nivel API y a nivel UI

Auditoría:
- debe existir desde etapas tempranas
- toda acción relevante debe poder registrar:
  - `operator_id`
  - tipo de acción
  - entidad afectada
  - timestamp
  - cambios antes y después cuando aplique

Integraciones:
- una integración externa no define el modelo central del dominio
- Telegram u otras integraciones deben entrar por servicios o adaptadores del backend
- no reintroducir una carpeta raíz `bridge/` sin necesidad técnica real y aprobación explícita del usuario

Eventos base de notificación:
- `ticket_created`
- `ticket_updated`
- `ticket_overdue`
- `recharge_due_soon`
- `recharge_overdue`
- `service_due_soon`
- `service_overdue`
- `service_paid`

---

## 12. Base de datos

Reglas obligatorias:
- MySQL como fuente relacional principal
- 3FN obligatoria
- no usar JSON como sustituto de relaciones
- JSON solo para logs o snapshots
- llaves foráneas explícitas
- no duplicar campos entre entidades si deben normalizarse

Tablas complementarias:
- separar `statuses`, `types` y `categories` cuando el dominio lo requiera
- se permite un directorio operativo mínimo de trabajadores cuando haga falta asignar IDs o medios físicos sin convertir el sistema en RH

Nomenclatura de tablas:
- usar `snake_case`
- no usar prefijos de branding o tipo: no `cs_`, no `tbl_`, no `app_`
- tablas raíz en plural funcional: `users`, `tickets`, `assets`, `services`
- tablas de relación con patrón `<entity>_<entity>`: `user_roles`, `role_permissions`, `ticket_assets`
- tablas hijas con patrón `<root>_<detail>`: `ticket_comments`, `ticket_events`, `asset_assignments`
- para configuraciones o integraciones, usar nombres funcionales: `global_settings`, `integration_connections`, `audit_logs`
- evitar sufijos vagos como `_catalog`, `_records`, `_data`, `_list` si no describen una diferencia real
- si existe un patrón equivalente en Move, conservar la misma lógica de naming salvo que el dominio de Coresys requiera una diferencia real

Nomenclatura de columnas:
- primary key por defecto: `id`
- foreign keys: `<entity>_id`
- estado: `status`
- claves funcionales: `<something>_key`
- timestamps: `created_at`, `updated_at`, `deleted_at`, `last_synced_at`

Zona horaria oficial:
- `America/Mexico_City`

---

## 13. Idioma y calidad de salida

Reglas de idioma:
- todo texto visible al usuario debe estar en español
- código, nombres técnicos, variables y comentarios deben estar en inglés
- mantener ortografía correcta
- todos los archivos editados deben quedar legibles en UTF-8

Una tarea UI se considera cerrada solo si:
- respeta el esqueleto organizacional de Move
- respeta BEM en clases nuevas
- no introduce el nombre del sistema en nuevas clases, variables o módulos
- conserva la centralización en `design-tokens.css` e `index.css`
- respeta el contexto visual vigente documentado en `.impeccable.md` y `.github/copilot-instructions.md`
- mantiene consistencia con shell y primitives
- mantiene densidad compacta
- funciona en `light` y `dark`
- usa iconografía real
- cumple accesibilidad base
- `/system-ui` sigue coherente si se tocó la base visual
- el frontend compila con `npm run build`

Si una IA duda entre crear algo nuevo o reutilizar, debe reutilizar.
