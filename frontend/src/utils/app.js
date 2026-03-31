export const APP_METADATA = {
  name: "CoreSys",
  description: "Sistema interno de operaciones IT",
  timezone: "America/Mexico_City",
  productStage: "MAP",
  homePath: "/tickets",
};

export const NAVIGATION_SECTIONS = [
  {
    key: "operation",
    label: "Operación",
  },
  {
    key: "platform",
    label: "Plataforma",
  },
];

export const MODULE_CATALOG = [
  {
    key: "tickets",
    label: "Tickets",
    path: "/tickets",
    section: "operation",
    description: "Mesa de servicio, SLA y seguimiento",
  },
  {
    key: "inventory",
    label: "Inventario",
    path: "/inventory",
    section: "operation",
    description: "Activos, resguardos y asignaciones",
  },
  {
    key: "services",
    label: "Servicios",
    path: "/services",
    section: "operation",
    description: "Servicios, pagos y renovaciones",
  },
  {
    key: "telephony",
    label: "Telefonía",
    path: "/telephony",
    section: "platform",
    description: "Líneas, SIMs y recargas",
  },
  {
    key: "access",
    label: "Accesos",
    path: "/access",
    section: "platform",
    description: "Cuentas técnicas y control sensible",
  },
  {
    key: "infrastructure",
    label: "Infraestructura",
    path: "/infrastructure",
    section: "platform",
    description: "Red e infraestructura básica",
  },
];

export const SECONDARY_VIEWS = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    description: "Referencia temporal de operación",
  },
  {
    key: "system-ui",
    label: "UI del sistema",
    path: "/system-ui",
    description: "Vista interna para revisar tokens, shell y primitives base.",
  },
];

export const NAVIGATION_ITEMS = MODULE_CATALOG.map((module) => ({
  ...module,
  shortLabel: module.label.slice(0, 3).toUpperCase(),
}));
