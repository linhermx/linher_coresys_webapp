import {
  AlertTriangle,
  Clock3,
  Plus,
  Search,
  Ticket,
  UserRoundMinus,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { useAuth } from "../context/AuthContext.jsx";
import { ticketsService } from "../services/ticketsService.js";

const INITIAL_FORM = {
  title: "",
  description: "",
  requesterName: "",
  requesterEmail: "",
  requesterArea: "",
  priorityId: "",
  categoryId: "",
  assigneeUserId: "",
  dueAt: "",
};

const HERO_METRICS = [
  {
    key: "critical",
    label: "Críticos",
    icon: AlertTriangle,
  },
  {
    key: "dueToday",
    label: "Vencen hoy",
    icon: Clock3,
  },
  {
    key: "unassigned",
    label: "Sin asignar",
    icon: UserRoundMinus,
  },
];

const priorityToneMap = {
  Critica: "danger",
  Alta: "warning",
  Media: "info",
  Baja: "neutral",
};

const statusToneMap = {
  Nuevo: "info",
  "En curso": "warning",
  "En espera": "neutral",
  Resuelto: "success",
  Cerrado: "neutral",
  Cancelado: "danger",
};

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Mexico_City",
});

const shortDateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeZone: "America/Mexico_City",
});

const formatDateTime = (value) => {
  if (!value) {
    return "Sin fecha";
  }

  return dateTimeFormatter.format(new Date(value));
};

const formatShortDate = (value) => {
  if (!value) {
    return "Sin fecha";
  }

  return shortDateFormatter.format(new Date(value));
};

function TicketsPage() {
  const { accessToken } = useAuth();
  const [filters, setFilters] = useState({
    search: "",
    statusId: "",
    priorityId: "",
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const [catalogs, setCatalogs] = useState({
    statuses: [],
    priorities: [],
    categories: [],
    assignees: [],
  });
  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    critical: 0,
    unassigned: 0,
    dueToday: 0,
    byStatus: [],
    upcoming: [],
  });
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await ticketsService.list({
          token: accessToken,
          search: filters.search,
          statusId: filters.statusId,
          priorityId: filters.priorityId,
        });

        setTickets(response.items ?? []);
        setCatalogs(response.catalogs ?? {});
        setSummary(response.summary ?? {});
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }, filters.search ? 240 : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [accessToken, filters.priorityId, filters.search, filters.statusId]);

  const statusTabItems = [
    { value: "", label: "Todos" },
    ...catalogs.statuses.map((status) => ({
      value: String(status.id),
      label: status.name,
    })),
  ];

  const priorityOptions = catalogs.priorities.map((priority) => ({
    value: String(priority.id),
    label: priority.name,
  }));

  const categoryOptions = catalogs.categories.map((category) => ({
    value: String(category.id),
    label: category.name,
  }));

  const assigneeOptions = catalogs.assignees.map((assignee) => ({
    value: String(assignee.id),
    label: assignee.name,
  }));

  const hasUpcoming = (summary.upcoming?.length ?? 0) > 0;
  const maxStatusTotal = Math.max(
    ...(summary.byStatus?.map((item) => Number(item.total ?? 0)) ?? [0]),
    1,
  );

  const tableColumns = [
    {
      key: "folio",
      label: "Folio",
    },
    {
      key: "title",
      label: "Ticket",
      render: (_value, row) => (
        <div className="tickets-view__table-main">
          <strong>{row.title}</strong>
          <span>{row.requesterName}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Estado",
      render: (_value, row) => (
        <Badge tone={statusToneMap[row.status.name] ?? "neutral"}>
          {row.status.name}
        </Badge>
      ),
    },
    {
      key: "priority",
      label: "Prioridad",
      render: (_value, row) => (
        <Badge tone={priorityToneMap[row.priority.name] ?? "neutral"}>
          {row.priority.name}
        </Badge>
      ),
    },
    {
      key: "assignee",
      label: "Responsable",
      render: (_value, row) => row.assignee?.name ?? "Sin asignar",
    },
    {
      key: "dueAt",
      label: "Vence",
      render: (value) => (value ? formatShortDate(value) : "Sin fecha"),
      align: "right",
    },
  ];

  const handleFilterChange = (field) => (eventOrValue) => {
    const value =
      typeof eventOrValue === "string"
        ? eventOrValue
        : eventOrValue?.target?.value ?? "";

    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleFormChange = (field) => (event) => {
    const value = event?.target?.value ?? "";

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const refreshTickets = async () => {
    const response = await ticketsService.list({
      token: accessToken,
      search: filters.search,
      statusId: filters.statusId,
      priorityId: filters.priorityId,
    });

    setTickets(response.items ?? []);
    setCatalogs(response.catalogs ?? {});
    setSummary(response.summary ?? {});
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSubmitError("");
    setForm(INITIAL_FORM);
  };

  const handleCreateTicket = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      await ticketsService.create({
        token: accessToken,
        payload: {
          title: form.title,
          description: form.description,
          requesterName: form.requesterName,
          requesterEmail: form.requesterEmail,
          requesterArea: form.requesterArea,
          priorityId: Number(form.priorityId),
          categoryId: form.categoryId ? Number(form.categoryId) : null,
          assigneeUserId: form.assigneeUserId ? Number(form.assigneeUserId) : null,
          dueAt: form.dueAt || null,
        },
      });

      closeDrawer();
      await refreshTickets();
    } catch (requestError) {
      setSubmitError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell tickets-view">
      <PageHeader
        eyebrow="Operación"
        title="Tickets"
        actions={
          <Button onClick={() => setIsDrawerOpen(true)}>
            <Plus size={16} strokeWidth={2} />
            <span>Nuevo ticket</span>
          </Button>
        }
      />

      <section className="tickets-view__overview">
        <Card className="tickets-view__hero-card" variant="accent">
          <div className="tickets-view__hero-main">
            <div>
              <p className="eyebrow">Control operativo</p>
              <div className="tickets-view__hero-heading">
                <strong>{summary.open ?? 0}</strong>
                <span>tickets activos</span>
              </div>
            </div>
          </div>

          <div className="tickets-view__hero-metrics">
            {HERO_METRICS.map((card) => {
              const Icon = card.icon;

              return (
                <article key={card.key} className="tickets-hero-metric">
                  <span className="tickets-hero-metric__icon" aria-hidden="true">
                    <Icon size={15} strokeWidth={1.9} />
                  </span>
                  <div className="tickets-hero-metric__body">
                    <small>{card.label}</small>
                    <strong>{summary[card.key] ?? 0}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        </Card>

        <Card title="Por estado" className="tickets-view__status-card">
          <div className="tickets-view__status-list">
            {summary.byStatus?.map((item) => (
              <div key={item.id} className="tickets-view__status-item">
                <div className="tickets-view__status-top">
                  <span>{item.name}</span>
                  <strong>{item.total}</strong>
                </div>
                <span className="tickets-view__status-meter" aria-hidden="true">
                  <span
                    style={{
                      width: `${Math.max(
                        Number(item.total ?? 0) > 0 ? 8 : 0,
                        (Number(item.total ?? 0) / maxStatusTotal) * 100,
                      )}%`,
                    }}
                  />
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="tickets-view__filters-card">
        <div className="tickets-view__toolbar">
          <div className="tickets-view__tabs-wrap">
            <Tabs
              ariaLabel="Filtrar tickets por estado"
              items={statusTabItems}
              onChange={handleFilterChange("statusId")}
              panelIdPrefix="tickets-status"
              value={filters.statusId}
            />
          </div>

          <div className="tickets-view__toolbar-inline">
            <Input
              className="tickets-view__search"
              id="tickets-search"
              label=""
              leadingIcon={Search}
              placeholder="Buscar folio, ticket o solicitante"
              value={filters.search}
              onChange={handleFilterChange("search")}
            />

            <Select
              aria-label="Filtrar por prioridad"
              className="tickets-view__priority-filter"
              label=""
              options={priorityOptions}
              placeholder="Prioridad"
              value={filters.priorityId}
              onChange={handleFilterChange("priorityId")}
            />
          </div>
        </div>
      </Card>

      <section
        className={`tickets-view__workspace ${hasUpcoming ? "" : "tickets-view__workspace--single"}`.trim()}
      >
        <Card className="tickets-view__main-card" title="Bandeja">
          {error ? <p className="tickets-view__error">{error}</p> : null}

          {isLoading ? (
            <div className="tickets-view__loading">Cargando tickets...</div>
          ) : tickets.length ? (
            <Table
              columns={tableColumns}
              rows={tickets}
              emptyMessage="No hay tickets para este filtro."
            />
          ) : (
            <div className="tickets-view__empty-state">
              <span className="tickets-view__empty-icon" aria-hidden="true">
                <Ticket size={18} strokeWidth={1.9} />
              </span>
              <strong>Sin tickets en esta vista</strong>
              <span>Ajusta filtros o registra uno nuevo.</span>
              <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>
                Crear ticket
              </Button>
            </div>
          )}
        </Card>

        {hasUpcoming ? (
          <div className="tickets-view__aside">
            <Card title="Próximos vencimientos">
              <div className="tickets-view__upcoming-list">
                {summary.upcoming.map((item) => (
                  <article key={item.id} className="tickets-view__upcoming-item">
                    <div>
                      <strong>{item.folio}</strong>
                      <p>{item.title}</p>
                    </div>
                    <div className="tickets-view__upcoming-meta">
                      <Badge tone={priorityToneMap[item.priorityName] ?? "neutral"}>
                        {item.priorityName}
                      </Badge>
                      <span>{formatDateTime(item.dueAt)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </Card>
          </div>
        ) : null}
      </section>

      <Drawer
        open={isDrawerOpen}
        onClose={closeDrawer}
        title="Nuevo ticket"
        actions={
          <>
            <Button variant="secondary" onClick={closeDrawer}>
              Cancelar
            </Button>
            <Button form="tickets-create-form" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </>
        }
      >
        <form
          id="tickets-create-form"
          className="tickets-form"
          onSubmit={handleCreateTicket}
        >
          <Input
            id="ticket-title"
            label="Título"
            value={form.title}
            onChange={handleFormChange("title")}
            required
          />

          <div className="tickets-form__grid">
            <Input
              id="ticket-requester-name"
              label="Solicitante"
              value={form.requesterName}
              onChange={handleFormChange("requesterName")}
              required
            />

            <Input
              id="ticket-requester-area"
              label="Área"
              value={form.requesterArea}
              onChange={handleFormChange("requesterArea")}
            />
          </div>

          <div className="tickets-form__grid">
            <Input
              id="ticket-requester-email"
              label="Correo"
              type="email"
              value={form.requesterEmail}
              onChange={handleFormChange("requesterEmail")}
            />

            <Input
              id="ticket-due-at"
              label="Vence"
              type="datetime-local"
              value={form.dueAt}
              onChange={handleFormChange("dueAt")}
            />
          </div>

          <div className="tickets-form__grid tickets-form__grid--triple">
            <Select
              id="ticket-priority"
              label="Prioridad"
              options={priorityOptions}
              value={form.priorityId}
              onChange={handleFormChange("priorityId")}
              required
            />

            <Select
              id="ticket-category"
              label="Categoría"
              options={categoryOptions}
              value={form.categoryId}
              onChange={handleFormChange("categoryId")}
            />

            <Select
              id="ticket-assignee"
              label="Responsable"
              options={assigneeOptions}
              value={form.assigneeUserId}
              onChange={handleFormChange("assigneeUserId")}
              placeholder="Sin asignar"
            />
          </div>

          <Textarea
            id="ticket-description"
            label="Descripción"
            value={form.description}
            onChange={handleFormChange("description")}
            placeholder="Contexto operativo del ticket"
          />

          {submitError ? <p className="tickets-view__error">{submitError}</p> : null}
        </form>
      </Drawer>
    </div>
  );
}

export default TicketsPage;
