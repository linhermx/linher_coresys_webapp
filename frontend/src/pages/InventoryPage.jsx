import Badge from "../components/primitives/Badge.jsx";
import Button from "../components/primitives/Button.jsx";
import Card from "../components/primitives/Card.jsx";
import PageHeader from "../components/primitives/PageHeader.jsx";

function InventoryPage() {
  return (
    <div className="page-section page-section--narrow">
      <PageHeader
        eyebrow="Infraestructura"
        title="Inventario"
        description="Base reservada para activos, stock técnico, asignaciones y trazabilidad patrimonial."
        actions={<Badge tone="info">Estructura inicial</Badge>}
      />

      <Card
        title="Catálogo pendiente de detalle"
        description="La página mantiene la jerarquía final, pero aún no conecta fuentes reales ni formularios."
        actions={<Button disabled>Registrar activo</Button>}
      >
        <div className="placeholder-state">
          <p>
            La navegación y la jerarquía visual ya están listas para sumar equipos,
            accesorios y trazabilidad patrimonial.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default InventoryPage;
