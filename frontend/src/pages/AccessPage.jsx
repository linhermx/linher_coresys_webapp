import ModuleScaffold from "../components/layout/ModuleScaffold.jsx";

const sections = [
  {
    value: "people",
    label: "Personal",
    meta: "Operación",
    title: "Registro operativo de personal",
    description: "Base mínima para asignaciones controladas por Systems.",
    summary: [
      { label: "Entidad", value: "Trabajador", note: "Registro operativo mínimo" },
      { label: "Clave", value: "ID interno", note: "Origen para checador" },
      { label: "Relación", value: "Medio físico", note: "Chip o tarjeta" },
    ],
    flows: [
      {
        meta: "Base",
        title: "Directorio",
        items: ["Nombre", "Área", "ID"],
      },
      {
        meta: "Acceso",
        title: "Requerimiento",
        items: ["Baño", "Chip", "Tarjeta"],
      },
      {
        meta: "Seguimiento",
        title: "Estado",
        items: ["Activo", "Pendiente", "Cancelado"],
      },
    ],
    checklist: [
      "Sin convertirlo en RH.",
      "ID operativo bajo Systems.",
      "Acceso físico cuando aplique.",
    ],
  },
  {
    value: "ids",
    label: "IDs",
    meta: "Checador",
    title: "IDs operativos para checadores",
    description: "Asignación y control del identificador interno.",
    summary: [
      { label: "Origen", value: "CoreSys", note: "Asignación del ID" },
      { label: "Destino", value: "Checador", note: "Uso posterior externo" },
      { label: "Control", value: "Trazabilidad", note: "Alta, cambio o baja" },
    ],
    flows: [
      {
        meta: "Alta",
        title: "Asignación",
        items: ["ID", "Trabajador", "Fecha"],
      },
      {
        meta: "Control",
        title: "Cambios",
        items: ["Reemplazo", "Corrección", "Cancelación"],
      },
      {
        meta: "Vista",
        title: "Bitácora",
        items: ["Operador", "Motivo", "Estado"],
      },
    ],
    checklist: [
      "Microsip queda fuera.",
      "El ID nace aquí.",
      "Con auditoría visible.",
    ],
  },
  {
    value: "media",
    label: "RFID",
    meta: "Físico",
    title: "Chips y tarjetas RFID",
    description: "Inventario operativo de medios de acceso.",
    summary: [
      { label: "Medio", value: "Chip / tarjeta", note: "Tipo físico" },
      { label: "Clave", value: "Código", note: "Único por pieza" },
      { label: "Estado", value: "Disponible", note: "Asignado o cancelado" },
    ],
    flows: [
      {
        meta: "Catálogo",
        title: "Medios",
        items: ["Tipo", "Código", "Estado"],
      },
      {
        meta: "Operación",
        title: "Asignaciones",
        items: ["Trabajador", "Entrega", "Liberación"],
      },
      {
        meta: "Seguimiento",
        title: "Observaciones",
        items: ["No entregado", "Reposición", "Cancelado"],
      },
    ],
    checklist: [
      "Conteo por estado.",
      "Código único obligatorio.",
      "Trazabilidad de entrega.",
    ],
  },
  {
    value: "accounts",
    label: "Cuentas",
    meta: "Técnico",
    title: "Cuentas técnicas administradas por Systems",
    description: "Credenciales y accesos sensibles bajo resguardo del área.",
    summary: [
      { label: "Entidad", value: "Cuenta", note: "Sistema, dueño y estado" },
      { label: "Control", value: "Sensibilidad", note: "Lectura por RBAC" },
      { label: "Relación", value: "Custodio", note: "Responsable operativo" },
    ],
    flows: [
      {
        meta: "Base",
        title: "Catálogo",
        items: ["Sistema", "Tipo", "Estado"],
      },
      {
        meta: "Detalle",
        title: "Ficha",
        items: ["Custodio", "Contexto", "Notas"],
      },
      {
        meta: "Control",
        title: "Ciclo",
        items: ["Alta", "Rotación", "Baja"],
      },
    ],
    checklist: [
      "Solo cuentas bajo Systems.",
      "RBAC para lectura sensible.",
      "Sin volverlo vault general.",
    ],
  },
];

function AccessPage() {
  return (
    <ModuleScaffold
      badgeLabel="Fase 1"
      badgeTone="success"
      description="IDs operativos, RFID y cuentas bajo control de Systems."
      eyebrow="Plataforma"
      panelIdPrefix="access-module"
      sections={sections}
      title="Accesos"
    />
  );
}

export default AccessPage;
