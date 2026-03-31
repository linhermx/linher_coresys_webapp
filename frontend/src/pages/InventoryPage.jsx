import ModuleScaffold from "../components/layout/ModuleScaffold.jsx";

const sections = [
  {
    value: "assets",
    label: "Activos",
    meta: "Stock",
    title: "Inventario administrado por Systems",
    description: "Activos bajo control del área.",
    summary: [
      { label: "Entidad", value: "Activos", note: "Equipos y accesorios" },
      { label: "Control", value: "Estado", note: "Recepción, uso o baja" },
      { label: "Lectura", value: "Serie", note: "Modelo y etiqueta" },
    ],
    flows: [
      {
        meta: "Listado",
        title: "Catálogo",
        items: ["Estado", "Tipo", "Ubicación"],
      },
      {
        meta: "Ficha",
        title: "Detalle",
        items: ["Serie", "Custodio", "Contexto"],
      },
      {
        meta: "Control",
        title: "Recepción",
        items: ["Ingreso", "Etiqueta", "Alta"],
      },
    ],
    checklist: [
      "Búsqueda por serie o etiqueta.",
      "Ficha lista para crecer.",
      "Solo activos bajo Systems.",
    ],
  },
  {
    value: "custody",
    label: "Resguardos",
    meta: "Custodia",
    title: "Resguardos y custodia",
    description: "Quién tiene qué.",
    summary: [
      { label: "Responsable", value: "Custodio", note: "Usuario o área" },
      { label: "Relación", value: "Entrega", note: "Asignación activa" },
      { label: "Control", value: "Historial", note: "Cambios visibles" },
    ],
    flows: [
      {
        meta: "Control",
        title: "Activo",
        items: ["Custodio", "Fecha", "Estado"],
      },
      {
        meta: "Seguimiento",
        title: "Pendientes",
        items: ["Sin custodio", "Documento", "Revisión"],
      },
      {
        meta: "Historial",
        title: "Cambios",
        items: ["Movimientos", "Mesas", "Usuarios"],
      },
    ],
    checklist: [
      "Activo y resguardo separados.",
      "Custodio y fecha visibles.",
      "Trazabilidad de cambios.",
    ],
  },
  {
    value: "assignments",
    label: "Asignaciones",
    meta: "Movimiento",
    title: "Asignaciones y devoluciones",
    description: "Entregar, mover y recuperar.",
    summary: [
      { label: "Alta", value: "Entrega", note: "Asignación inicial" },
      { label: "Retorno", value: "Devolución", note: "Cierre o reasignación" },
      { label: "Traza", value: "Movimiento", note: "Historial por activo" },
    ],
    flows: [
      {
        meta: "Salida",
        title: "Asignar",
        items: ["Usuario", "Mesa", "Área"],
      },
      {
        meta: "Retorno",
        title: "Recibir",
        items: ["Devolución", "Observación", "Estado"],
      },
      {
        meta: "Control",
        title: "Historial",
        items: ["Entregas", "Movimientos", "Devoluciones"],
      },
    ],
    checklist: [
      "Asignación y devolución lateral.",
      "Historial por activo.",
      "Sin mezclar ERP o compras.",
    ],
  },
];

function InventoryPage() {
  return (
    <ModuleScaffold
      badgeLabel="Fase 1"
      badgeTone="info"
      description="Activos, resguardos y asignaciones."
      eyebrow="Operación"
      panelIdPrefix="inventory-module"
      sections={sections}
      title="Inventario"
    />
  );
}

export default InventoryPage;
