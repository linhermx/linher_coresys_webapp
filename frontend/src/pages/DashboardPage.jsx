import {
  ArrowUpRight,
  Boxes,
  CircleAlert,
  Phone,
  Search,
  Server,
  ShieldAlert,
  Ticket,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/primitives/Badge.jsx";
import Card from "../components/primitives/Card.jsx";
import Input from "../components/primitives/Input.jsx";
import Tabs from "../components/primitives/Tabs.jsx";
import { MODULE_CATALOG } from "../utils/app.js";

const overviewTabs = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "alerts", label: "Riesgos" },
];

const moduleAppearance = {
  dashboard: {
    icon: Wrench,
    tone: "info",
    accent: "var(--primary)",
  },
  tickets: {
    icon: Ticket,
    tone: "danger",
    accent: "var(--primary)",
  },
  inventory: {
    icon: Boxes,
    tone: "info",
    accent: "var(--accent-cyan)",
  },
  telephony: {
    icon: Phone,
    tone: "success",
    accent: "var(--success)",
  },
  services: {
    icon: Server,
    tone: "warning",
    accent: "var(--warning)",
  },
  access: {
    icon: ShieldAlert,
    tone: "success",
    accent: "var(--success)",
  },
};

const moduleLabelByKey = Object.fromEntries(
  MODULE_CATALOG.map((module) => [module.key, module.label]),
);

const heroByWindow = {
  today: {
    metric: "18",
    label: "tickets abiertos",
    highlights: [
      { label: "Urgentes", value: "5" },
      { label: "Sin resguardo", value: "6" },
      { label: "Renovaciones", value: "3" },
    ],
    signalValue: 72,
    signalLabel: "SLA hoy",
    signalState: "Estable",
    signalItems: [
      { label: "Guardia", value: "2 recargas", progress: 44 },
      { label: "Servicios", value: "3 renovaciones", progress: 66 },
      { label: "Accesos", value: "6 por revisar", progress: 58 },
    ],
  },
  week: {
    metric: "31",
    label: "movimientos esta semana",
    highlights: [
      { label: "Altas", value: "12" },
      { label: "Recargas", value: "4" },
      { label: "Accesos", value: "6" },
    ],
    signalValue: 84,
    signalLabel: "Cumplimiento",
    signalState: "Estable",
    signalItems: [
      { label: "Tickets", value: "31", progress: 84 },
      { label: "Resguardos", value: "12", progress: 58 },
      { label: "Servicios", value: "4", progress: 28 },
    ],
  },
  alerts: {
    metric: "07",
    label: "focos críticos",
    highlights: [
      { label: "SLA", value: "7" },
      { label: "Resguardos", value: "6" },
      { label: "Servicios", value: "1" },
    ],
    signalValue: 46,
    signalLabel: "Atención",
    signalState: "Crítico",
    signalItems: [
      { label: "SLA", value: "7", progress: 78 },
      { label: "Resguardos", value: "6", progress: 64 },
      { label: "Servicios", value: "1", progress: 24 },
    ],
  },
};

const overviewByWindow = {
  today: [
    {
      id: "tickets-open",
      label: "Abiertos",
      value: "18",
      meta: "5 urgentes",
      tone: "warning",
      accent: "var(--primary)",
      icon: Ticket,
      meter: 82,
    },
    {
      id: "tickets-due",
      label: "Vencen hoy",
      value: "07",
      meta: "Compromiso hoy",
      tone: "danger",
      accent: "var(--danger)",
      icon: CircleAlert,
      meter: 78,
    },
    {
      id: "assets-pending",
      label: "Sin resguardo",
      value: "06",
      meta: "Pendientes de asignación",
      tone: "info",
      accent: "var(--accent-cyan)",
      icon: Boxes,
      meter: 64,
    },
    {
      id: "renewals-next",
      label: "Renovaciones",
      value: "03",
      meta: "Esta semana",
      tone: "warning",
      accent: "var(--warning)",
      icon: Server,
      meter: 52,
    },
  ],
  week: [
    {
      id: "week-tickets",
      label: "Tickets",
      value: "31",
      meta: "Seguimiento semanal",
      tone: "info",
      accent: "var(--primary)",
      icon: Ticket,
      meter: 72,
    },
    {
      id: "week-assets",
      label: "Altas",
      value: "12",
      meta: "Recepción y etiquetado",
      tone: "neutral",
      accent: "var(--accent-cyan)",
      icon: Boxes,
      meter: 58,
    },
    {
      id: "week-telephony",
      label: "Recargas",
      value: "04",
      meta: "Líneas de guardia",
      tone: "warning",
      accent: "var(--warning)",
      icon: Phone,
      meter: 48,
    },
    {
      id: "week-access",
      label: "Accesos",
      value: "06",
      meta: "Cuentas por validar",
      tone: "success",
      accent: "var(--success)",
      icon: ShieldAlert,
      meter: 55,
    },
  ],
  alerts: [
    {
      id: "alert-sla",
      label: "SLA",
      value: "07",
      meta: "Riesgo de cierre",
      tone: "danger",
      accent: "var(--danger)",
      icon: CircleAlert,
      meter: 80,
    },
    {
      id: "alert-assets",
      label: "Resguardos",
      value: "06",
      meta: "Pendientes",
      tone: "warning",
      accent: "var(--warning)",
      icon: Boxes,
      meter: 62,
    },
    {
      id: "alert-telephony",
      label: "Recargas",
      value: "02",
      meta: "Por vencer",
      tone: "warning",
      accent: "var(--warning)",
      icon: Phone,
      meter: 44,
    },
    {
      id: "alert-services",
      label: "Servicios",
      value: "01",
      meta: "Riesgo crítico",
      tone: "danger",
      accent: "var(--danger)",
      icon: Server,
      meter: 30,
    },
  ],
};

const priorityItems = [
  {
    id: "priority-1",
    title: "INC-24012 · VPN intermitente en gerencia",
    moduleKey: "tickets",
    owner: "Infraestructura",
    due: "11:30",
    path: "/tickets",
    status: "Alta",
  },
  {
    id: "priority-2",
    title: "Laptop nueva pendiente de etiquetado",
    moduleKey: "inventory",
    owner: "Mesa IT",
    due: "Hoy",
    path: "/inventory",
    status: "Media",
  },
  {
    id: "priority-3",
    title: "Recarga de línea de guardia nocturna",
    moduleKey: "telephony",
    owner: "Soporte",
    due: "18:00",
    path: "/telephony",
    status: "Alta",
  },
  {
    id: "priority-4",
    title: "Renovación de certificado wildcard",
    moduleKey: "services",
    owner: "Plataforma",
    due: "2 días",
    path: "/services",
    status: "Alta",
  },
];

const agendaItems = [
  {
    id: "agenda-1",
    title: "Asignación de laptop a nuevo ingreso",
    slot: "16:00",
    owner: "Mesa IT",
    moduleKey: "inventory",
  },
  {
    id: "agenda-2",
    title: "Validación de cuenta técnica ERP",
    slot: "Mañana",
    owner: "Infraestructura",
    moduleKey: "tickets",
  },
  {
    id: "agenda-3",
    title: "Renovación de antivirus corporativo",
    slot: "Jueves",
    owner: "Servicios",
    moduleKey: "services",
  },
];

const expiryItems = [
  {
    id: "expiry-1",
    title: "Certificado wildcard",
    moduleKey: "services",
    due: "2 días",
    path: "/services",
    detail: "Renovación prioritaria",
  },
  {
    id: "expiry-2",
    title: "Recarga de línea de guardia",
    moduleKey: "telephony",
    due: "Hoy",
    path: "/telephony",
    detail: "Cobertura nocturna",
  },
  {
    id: "expiry-3",
    title: "Antivirus corporativo",
    moduleKey: "services",
    due: "Jueves",
    path: "/services",
    detail: "Licencia anual",
  },
];

const teamLoadItems = [
  {
    id: "team-1",
    team: "Mesa IT",
    owner: "2 analistas",
    load: "08",
    note: "Intakes y entregas",
    accent: "var(--accent-cyan)",
    progress: 68,
  },
  {
    id: "team-2",
    team: "Infraestructura",
    owner: "1 guardia",
    load: "06",
    note: "VPN y cuentas",
    accent: "var(--primary)",
    progress: 54,
  },
  {
    id: "team-3",
    team: "Soporte",
    owner: "Cobertura nocturna",
    load: "04",
    note: "Telefonía",
    accent: "var(--success)",
    progress: 36,
  },
  {
    id: "team-4",
    team: "Plataforma",
    owner: "1 responsable",
    load: "03",
    note: "Renovaciones",
    accent: "var(--warning)",
    progress: 42,
  },
];

const moduleStatusByKey = {
  tickets: {
    metric: "18",
    note: "5 urgentes",
    detail: "Cola activa",
    actionLabel: "Ver tickets",
    progress: 64,
  },
  inventory: {
    metric: "06",
    note: "Sin resguardo",
    detail: "Asignaciones pendientes",
    actionLabel: "Ir a inventario",
    progress: 52,
  },
  telephony: {
    metric: "02",
    note: "Recargas hoy",
    detail: "Líneas de guardia",
    actionLabel: "Abrir telefonía",
    progress: 34,
  },
  services: {
    metric: "03",
    note: "Renovaciones",
    detail: "Pagos y vencimientos",
    actionLabel: "Ver servicios",
    progress: 46,
  },
};

function DashboardMetricCard({ item }) {
  const ItemIcon = item.icon;

  return (
    <article
      className={`dashboard-stat-card dashboard-stat-card--${item.tone}`}
      style={{ "--dashboard-accent": item.accent }}
    >
      <div className="dashboard-stat-card__top">
        <span className="dashboard-stat-card__icon" aria-hidden="true">
          <ItemIcon size={18} strokeWidth={1.9} />
        </span>
        <span className="dashboard-stat-card__title">{item.label}</span>
      </div>

      <div className="dashboard-stat-card__body">
        <strong className="dashboard-stat-card__value">{item.value}</strong>
        <span className="dashboard-stat-card__label">{item.meta}</span>
      </div>

      <div className="dashboard-stat-card__meter" aria-hidden="true">
        <span style={{ width: `${item.meter}%` }} />
      </div>
    </article>
  );
}

function DashboardPage() {
  const [activeOverview, setActiveOverview] = useState("today");
  const [searchTerm, setSearchTerm] = useState("");

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const hero = heroByWindow[activeOverview];
  const overviewCards = overviewByWindow[activeOverview];

  const filteredPriorityItems = useMemo(() => {
    if (!normalizedSearch) {
      return priorityItems;
    }

    return priorityItems.filter((item) =>
      [item.title, item.owner, item.due, item.moduleKey]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [normalizedSearch]);

  const filteredAgendaItems = useMemo(() => {
    if (!normalizedSearch) {
      return agendaItems;
    }

    return agendaItems.filter((item) =>
      [item.title, item.slot, item.owner, item.moduleKey]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [normalizedSearch]);

  return (
    <div className="page-section dashboard-page">
      <div className="dashboard-bento">
        <Card className="dashboard-hero-card dashboard-bento__hero" variant="accent">
          <div className="dashboard-toolbar dashboard-toolbar--hero">
            <Tabs
              ariaLabel="Vista del dashboard"
              items={overviewTabs}
              value={activeOverview}
              onChange={setActiveOverview}
              panelIdPrefix="overview-panel"
            />

            <div className="dashboard-toolbar__search">
              <Input
                aria-label="Buscar en el dashboard"
                placeholder="Buscar ticket, activo, línea o servicio"
                leadingIcon={Search}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          <div className="dashboard-hero__body">
            <div className="dashboard-hero__copy">
              <h2 className="dashboard-hero__headline">
                <strong>{hero.metric}</strong> {hero.label}
              </h2>

              <div className="dashboard-hero__highlights">
                {hero.highlights.map((item) => (
                  <div key={item.label} className="dashboard-hero__highlight">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="dashboard-signal-card dashboard-bento__signal">
          <div className="dashboard-signal-card__header">
            <span>{hero.signalLabel}</span>
            <Badge tone={hero.signalValue >= 70 ? "success" : "danger"}>
              {hero.signalState}
            </Badge>
          </div>

          <div className="dashboard-signal-card__value-row">
            <strong>{hero.signalValue}%</strong>
          </div>

          <div className="dashboard-signal-card__meter" aria-hidden="true">
            <span style={{ width: `${hero.signalValue}%` }} />
          </div>

          <div className="dashboard-signal-card__list">
            {hero.signalItems.map((item) => (
              <div key={item.label} className="dashboard-signal-card__item">
                <div className="dashboard-signal-card__item-row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className="dashboard-signal-card__item-meter" aria-hidden="true">
                  <span style={{ width: `${item.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div
          id={`overview-panel-${activeOverview}`}
          className="dashboard-metric-grid dashboard-bento__metrics"
          role="tabpanel"
          aria-labelledby={`overview-panel-tab-${activeOverview}`}
        >
          {overviewCards.map((item) => (
            <DashboardMetricCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="dashboard-lower-grid">
        <div className="dashboard-stack">
          <Card
            title="Prioridad"
            actions={
              <Link className="button button--ghost button--sm" to="/tickets">
                Ver tickets
              </Link>
            }
          >
            <div className="dashboard-priority-list">
              {filteredPriorityItems.length ? (
                filteredPriorityItems.map((item) => {
                  const moduleTheme =
                    moduleAppearance[item.moduleKey] ?? moduleAppearance.dashboard;
                  const ItemIcon = moduleTheme.icon;

                  return (
                    <article
                      key={item.id}
                      className={`dashboard-priority-item dashboard-priority-item--${moduleTheme.tone}`}
                      style={{ "--dashboard-accent": moduleTheme.accent }}
                    >
                      <span className="dashboard-priority-item__icon" aria-hidden="true">
                        <ItemIcon size={18} strokeWidth={1.9} />
                      </span>

                      <div className="dashboard-priority-item__content">
                        <h3>{item.title}</h3>
                        <div className="dashboard-priority-item__meta">
                          <span>{moduleLabelByKey[item.moduleKey]}</span>
                          <span>{item.owner}</span>
                        </div>
                      </div>

                      <div className="dashboard-priority-item__aside">
                        <span className="dashboard-priority-item__time">{item.due}</span>
                        <Badge tone={moduleTheme.tone}>{item.status}</Badge>
                      </div>

                      <Link
                        to={item.path}
                        className="dashboard-priority-item__open icon-button"
                        aria-label={`Abrir ${item.title}`}
                      >
                        <ArrowUpRight size={16} strokeWidth={1.9} />
                      </Link>
                    </article>
                  );
                })
              ) : (
                <div className="dashboard-empty-state">Sin coincidencias en prioridad.</div>
              )}
            </div>
          </Card>

          <Card title="Próximos vencimientos">
            <div className="dashboard-expiry-list">
              {expiryItems.map((item) => {
                const moduleTheme =
                  moduleAppearance[item.moduleKey] ?? moduleAppearance.dashboard;

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="dashboard-expiry-item"
                    style={{ "--dashboard-accent": moduleTheme.accent }}
                  >
                    <div className="dashboard-expiry-item__copy">
                      <strong>{item.title}</strong>
                      <span>
                        {moduleLabelByKey[item.moduleKey]} · {item.detail}
                      </span>
                    </div>
                    <div className="dashboard-expiry-item__meta">
                      <span>{item.due}</span>
                      <ArrowUpRight size={15} strokeWidth={1.9} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="dashboard-stack">
          <Card title="Agenda">
            <div className="dashboard-timeline">
              {filteredAgendaItems.length ? (
                filteredAgendaItems.map((item) => {
                  const moduleTheme =
                    moduleAppearance[item.moduleKey] ?? moduleAppearance.dashboard;

                  return (
                    <article
                      key={item.id}
                      className="dashboard-timeline__item"
                      style={{ "--dashboard-accent": moduleTheme.accent }}
                    >
                      <span className="dashboard-timeline__dot" aria-hidden="true" />
                      <div className="dashboard-timeline__content">
                        <div className="dashboard-timeline__header">
                          <h3>{item.title}</h3>
                          <span>{item.slot}</span>
                        </div>
                        <p>{item.owner}</p>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="dashboard-empty-state">Sin coincidencias en agenda.</div>
              )}
            </div>
          </Card>

          <Card title="Carga por equipo">
            <div className="dashboard-load-list">
              {teamLoadItems.map((item) => (
                <article
                  key={item.id}
                  className="dashboard-load-item"
                  style={{ "--dashboard-accent": item.accent }}
                >
                  <div className="dashboard-load-item__top">
                    <div className="dashboard-load-item__copy">
                      <strong>{item.team}</strong>
                      <span>{item.owner}</span>
                    </div>
                    <strong className="dashboard-load-item__value">{item.load}</strong>
                  </div>

                  <div className="dashboard-load-item__bottom">
                    <span>{item.note}</span>
                    <div className="dashboard-load-item__meter" aria-hidden="true">
                      <span style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="dashboard-radar-card" title="Radar por módulo">
        <div className="dashboard-module-grid dashboard-module-grid--alive">
          {MODULE_CATALOG.filter((module) => module.key !== "dashboard").map((module) => {
            const moduleTheme =
              moduleAppearance[module.key] ?? moduleAppearance.dashboard;
            const ItemIcon = moduleTheme.icon;
            const status = moduleStatusByKey[module.key];

            return (
              <Link
                key={module.key}
                to={module.path}
                className="dashboard-module-tile dashboard-module-tile--alive"
                style={{ "--dashboard-accent": moduleTheme.accent }}
              >
                <div className="dashboard-module-tile__top">
                  <span className="dashboard-module-tile__icon" aria-hidden="true">
                    <ItemIcon size={18} strokeWidth={1.9} />
                  </span>
                  <strong className="dashboard-module-tile__metric">{status.metric}</strong>
                </div>

                <div className="dashboard-module-tile__body">
                  <h3>{module.label}</h3>
                  <p>{status.note}</p>
                  <small>{status.detail}</small>
                </div>

                <div className="dashboard-module-tile__progress" aria-hidden="true">
                  <span style={{ width: `${status.progress}%` }} />
                </div>

                <span className="dashboard-module-tile__link">{status.actionLabel}</span>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export default DashboardPage;
