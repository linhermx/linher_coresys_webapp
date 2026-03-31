import { Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/primitives/Badge.jsx";
import Button from "../components/primitives/Button.jsx";
import Card from "../components/primitives/Card.jsx";
import Drawer from "../components/primitives/Drawer.jsx";
import Input from "../components/primitives/Input.jsx";
import PageHeader from "../components/primitives/PageHeader.jsx";
import Table from "../components/primitives/Table.jsx";
import Tabs from "../components/primitives/Tabs.jsx";

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

const primitiveTabs = [
  { value: "inputs", label: "Inputs", meta: "Formularios" },
  { value: "navigation", label: "Navegación", meta: "Tabs" },
  { value: "overlays", label: "Overlays", meta: "Drawer" },
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
    notes: "Tabla base semántica y compacta.",
  },
  {
    id: "badge",
    component: "Badge",
    state: "Listo",
    notes: "Estados y metadatos breves.",
  },
  {
    id: "input",
    component: "Input",
    state: "Nuevo",
    notes: "Label, hint, error y soporte para icono.",
  },
  {
    id: "tabs",
    component: "Tabs",
    state: "Nuevo",
    notes: "Navegación interna compacta para módulos.",
  },
  {
    id: "drawer",
    component: "Drawer",
    state: "Nuevo",
    notes: "Overlay accesible para detalle o formularios.",
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
  const [activePrimitiveTab, setActivePrimitiveTab] = useState("inputs");
  const [isDrawerPreviewOpen, setIsDrawerPreviewOpen] = useState(false);

  return (
    <div className="page-section">
      <PageHeader
        eyebrow="Vista interna"
        title="UI del sistema"
        description="Panel de verificación para revisar tokens, shell y primitives base antes de tocar módulos reales de producto."
        actions={
          <Link className="button button--secondary button--sm" to="/tickets">
            Volver a tickets
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
                <strong>Tema operativo</strong>
                <p>Superficies, contraste y densidad propias del dominio IT.</p>
              </div>
            </div>
            <div className="system-ui__layer">
              <Badge tone="info">3</Badge>
              <div>
                <strong>Shell y primitives</strong>
                <p>Sidebar, topbar, fields, tabs, drawers y tablas reutilizables.</p>
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
        title="Primitives nuevas"
        description="Preview funcional de las piezas que entran en la Fase 0."
      >
        <div className="stack">
          <Tabs
            ariaLabel="Vista de primitives"
            items={primitiveTabs}
            value={activePrimitiveTab}
            onChange={setActivePrimitiveTab}
            panelIdPrefix="primitive-preview"
          />

          {activePrimitiveTab === "inputs" ? (
            <div
              id="primitive-preview-inputs"
              role="tabpanel"
              aria-labelledby="primitive-preview-tab-inputs"
              className="system-ui__preview-grid"
            >
              <Input
                label="Buscar activo"
                placeholder="Serie, usuario o módulo"
                leadingIcon={Search}
                hint="Ejemplo de field compacto para búsquedas operativas."
              />
              <Input
                label="Servicio"
                placeholder="Nombre del servicio"
                error="Ejemplo de estado con mensaje de error."
              />
            </div>
          ) : null}

          {activePrimitiveTab === "navigation" ? (
            <div
              id="primitive-preview-navigation"
              role="tabpanel"
              aria-labelledby="primitive-preview-tab-navigation"
              className="system-ui__preview-stack"
            >
              <p className="page-copy">
                Las tabs deben resolver variaciones internas del mismo dominio antes de
                abrir nuevos módulos en el sidebar.
              </p>
            </div>
          ) : null}

          {activePrimitiveTab === "overlays" ? (
            <div
              id="primitive-preview-overlays"
              role="tabpanel"
              aria-labelledby="primitive-preview-tab-overlays"
              className="system-ui__preview-stack"
            >
              <p className="page-copy">
                El drawer está pensado para detalle, lectura rápida y acciones de contexto.
              </p>
              <div className="system-ui__button-row">
                <Button variant="secondary" onClick={() => setIsDrawerPreviewOpen(true)}>
                  Abrir preview
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <Card
        title="Inventario de componentes"
        description="Estado actual de las piezas base disponibles para producto real."
      >
        <Table columns={tableColumns} rows={tableRows} />
      </Card>

      <Drawer
        open={isDrawerPreviewOpen}
        onClose={() => setIsDrawerPreviewOpen(false)}
        title="Preview de drawer"
        description="Este overlay sirve como patrón para formularios laterales, detalle de tickets y vistas rápidas de entidad."
        actions={
          <Button variant="secondary" onClick={() => setIsDrawerPreviewOpen(false)}>
            Cerrar
          </Button>
        }
      >
        <div className="stack">
          <Badge tone="info">Accesible</Badge>
          <p className="page-copy">
            Debe cerrar con `Escape`, soportar teclado y mantener jerarquía visual
            compacta para no romper la densidad operativa del sistema.
          </p>
        </div>
      </Drawer>
    </div>
  );
}

export default SystemUiPage;
