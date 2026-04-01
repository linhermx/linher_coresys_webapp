import { Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/primitives/Badge.jsx";
import Button from "../components/primitives/Button.jsx";
import Card from "../components/primitives/Card.jsx";
import Drawer from "../components/primitives/Drawer.jsx";
import Input from "../components/primitives/Input.jsx";
import PageHeader from "../components/primitives/PageHeader.jsx";
import Select from "../components/primitives/Select.jsx";
import Table from "../components/primitives/Table.jsx";
import Tabs from "../components/primitives/Tabs.jsx";
import Textarea from "../components/primitives/Textarea.jsx";

const previewTabs = [
  { value: "inputs", label: "Campos", meta: "Captura" },
  { value: "navigation", label: "Navegación", meta: "Subflujos" },
  { value: "overlays", label: "Capas", meta: "Detalle" },
];

const paletteTokens = [
  {
    key: "Primary",
    value: "var(--primary)",
    note: "Acción primaria, foco y prioridad.",
  },
  {
    key: "Primary soft",
    value: "var(--primary-soft)",
    note: "Realce sutil para estados y fondos activos.",
  },
  {
    key: "Cian de apoyo",
    value: "var(--accent-cyan)",
    note: "Lectura secundaria y contraste funcional.",
  },
  {
    key: "Surface base",
    value: "var(--panel-bg)",
    note: "Paneles operativos y contenedores base.",
  },
  {
    key: "Surface mute",
    value: "var(--panel-bg-muted)",
    note: "Capas internas y separación de bloques.",
  },
  {
    key: "Borde",
    value: "var(--panel-border)",
    note: "Jerarquía sin recargar la pantalla.",
  },
  {
    key: "Texto principal",
    value: "var(--text-main)",
    note: "Títulos, datos y lectura de decisión.",
  },
  {
    key: "Texto secundario",
    value: "var(--text-secondary)",
    note: "Soporte, metadatos y contexto breve.",
  },
];

const typeScale = [
  {
    id: "display",
    label: "Display",
    token: "var(--fs-display)",
    sample: "Sistema visual operativo",
    className: "design-lab__type-sample design-lab__type-sample--display",
  },
  {
    id: "title",
    label: "Título",
    token: "var(--fs-title-xl)",
    sample: "Panel de tickets",
    className: "design-lab__type-sample design-lab__type-sample--title",
  },
  {
    id: "body",
    label: "Cuerpo",
    token: "var(--fs-body-md)",
    sample: "Lectura compacta, estable y sin ruido visual innecesario.",
    className: "design-lab__type-sample design-lab__type-sample--body",
  },
  {
    id: "caption",
    label: "Caption",
    token: "var(--fs-caption)",
    sample: "Meta, etiquetas y soporte de contexto.",
    className: "design-lab__type-sample design-lab__type-sample--caption",
  },
];

const spacingScale = [
  { key: "XS", token: "var(--spacing-xs)", value: "0.25rem" },
  { key: "SM", token: "var(--spacing-sm)", value: "0.5rem" },
  { key: "MD", token: "var(--spacing-md)", value: "1rem" },
  { key: "LG", token: "var(--spacing-lg)", value: "1.5rem" },
  { key: "XL", token: "var(--spacing-xl)", value: "2rem" },
];

const designPrinciples = [
  {
    id: "01",
    title: "Jerarquía antes que decoración",
    note: "La estructura debe explicar el uso de la vista sin recurrir a copy largo.",
  },
  {
    id: "02",
    title: "Densidad precisa",
    note: "Compacta donde hay trabajo y abierta donde hay toma de decisión.",
  },
  {
    id: "03",
    title: "Una sola familia visual",
    note: "Tabla, tablero, línea de tiempo y drawer deben sentirse como la misma herramienta.",
  },
  {
    id: "04",
    title: "Color con criterio",
    note: "El morado lidera y el cian acompaña; ninguno se usa como decoración gratuita.",
  },
];

const shellZones = [
  {
    title: "Sidebar",
    note: "Navegación por dominio, estado activo claro y cierre visual contenido.",
  },
  {
    title: "Topbar",
    note: "Contexto actual, fecha y estado global. Nada de navegación duplicada.",
  },
  {
    title: "Page header",
    note: "Una idea principal, una descripción corta y acciones jerarquizadas.",
  },
];

const viewModes = [
  {
    title: "Lista",
    note: "Bandejas, inventario y seguimiento con lectura inmediata.",
  },
  {
    title: "Tablero",
    note: "Estados o etapas cuando la columna agrega claridad real.",
  },
  {
    title: "Línea de tiempo",
    note: "Eventos y trazabilidad cuando el orden temporal importa.",
  },
  {
    title: "Detalle lateral",
    note: "Inspección y acción contextual sin romper el flujo operativo.",
  },
];

const extractionChecklist = [
  "Todo valor repetido se convierte en token o patrón reutilizable.",
  "Una vista no entra a producto si no pasa primero por este tablero.",
  "La densidad compacta no puede sacrificar foco visible ni contraste.",
  "El shell manda la jerarquía; el módulo no inventa su propio lenguaje.",
];

const componentColumns = [
  { key: "piece", label: "Pieza" },
  { key: "role", label: "Rol" },
  {
    key: "status",
    label: "Estado",
    render: (_value, row) => <Badge tone={row.tone}>{row.status}</Badge>,
  },
  { key: "notes", label: "Uso esperado" },
];

const componentRows = [
  {
    id: "button",
    piece: "Button",
    role: "Acción primaria o secundaria",
    status: "Activo",
    tone: "success",
    notes: "Jerarquía clara sin volver todo primario.",
  },
  {
    id: "fields",
    piece: "Input / Select / Textarea",
    role: "Captura y filtro",
    status: "Activo",
    tone: "success",
    notes: "Altura compacta, etiquetas legibles y estados visibles.",
  },
  {
    id: "tabs",
    piece: "Tabs",
    role: "Subflujo interno",
    status: "Activo",
    tone: "success",
    notes: "Variantes de la misma vista, no nuevos módulos.",
  },
  {
    id: "drawer",
    piece: "Drawer",
    role: "Detalle o formulario contextual",
    status: "Activo",
    tone: "info",
    notes: "Mantiene el flujo y evita romper la navegación.",
  },
  {
    id: "table",
    piece: "Table",
    role: "Lectura operativa",
    status: "Base",
    tone: "success",
    notes: "Semántica real y densidad para trabajo continuo.",
  },
  {
    id: "shell",
    piece: "Shell",
    role: "Marco del sistema",
    status: "Revisión",
    tone: "warning",
    notes: "Sidebar, topbar y page header definen la experiencia completa.",
  },
];

const previewTableRows = [
  {
    id: "ticket-1",
    piece: "Tickets",
    role: "Lista + detalle lateral",
    status: "Base",
    tone: "info",
    notes: "La bandeja debe ser rápida de escanear y de actuar.",
  },
  {
    id: "inventory-1",
    piece: "Inventario",
    role: "Tabla + filtros + asignación",
    status: "Objetivo",
    tone: "neutral",
    notes: "La trazabilidad pesa más que el decorado.",
  },
  {
    id: "services-1",
    piece: "Servicios",
    role: "Lista + vencimientos",
    status: "Objetivo",
    tone: "warning",
    notes: "Los vencimientos deben leerse antes que los adornos.",
  },
];

function TokenChip({ label, note, value }) {
  return (
    <article className="design-lab__token">
      <div
        className="design-lab__token-chip"
        style={{ "--token-color": value }}
      />
      <div className="design-lab__token-copy">
        <strong>{label}</strong>
        <span>{note}</span>
        <code>{value}</code>
      </div>
    </article>
  );
}

function SpacingRow({ item }) {
  return (
    <div className="design-lab__spacing-row">
      <span className="design-lab__spacing-key">{item.key}</span>
      <div className="design-lab__spacing-bar">
        <span style={{ width: item.token }} />
      </div>
      <code>{item.value}</code>
    </div>
  );
}

function SystemUiPage() {
  const [activePreviewTab, setActivePreviewTab] = useState("inputs");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="page-section design-lab">
      <PageHeader
        eyebrow="Vista interna"
        title="Sistema visual operativo"
        description="Tablero de extracción para rehacer tokens, shell y primitives antes de entrar a pantallas reales del producto."
        actions={
          <Link className="button button--secondary button--sm" to="/tickets">
            Abrir tickets
          </Link>
        }
      />

      <section className="design-lab__hero">
        <article className="design-lab__hero-panel">
          <div className="design-lab__hero-copy">
            <p className="eyebrow">Nueva base</p>
            <h2 className="design-lab__headline">
              Un lenguaje más sobrio, técnico y preciso para trabajo operativo
              real.
            </h2>
            <p className="design-lab__lede">
              El rediseño no busca hacer una galería bonita. Busca una base
              reutilizable para dashboards, bandejas, formularios, tablas y detalle
              lateral que se sienta premium, clara y estable.
            </p>
          </div>

          <div className="design-lab__principles-grid">
            {designPrinciples.map((item) => (
              <article key={item.id} className="design-lab__principle">
                <span className="design-lab__principle-id">{item.id}</span>
                <div className="design-lab__principle-copy">
                  <strong>{item.title}</strong>
                  <p>{item.note}</p>
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside className="design-lab__hero-side">
          <article className="design-lab__signal">
            <span className="design-lab__signal-label">Modo base</span>
            <strong>Light operational</strong>
            <p>Dark conserva la misma densidad y el mismo orden visual.</p>
          </article>

          <article className="design-lab__signal">
            <span className="design-lab__signal-label">Extracción</span>
            <strong>Tokens + shell + primitives</strong>
            <p>Todo módulo nuevo debe salir de esta base, no inventarla otra vez.</p>
          </article>

          <div className="design-lab__chip-strip" aria-label="Modos de vista del sistema">
            {viewModes.map((mode) => (
              <span key={mode.title} className="design-lab__chip">
                {mode.title}
              </span>
            ))}
          </div>
        </aside>
      </section>

      <section className="design-lab__board">
        <article className="design-lab__panel design-lab__panel--wide">
          <div className="design-lab__panel-header">
            <div>
              <p className="eyebrow">Fundación</p>
              <h3 className="design-lab__panel-title">Shell y lenguaje de producto</h3>
            </div>
            <Badge tone="info">Fuente de verdad</Badge>
          </div>

          <div className="design-lab__shell-grid">
            {shellZones.map((zone) => (
              <article key={zone.title} className="design-lab__shell-card">
                <strong>{zone.title}</strong>
                <p>{zone.note}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="design-lab__panel">
          <div className="design-lab__panel-header">
            <div>
              <p className="eyebrow">Uso</p>
              <h3 className="design-lab__panel-title">Formatos permitidos</h3>
            </div>
          </div>

          <div className="design-lab__mode-grid">
            {viewModes.map((mode) => (
              <article key={mode.title} className="design-lab__mode-card">
                <strong>{mode.title}</strong>
                <p>{mode.note}</p>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="design-lab__board design-lab__board--tokens">
        <article className="design-lab__panel design-lab__panel--wide">
          <div className="design-lab__panel-header">
            <div>
              <p className="eyebrow">Color y superficies</p>
              <h3 className="design-lab__panel-title">Paleta reutilizable del sistema</h3>
            </div>
          </div>

          <div className="design-lab__token-grid">
            {paletteTokens.map((token) => (
              <TokenChip
                key={token.key}
                label={token.key}
                note={token.note}
                value={token.value}
              />
            ))}
          </div>
        </article>

        <article className="design-lab__panel">
          <div className="design-lab__panel-header">
            <div>
              <p className="eyebrow">Tipografía</p>
              <h3 className="design-lab__panel-title">Escala compacta</h3>
            </div>
          </div>

          <div className="design-lab__type-grid">
            {typeScale.map((item) => (
              <article key={item.id} className="design-lab__type-card">
                <span className="design-lab__type-label">{item.label}</span>
                <code className="design-lab__type-token">{item.token}</code>
                <div className={item.className}>{item.sample}</div>
              </article>
            ))}
          </div>
        </article>

        <article className="design-lab__panel">
          <div className="design-lab__panel-header">
            <div>
              <p className="eyebrow">Spacing</p>
              <h3 className="design-lab__panel-title">Ritmo operativo</h3>
            </div>
          </div>

          <div className="design-lab__spacing-list">
            {spacingScale.map((item) => (
              <SpacingRow key={item.key} item={item} />
            ))}
          </div>
        </article>
      </section>

      <section className="design-lab__sandbox">
        <Card
          className="design-lab__sandbox-card"
          title="Sandbox de primitives"
          description="Toda pieza nueva entra aquí primero para validar tono, densidad, estados y consistencia."
        >
          <div className="design-lab__sandbox-body">
            <Tabs
              ariaLabel="Vista del sandbox"
              items={previewTabs}
              value={activePreviewTab}
              onChange={setActivePreviewTab}
              panelIdPrefix="design-lab-preview"
            />

            {activePreviewTab === "inputs" ? (
              <div
                id="design-lab-preview-inputs"
                role="tabpanel"
                aria-labelledby="design-lab-preview-tab-inputs"
                className="design-lab__preview-grid"
              >
                <div className="design-lab__preview-column">
                  <Input
                    label="Buscar activo"
                    placeholder="Serie, módulo o solicitante"
                    leadingIcon={Search}
                    hint="Búsqueda operacional con contexto rápido."
                  />

                  <Select
                    label="Prioridad"
                    options={[
                      { value: "alta", label: "Alta" },
                      { value: "media", label: "Media" },
                      { value: "baja", label: "Baja" },
                    ]}
                    value="alta"
                    onChange={() => {}}
                  />
                </div>

                <div className="design-lab__preview-column">
                  <Textarea
                    label="Contexto"
                    value="Descripción breve, accionable y sin texto sobrante."
                    onChange={() => {}}
                  />

                  <div className="design-lab__note">
                    <strong>Regla base</strong>
                    <p>
                      El input no es solo forma. Debe sentirse rápido, claro y
                      suficientemente compacto para trabajo continuo.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {activePreviewTab === "navigation" ? (
              <div
                id="design-lab-preview-navigation"
                role="tabpanel"
                aria-labelledby="design-lab-preview-tab-navigation"
                className="design-lab__mode-grid"
              >
                {viewModes.map((mode) => (
                  <article key={mode.title} className="design-lab__mode-card">
                    <strong>{mode.title}</strong>
                    <p>{mode.note}</p>
                  </article>
                ))}
              </div>
            ) : null}

            {activePreviewTab === "overlays" ? (
              <div
                id="design-lab-preview-overlays"
                role="tabpanel"
                aria-labelledby="design-lab-preview-tab-overlays"
                className="design-lab__preview-column"
              >
                <div className="design-lab__note">
                  <strong>Drawer por defecto</strong>
                  <p>
                    Se usa para lectura de detalle, formularios y acciones de
                    contexto. No debe competir con la navegación principal.
                  </p>
                </div>

                <div className="design-lab__actions">
                  <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>
                    Abrir drawer de referencia
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <div className="design-lab__stack">
          <article className="design-lab__panel">
            <div className="design-lab__panel-header">
              <div>
                <p className="eyebrow">Checklist</p>
                <h3 className="design-lab__panel-title">Extracción del sistema</h3>
              </div>
            </div>

            <ul className="design-lab__checklist">
              {extractionChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <Card
            className="design-lab__inventory-card"
            title="Inventario normalizado"
            description="Resumen de piezas que ya deben obedecer el nuevo lenguaje."
          >
            <Table columns={componentColumns} rows={componentRows} />
          </Card>
        </div>
      </section>

      <Card
        className="design-lab__table-card"
        title="Lectura de producto"
        description="Este inventario resume cómo debe aterrizarse la base en módulos reales."
      >
        <Table columns={componentColumns} rows={previewTableRows} />
      </Card>

      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Drawer de referencia"
        description="Patrón base para detalle contextual, lectura rápida y formularios laterales."
        actions={
          <>
            <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>
              Cerrar
            </Button>
            <Button variant="secondary">Guardar patrón</Button>
          </>
        }
      >
        <div className="design-lab__preview-column">
          <div className="design-lab__note">
            <strong>Qué debe resolver</strong>
            <p>
              Mostrar información relevante, sostener foco y dejar actuar sin
              sacar al usuario de su vista principal.
            </p>
          </div>

          <div className="design-lab__chip-strip">
            <span className="design-lab__chip">Escape</span>
            <span className="design-lab__chip">Click fuera</span>
            <span className="design-lab__chip">role="dialog"</span>
            <span className="design-lab__chip">Jerarquía compacta</span>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default SystemUiPage;
