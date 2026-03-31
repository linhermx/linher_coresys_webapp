import ModuleScaffold from "../components/layout/ModuleScaffold.jsx";

const sections = [
  {
    value: "lines",
    label: "Líneas",
    meta: "Voz",
    title: "Líneas corporativas",
    description: "Asignación y estado.",
    summary: [
      { label: "Entidad", value: "Línea", note: "Número y responsable" },
      { label: "Estado", value: "Operación", note: "Activa, reserva o baja" },
      { label: "Uso", value: "Guardia", note: "Cobertura crítica" },
    ],
    flows: [
      {
        meta: "Listado",
        title: "Base",
        items: ["Número", "Plan", "Estado"],
      },
      {
        meta: "Control",
        title: "Asignación",
        items: ["Responsable", "Cobertura", "Contexto"],
      },
      {
        meta: "Seguimiento",
        title: "Guardia",
        items: ["Críticas", "Reserva", "Revisión"],
      },
    ],
    checklist: [
      "Línea y recarga separadas.",
      "Responsable visible.",
      "Cobertura de guardia.",
    ],
  },
  {
    value: "sims",
    label: "SIMs",
    meta: "Inventario",
    title: "SIMs y stock operativo",
    description: "Disponibles, activas y ligadas.",
    summary: [
      { label: "Entidad", value: "SIM", note: "Chip, carrier y línea" },
      { label: "Control", value: "Stock", note: "Disponible o en uso" },
      { label: "Relación", value: "Asignación", note: "Línea o equipo" },
    ],
    flows: [
      {
        meta: "Stock",
        title: "Disponibles",
        items: ["Alta", "Reemplazo", "Reserva"],
      },
      {
        meta: "Relación",
        title: "Asignadas",
        items: ["Línea", "Equipo", "Responsable"],
      },
      {
        meta: "Control",
        title: "Reemplazos",
        items: ["Cambio", "Historial", "Carrier"],
      },
    ],
    checklist: [
      "SIM, línea y responsable ligados.",
      "Entidad separada de línea.",
      "Filtro por carrier y estado.",
    ],
  },
  {
    value: "recharges",
    label: "Recargas",
    meta: "Seguimiento",
    title: "Recargas y vencimientos",
    description: "Cobertura y próximas fechas.",
    summary: [
      { label: "Ciclo", value: "Recarga", note: "Fecha y monto" },
      { label: "Riesgo", value: "Vencimiento", note: "Cobertura pendiente" },
      { label: "Control", value: "Evento", note: "Historial por línea" },
    ],
    flows: [
      {
        meta: "Calendario",
        title: "Próximas",
        items: ["Vence", "Monto", "Línea"],
      },
      {
        meta: "Operación",
        title: "Registro",
        items: ["Alta", "Saldo", "Fecha"],
      },
      {
        meta: "Historial",
        title: "Eventos",
        items: ["Aplicadas", "Atrasos", "Cobertura"],
      },
    ],
    checklist: [
      "Recargas por vencer primero.",
      "Conexión futura a calendario.",
      "Sin mezclar pagos de servicios.",
    ],
  },
];

function TelephonyPage() {
  return (
    <ModuleScaffold
      badgeLabel="Fase 1"
      badgeTone="success"
      description="Líneas, SIMs y recargas."
      eyebrow="Plataforma"
      panelIdPrefix="telephony-module"
      sections={sections}
      title="Telefonía"
    />
  );
}

export default TelephonyPage;
