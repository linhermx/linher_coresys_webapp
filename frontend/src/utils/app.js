export const APP_METADATA = {
  name: "CoreSys",
  description: "Sistema interno de operaciones IT",
  timezone: "America/Mexico_City",
  productStage: "MAP",
};

export const MODULE_CATALOG = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    description: "Visibilidad general de la operación",
  },
  {
    key: "tickets",
    label: "Tickets",
    path: "/tickets",
    description: "Seguimiento de solicitudes internas",
  },
  {
    key: "inventory",
    label: "Inventario",
    path: "/inventory",
    description: "Control de activos y stock técnico",
  },
  {
    key: "telephony",
    label: "Telefonía",
    path: "/telephony",
    description: "Infraestructura y asignaciones de voz",
  },
  {
    key: "services",
    label: "Servicios",
    path: "/services",
    description: "Catálogo operativo y estados",
  },
];

export const NAVIGATION_ITEMS = MODULE_CATALOG.map((module) => ({
  ...module,
  shortLabel: module.label.slice(0, 3).toUpperCase(),
}));
