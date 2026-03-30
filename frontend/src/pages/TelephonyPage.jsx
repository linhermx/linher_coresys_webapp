import Badge from "../components/primitives/Badge.jsx";
import Card from "../components/primitives/Card.jsx";
import PageHeader from "../components/primitives/PageHeader.jsx";

function TelephonyPage() {
  return (
    <div className="page-section page-section--narrow">
      <PageHeader
        eyebrow="Infraestructura"
        title="Telefonía"
        description="Vista reservada para numeración, extensiones, asignaciones y estado del servicio."
        actions={<Badge tone="neutral">Referencia</Badge>}
      />

      <Card
        title="Panel listo para integraciones futuras"
        description="Este módulo conserva el mismo esqueleto visual que el resto de CoreSys."
      >
        <div className="placeholder-state">
          <p>
            Aquí se podrán organizar líneas, asignaciones y salud del servicio sin
            mezclarlo con el resto de operaciones.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default TelephonyPage;
