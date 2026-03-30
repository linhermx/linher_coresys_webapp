import Badge from "../components/primitives/Badge.jsx";
import Button from "../components/primitives/Button.jsx";
import Card from "../components/primitives/Card.jsx";
import PageHeader from "../components/primitives/PageHeader.jsx";
import Table from "../components/primitives/Table.jsx";

const ticketColumns = [
  { key: "queue", label: "Cola" },
  { key: "owner", label: "Responsable" },
  { key: "status", label: "Estado" },
];

const ticketRows = [
  {
    id: "mesa-servicio",
    queue: "Mesa de servicio",
    owner: "Sin definir",
    status: "Referencia",
  },
];

function TicketsPage() {
  return (
    <div className="page-section">
      <PageHeader
        eyebrow="Operación IT"
        title="Tickets"
        description="Módulo base para mesa de servicio, SLA, prioridades y seguimiento. Solo se deja lista la arquitectura inicial."
        actions={<Badge tone="warning">Sin lógica operativa</Badge>}
      />

      <Card
        title="Espacio de trabajo"
        description="La interfaz y las primitivas ya están listas para sumar colas, filtros y formularios."
        actions={
          <Button variant="secondary" disabled>
            Nuevo ticket
          </Button>
        }
      >
        <div className="stack">
          <p className="page-copy">
            Este espacio conserva el layout final, pero todavía no crea ni actualiza
            tickets reales.
          </p>
        </div>
      </Card>

      <Card title="Colas iniciales" description="Referencia visual para la tabla base.">
        <Table columns={ticketColumns} rows={ticketRows} />
      </Card>
    </div>
  );
}

export default TicketsPage;
