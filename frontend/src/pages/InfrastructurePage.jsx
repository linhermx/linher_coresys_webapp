import ModuleScaffold from "../components/layout/ModuleScaffold.jsx";

const sections = [
  {
    value: "network",
    label: "Red",
    meta: "Base",
    title: "Red e infraestructura básica",
    description: "Contexto técnico compartido.",
    summary: [
      { label: "Entidad", value: "Red", note: "Segmentos y enlaces" },
      { label: "Control", value: "Estado", note: "Disponibilidad y riesgo" },
      { label: "Relación", value: "Activo", note: "Dispositivo o servicio" },
    ],
    flows: [
      {
        meta: "Vista",
        title: "Panorama",
        items: ["Riesgo", "Segmento", "Responsable"],
      },
      {
        meta: "Detalle",
        title: "Segmentos",
        items: ["Zona", "Tramo", "Contexto"],
      },
      {
        meta: "Operación",
        title: "Incidencia",
        items: ["Cruce", "Ticket", "Servicio"],
      },
    ],
    checklist: [
      "Sin mezclar tickets o inventario.",
      "Lectura compacta.",
      "Infraestructura real.",
    ],
  },
  {
    value: "devices",
    label: "Dispositivos",
    meta: "Equipos",
    title: "Dispositivos e infraestructura operativa",
    description: "Equipos con contexto propio.",
    summary: [
      { label: "Entidad", value: "Dispositivo", note: "Tipo y ubicación" },
      { label: "Control", value: "Rol", note: "Core, acceso o soporte" },
      { label: "Lectura", value: "Salud", note: "Señales útiles" },
    ],
    flows: [
      {
        meta: "Catálogo",
        title: "Base",
        items: ["Tipo", "Ubicación", "Estado"],
      },
      {
        meta: "Detalle",
        title: "Ficha",
        items: ["Responsable", "Notas", "Contexto"],
      },
      {
        meta: "Relación",
        title: "Dependencias",
        items: ["Servicio", "Red", "Ticket"],
      },
    ],
    checklist: [
      "Dispositivos distintos de activos.",
      "Relaciones sin duplicidad.",
      "Enfoque técnico.",
    ],
  },
  {
    value: "operations",
    label: "Operación",
    meta: "Transversal",
    title: "Base operativa transversal",
    description: "Lo compartido que no va al sidebar.",
    summary: [
      { label: "Contexto", value: "Base", note: "Documentación y referencias" },
      { label: "Cruce", value: "Vínculos", note: "Red, tickets y servicios" },
      { label: "Límite", value: "Transversal", note: "Sin inflar navegación" },
    ],
    flows: [
      {
        meta: "Soporte",
        title: "Contexto",
        items: ["Referencia", "Operación", "Base"],
      },
      {
        meta: "Relación",
        title: "Cruce",
        items: ["Calendario", "Auditoría", "Alertas"],
      },
      {
        meta: "Decisión",
        title: "Crecimiento",
        items: ["Evaluar", "Escalar", "Separar"],
      },
    ],
    checklist: [
      "Calendario sigue transversal.",
      "Auditoría y alertas fuera del sidebar.",
      "Ordenar arquitectura sin inflar navegación.",
    ],
  },
];

function InfrastructurePage() {
  return (
    <ModuleScaffold
      badgeLabel="Fase 1"
      badgeTone="info"
      description="Red, equipos y contexto técnico."
      eyebrow="Plataforma"
      panelIdPrefix="infrastructure-module"
      sections={sections}
      title="Infraestructura"
    />
  );
}

export default InfrastructurePage;
