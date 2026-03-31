import ModuleScaffold from "../components/layout/ModuleScaffold.jsx";

const sections = [
  {
    value: "catalog",
    label: "Servicios",
    meta: "Catálogo",
    title: "Catálogo de servicios",
    description: "Servicios bajo control del área.",
    summary: [
      { label: "Entidad", value: "Servicio", note: "Nombre y responsable" },
      { label: "Lectura", value: "Estado", note: "Vigente o en riesgo" },
      { label: "Relación", value: "Proveedor", note: "Contexto externo" },
    ],
    flows: [
      {
        meta: "Base",
        title: "Catálogo",
        items: ["Dueño", "Estado", "Dependencia"],
      },
      {
        meta: "Control",
        title: "Ficha",
        items: ["Proveedor", "Fechas", "Notas"],
      },
      {
        meta: "Seguimiento",
        title: "Salud",
        items: ["Alertas", "Riesgo", "Lectura"],
      },
    ],
    checklist: [
      "Catálogo compacto.",
      "Detalle antes de integraciones.",
      "Servicio y renovación separados.",
    ],
  },
  {
    value: "payments",
    label: "Pagos",
    meta: "Control",
    title: "Pagos operativos",
    description: "Seguimiento de cobertura.",
    summary: [
      { label: "Ciclo", value: "Pago", note: "Periodicidad y fecha" },
      { label: "Relación", value: "Servicio", note: "Vive sobre un servicio" },
      { label: "Control", value: "Estado", note: "Pendiente o cubierto" },
    ],
    flows: [
      {
        meta: "Seguimiento",
        title: "Próximos",
        items: ["Fecha", "Cobertura", "Servicio"],
      },
      {
        meta: "Registro",
        title: "Aplicados",
        items: ["Referencia", "Monto", "Fecha"],
      },
      {
        meta: "Historial",
        title: "Bitácora",
        items: ["Proveedor", "Servicio", "Secuencia"],
      },
    ],
    checklist: [
      "Pago dentro del mismo dominio.",
      "Cobertura y vencimiento visibles.",
      "Relación con renovación.",
    ],
  },
  {
    value: "renewals",
    label: "Renovaciones",
    meta: "Vencimiento",
    title: "Renovaciones y continuidad",
    description: "Próximas fechas y riesgo.",
    summary: [
      { label: "Ciclo", value: "Renovación", note: "Próxima fecha y riesgo" },
      { label: "Impacto", value: "Continuidad", note: "Servicios críticos" },
      { label: "Salida", value: "Calendario", note: "Conexión futura" },
    ],
    flows: [
      {
        meta: "Riesgo",
        title: "Por vencer",
        items: ["Fecha", "Crítico", "Estado"],
      },
      {
        meta: "Control",
        title: "Planeación",
        items: ["Costo", "Paso", "Responsable"],
      },
      {
        meta: "Historial",
        title: "Previas",
        items: ["Secuencia", "Continuidad", "Cobertura"],
      },
    ],
    checklist: [
      "Renovaciones por vencer primero.",
      "Prioridad a servicios críticos.",
      "Mismo dominio de servicios.",
    ],
  },
];

function ServicesPage() {
  return (
    <ModuleScaffold
      badgeLabel="Fase 1"
      badgeTone="warning"
      description="Servicios, pagos y renovaciones."
      eyebrow="Operación"
      panelIdPrefix="services-module"
      sections={sections}
      title="Servicios"
    />
  );
}

export default ServicesPage;
