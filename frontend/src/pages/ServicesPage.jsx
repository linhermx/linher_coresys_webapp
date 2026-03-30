import Badge from "../components/primitives/Badge.jsx";
import Button from "../components/primitives/Button.jsx";
import Card from "../components/primitives/Card.jsx";
import PageHeader from "../components/primitives/PageHeader.jsx";

function ServicesPage() {
  return (
    <div className="page-section">
      <PageHeader
        eyebrow="Operación IT"
        title="Servicios"
        description="Zona base para catálogo interno, salud operativa y acuerdos de servicio."
        actions={<Badge tone="success">Módulo listo</Badge>}
      />

      <Card
        title="Estado del módulo"
        description="La estructura ya permite sumar catálogos, dependencias y visibilidad operativa."
        actions={
          <Button variant="ghost" disabled>
            Crear servicio
          </Button>
        }
      >
        <div className="service-grid">
          <div className="service-tile">
            <Badge tone="success">Catálogo</Badge>
            <h3>Modelo listo</h3>
            <p>Espacio preparado para clasificar servicios internos y dependencias.</p>
          </div>
          <div className="service-tile">
            <Badge tone="info">Observabilidad</Badge>
            <h3>Sin integraciones</h3>
            <p>No se conectan métricas ni alertas reales en esta etapa base.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ServicesPage;
