import { MODULE_CATALOG } from "../utils/app.js";
import { Link } from "react-router-dom";
import Badge from "../components/primitives/Badge.jsx";
import Card from "../components/primitives/Card.jsx";
import PageHeader from "../components/primitives/PageHeader.jsx";
import Table from "../components/primitives/Table.jsx";

const dashboardColumns = [
  { key: "module", label: "Módulo" },
  { key: "status", label: "Estado" },
  { key: "scope", label: "Alcance inicial" },
];

const dashboardRows = MODULE_CATALOG.map((module) => ({
  id: module.key,
  module: module.label,
  status: "Base lista",
  scope: module.description,
}));

const chartHeights = [44, 56, 38, 72, 65, 84, 58, 92, 76, 60];

function DashboardPage() {
  return (
    <div className="page-section">
      <PageHeader
        eyebrow="Operación central"
        title="Panel de control"
        description="Base visual con lenguaje tech, acento morado y modo claro u oscuro sobre la misma estructura. La arquitectura ya está lista para crecer sin meter lógica de negocio real todavía."
        actions={
          <>
            <Badge tone="info">Tech moderno</Badge>
            <Link className="button button--ghost button--md" to="/system-ui">
              Ver UI del sistema
            </Link>
          </>
        }
      />

      <div className="dashboard-grid dashboard-grid--hero">
        <Card
          className="dashboard-spotlight"
          title="Stack base"
          description="La base ya se siente producto SaaS y no wireframe."
          variant="accent"
        >
          <div className="dashboard-spotlight__layout">
            <div className="dashboard-spotlight__copy">
              <div className="stack">
                <h2 className="dashboard-spotlight__title">
                  Operación técnica <span>lista para escalar</span>
                </h2>
                <p className="page-copy">
                  Sidebar fijo, UI del sistema consistente y módulos listos para crecer
                  con tickets, inventario, telefonía y servicios.
                </p>
              </div>

              <div className="dashboard-chip-row">
                <Badge tone="info">Núcleo morado</Badge>
                <Badge tone="success">RBAC listo</Badge>
                <Badge tone="neutral">API modular</Badge>
              </div>
            </div>

            <div className="dashboard-signal">
              <div className="dashboard-signal__ring" aria-hidden="true" />
            </div>
          </div>
        </Card>

        <div className="dashboard-status-grid">
          <Card
            className="dashboard-stat"
            title="Módulos activos"
            description="Shell principal preparado"
          >
            <strong className="dashboard-stat__value">05</strong>
          </Card>
          <Card
            className="dashboard-stat"
            title="Permisos base"
            description="Roles y permisos compartidos"
          >
            <strong className="dashboard-stat__value">RBAC</strong>
          </Card>
          <Card
            className="dashboard-stat"
            title="Traza operativa"
            description="Auditoría estructurada"
          >
            <strong className="dashboard-stat__value">ON</strong>
          </Card>
        </div>
      </div>

      <div className="page-grid page-grid--two">
        <Card
          title="Cobertura inicial"
          description="Vista base del alcance funcional preparado para el MAP."
        >
          <Table columns={dashboardColumns} rows={dashboardRows} />
        </Card>

        <Card
          title="Telemetría del lanzamiento"
          description="Referencia visual para tendencias, salud de módulos y actividad operativa."
        >
          <div className="dashboard-chart">
            <div className="dashboard-chart__bars" aria-hidden="true">
              {chartHeights.map((height, index) => (
                <span
                  key={index}
                  className="dashboard-chart__bar"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="dashboard-chart__legend">
              <span>Incidentes</span>
              <span>Capacidad</span>
              <span>Visibilidad</span>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Mapa de módulos"
        description="Punto de partida visual para la expansión del sistema sin mezclar dominios."
      >
        <div className="dashboard-module-grid">
          {MODULE_CATALOG.map((module) => (
            <article key={module.key} className="dashboard-module-tile">
              <Badge tone="neutral">{module.label}</Badge>
              <h3>{module.label}</h3>
              <p>{module.description}</p>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default DashboardPage;
