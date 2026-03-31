import ModuleScaffold from "../components/layout/ModuleScaffold.jsx";

const sections = [
  {
    value: "queue",
    label: "Mesa",
    meta: "SLA",
    title: "Mesa de servicio",
    description: "Cola, SLA y responsables.",
    summary: [
      { label: "Entrada", value: "Cola", note: "Búsqueda y filtros" },
      { label: "Control", value: "SLA", note: "Vencimiento y prioridad" },
      { label: "Salida", value: "Asignación", note: "Responsable y estado" },
    ],
    flows: [
      {
        meta: "Listado",
        title: "Bandeja",
        items: ["Filtros", "Búsqueda", "Responsable"],
      },
      {
        meta: "Seguimiento",
        title: "Priorización",
        items: ["Urgencia", "Vencimiento", "Estado"],
      },
      {
        meta: "Operación",
        title: "Asignación",
        items: ["Responsable", "Mesa", "Cambio"],
      },
    ],
    checklist: [
      "Filtros y SLA visibles.",
      "Cambio rápido de estado.",
      "Asignación desde bandeja.",
    ],
  },
  {
    value: "detail",
    label: "Detalle",
    meta: "Contexto",
    title: "Detalle de ticket",
    description: "Contexto, impacto y acción.",
    summary: [
      { label: "Vista", value: "Ficha", note: "Resumen sin saturación" },
      { label: "Relación", value: "Activo", note: "Equipo o servicio" },
      { label: "Acción", value: "Edición", note: "Estado y prioridad" },
    ],
    flows: [
      {
        meta: "Contexto",
        title: "Resumen",
        items: ["Solicitante", "Categoría", "Prioridad"],
      },
      {
        meta: "Relación",
        title: "Vínculos",
        items: ["Activo", "Servicio", "Cuenta"],
      },
      {
        meta: "Operación",
        title: "Acciones",
        items: ["Editar", "Mover", "Resolver"],
      },
    ],
    checklist: [
      "Ficha útil desde el arranque.",
      "Acciones rápidas en drawer.",
      "Relación con activo o servicio.",
    ],
  },
  {
    value: "events",
    label: "Eventos",
    meta: "Traza",
    title: "Trazabilidad del ticket",
    description: "Eventos, comentarios y auditoría.",
    summary: [
      { label: "Bitácora", value: "Eventos", note: "Estado y tiempo" },
      { label: "Lectura", value: "Timeline", note: "Secuencia entendible" },
      { label: "Control", value: "Auditoría", note: "Antes y después" },
    ],
    flows: [
      {
        meta: "Historial",
        title: "Timeline",
        items: ["Secuencia", "Estado", "Tiempo"],
      },
      {
        meta: "Comentarios",
        title: "Seguimiento",
        items: ["Notas", "Contexto", "Operación"],
      },
      {
        meta: "Control",
        title: "Sistema",
        items: ["Asignación", "SLA", "Auditoría"],
      },
    ],
    checklist: [
      "Eventos y comentarios separados.",
      "Timeline legible.",
      "Base lista para auditoría.",
    ],
  },
];

function TicketsPage() {
  return (
    <ModuleScaffold
      badgeLabel="Fase 1"
      badgeTone="warning"
      description="Mesa de servicio y seguimiento operativo."
      eyebrow="Operación"
      panelIdPrefix="tickets-module"
      sections={sections}
      title="Tickets"
    />
  );
}

export default TicketsPage;
