import { Link } from "react-router-dom";
import Badge from "../components/primitives/Badge.jsx";
import Button from "../components/primitives/Button.jsx";
import Card from "../components/primitives/Card.jsx";
import PageHeader from "../components/primitives/PageHeader.jsx";
import Table from "../components/primitives/Table.jsx";

const colorTokens = [
  { key: "Acento morado", value: "var(--primary)" },
  { key: "Acento cian", value: "var(--accent-cyan)" },
  { key: "Éxito", value: "var(--success)" },
  { key: "Advertencia", value: "var(--warning)" },
  { key: "Error", value: "var(--danger)" },
  { key: "Superficie", value: "var(--surface)" },
];

const spacingTokens = [
  "var(--spacing-xs)",
  "var(--spacing-sm)",
  "var(--spacing-md)",
  "var(--spacing-lg)",
  "var(--spacing-xl)",
];

const tableColumns = [
  { key: "component", label: "Componente" },
  { key: "state", label: "Estado" },
  { key: "notes", label: "Notas" },
];

const tableRows = [
  {
    id: "button",
    component: "Button",
    state: "Listo",
    notes: "Variantes primaria, secundaria y ghost.",
  },
  {
    id: "card",
    component: "Card",
    state: "Listo",
    notes: "Header, acciones y variante accent.",
  },
  {
    id: "table",
    component: "Table",
    state: "Listo",
    notes: "Tabla base sin scroll infinito.",
  },
  {
    id: "badge",
    component: "Badge",
    state: "Listo",
    notes: "Badges de estado y metadatos.",
  },
];

function ColorSwatch({ label, value }) {
  return (
    <div className="system-ui__swatch">
      <div className="system-ui__swatch-chip" style={{ background: value }} />
      <div className="system-ui__swatch-copy">
        <strong>{label}</strong>
        <span>{value}</span>
      </div>
    </div>
  );
}

function SpacingSample({ token }) {
  return (
    <div className="system-ui__spacing-item">
      <div className="system-ui__spacing-rule">
        <span style={{ width: token }} />
      </div>
      <code>{token}</code>
    </div>
  );
}

function SystemUiPage() {
  return (
    <div className="page-section">
      <PageHeader
        eyebrow="Vista interna"
        title="UI del sistema"
        description="Panel de referencia para revisar la base visual compartida de familia LINHER, el modo claro y oscuro, y los ajustes propios de CoreSys antes de tocar producto real."
        actions={
          <Link className="button button--secondary button--md" to="/dashboard">
            Volver al dashboard
          </Link>
        }
      />

      <div className="page-grid page-grid--two">
        <Card
          title="Capas del sistema visual"
          description="Esta separación ayuda a que Move, Axis y CoreSys se parezcan sin volverse clones."
        >
          <div className="stack">
            <div className="system-ui__layer">
              <Badge tone="info">1</Badge>
              <div>
                <strong>Base LINHER</strong>
                <p>Tipografía, espaciado, radios, sombras y color base compartidos.</p>
              </div>
            </div>
            <div className="system-ui__layer">
              <Badge tone="info">2</Badge>
              <div>
                <strong>Tema de CoreSys</strong>
                <p>Superficies, contraste y matices propios del dominio IT.</p>
              </div>
            </div>
            <div className="system-ui__layer">
              <Badge tone="info">3</Badge>
              <div>
                <strong>Shell y primitivas</strong>
                <p>Sidebar, topbar, cards, botones, badges y tablas reutilizables.</p>
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="Acciones de referencia"
          description="Punto rápido para validar contraste, jerarquía y consistencia de interacción."
        >
          <div className="system-ui__button-row">
            <Button>Primario</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="system-ui__button-row">
            <Badge tone="neutral">Neutral</Badge>
            <Badge tone="info">Info</Badge>
            <Badge tone="success">Éxito</Badge>
            <Badge tone="warning">Advertencia</Badge>
          </div>
        </Card>
      </div>

      <Card
        title="Paleta activa"
        description="Los tokens principales visibles en CoreSys ya viven encima de la foundation compartida."
      >
        <div className="system-ui__swatch-grid">
          {colorTokens.map((token) => (
            <ColorSwatch key={token.key} label={token.key} value={token.value} />
          ))}
        </div>
      </Card>

      <div className="page-grid page-grid--two">
        <Card
          title="Escala de spacing"
          description="Referencia rápida para revisar ritmo vertical y respiración de componentes."
        >
          <div className="stack">
            {spacingTokens.map((token) => (
              <SpacingSample key={token} token={token} />
            ))}
          </div>
        </Card>

        <Card
          title="Tipografía y tono"
          description="La voz visual debe sentirse limpia, operativa y claramente LINHER."
        >
          <div className="stack">
            <div>
              <p className="eyebrow">Label</p>
              <h2 className="system-ui__type-display">Panel de control</h2>
            </div>
            <p className="page-copy">
              Esta frase sirve para revisar el cuerpo de texto base, el color
              secundario y la legibilidad de lectura prolongada.
            </p>
          </div>
        </Card>
      </div>

      <Card
        title="Inventario de componentes"
        description="Estado actual de las piezas base disponibles en el shell."
      >
        <Table columns={tableColumns} rows={tableRows} />
      </Card>
    </div>
  );
}

export default SystemUiPage;
