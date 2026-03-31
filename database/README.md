# CoreSys Database

Carpeta base para la capa de datos de CoreSys.

## Convención de archivos

- `schema.sql`: estructura relacional base
- `seed.sql`: catálogos y datos semilla

## Suposición de entorno

- La base de datos ya existe y se llama `linher_coresys`
- Motor objetivo: MySQL 8+
- Timezone de aplicación: `America/Mexico_City`
- Charset recomendado: `utf8mb4`

## Convenciones

- Tablas en `snake_case`
- Sin prefijos de sistema o branding
- Tablas raíz con sustantivos funcionales en plural
- Tablas de relación con patrón `<entidad>_<entidad>`
- Tablas hijas con patrón `<raiz>_<detalle>`
- Evitar nombres ambiguos o vagos como `_records`, `_data`, `_list` o `_catalog`

## Dominio ya aterrizado

Además de auth, usuarios, RBAC y auditoría, la estructura base ya contempla accesos operativos de personal:
- IDs operativos para checadores
- chips y tarjetas RFID

Reglas:
- `employees` es un directorio operativo mínimo, no un maestro de RH
- el ID operativo nace en CoreSys, pero la captura posterior en Microsip queda fuera del sistema
- chips y tarjetas RFID viven dentro de `Accesos`, no como módulo separado
