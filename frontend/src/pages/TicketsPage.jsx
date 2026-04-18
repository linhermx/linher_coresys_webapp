import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  Info,
  KanbanSquare,
  List,
  MessageSquareMore,
  Paperclip,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
  X
} from 'lucide-react';

import { EmptyState } from '../components/primitives/EmptyState.jsx';
import { FilterChipGroup } from '../components/primitives/FilterChipGroup.jsx';
import { SegmentedControl } from '../components/primitives/SegmentedControl.jsx';
import {
  addTicketComment,
  createTicket,
  getTicketsCatalog,
  isAuthError as isTicketsAuthError,
  listTickets,
  uploadTicketAttachment,
  updateTicket,
  updateTicketStatus
} from '../services/ticketsService.js';
import { useAuth } from '../hooks/useAuth.js';

const statusMeta = {
  nuevo: { label: 'Nuevo', tone: 'info' },
  en_proceso: { label: 'En proceso', tone: 'primary' },
  en_espera: { label: 'En espera', tone: 'warning' },
  resuelto: { label: 'Resuelto', tone: 'success' },
  cerrado: { label: 'Cerrado', tone: 'neutral' }
};

const priorityMeta = {
  baja: { label: 'Baja', tone: 'neutral' },
  media: { label: 'Media', tone: 'info' },
  alta: { label: 'Alta', tone: 'warning' },
  critica: { label: 'Crítica', tone: 'danger' }
};

const typeMeta = {
  incidencia: { label: 'Incidencia', tone: 'danger' },
  solicitud: { label: 'Solicitud', tone: 'primary' }
};

const categoryLabels = {
  hardware_equipo: 'Hardware y equipo',
  software_aplicacion: 'Software y aplicación',
  red_conectividad: 'Red y conectividad',
  correo_colaboracion: 'Correo y colaboración',
  acceso_logico: 'Acceso lógico',
  acceso_fisico: 'Acceso físico',
  impresion_perifericos: 'Impresión y periféricos',
  telefonia_soporte: 'Telefonía y soporte',
  otro: 'Otro'
};

const channelOptions = ['Portal', 'Captura interna'];

const normalizeChannelOption = (value) => {
  const normalized = value === 'Mesa de ayuda' ? 'Captura interna' : value;
  return channelOptions.includes(normalized) ? normalized : channelOptions[0];
};

const viewOptions = [
  { key: 'list', label: 'Lista', icon: List },
  { key: 'pipeline', label: 'Pipeline', icon: KanbanSquare }
];

const scopeOptions = [
  { key: 'all', label: 'Todos' },
  { key: 'mine', label: 'Asignados a mí' },
  { key: 'due_soon', label: 'Vencen hoy' }
];

const typeOptions = [
  { key: 'all', label: 'Todos los tipos' },
  { key: 'incidencia', label: 'Incidencias' },
  { key: 'solicitud', label: 'Solicitudes' }
];

const LIST_PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_LIST_PAGE_SIZE = LIST_PAGE_SIZE_OPTIONS[0];
const PIPELINE_VISIBLE_BATCH = 4;
const MAX_ATTACHMENT_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_COMPRESSION_TRIGGER_BYTES = 1_200_000;
const IMAGE_COMPRESSION_MAX_DIMENSION = 1920;
const IMAGE_COMPRESSION_QUALITY = 0.84;
const ATTACHMENT_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf,.txt,image/jpeg,image/png,image/webp,application/pdf,text/plain';

const defaultAdvancedFilters = {
  priority: 'all',
  category: 'all',
  assigneeUserId: 'all',
  hasAttachments: 'all'
};

const statusKeys = Object.keys(statusMeta);
const detailTabs = ['comments', 'activity', 'attachments'];

const summarizeByStatus = (tickets) => {
  const counts = statusKeys.reduce((accumulator, statusKey) => {
    accumulator[statusKey] = 0;
    return accumulator;
  }, {});

  tickets.forEach((ticket) => {
    if (Object.prototype.hasOwnProperty.call(counts, ticket.status)) {
      counts[ticket.status] += 1;
    }
  });

  return statusKeys.map((statusKey) => ({
    key: statusKey,
    label: statusMeta[statusKey].label,
    count: counts[statusKey],
    tone: statusMeta[statusKey].tone
  }));
};

const groupTicketsByStatus = (tickets) => {
  const grouped = statusKeys.reduce((accumulator, statusKey) => {
    accumulator[statusKey] = [];
    return accumulator;
  }, {});

  tickets.forEach((ticket) => {
    if (Object.prototype.hasOwnProperty.call(grouped, ticket.status)) {
      grouped[ticket.status].push(ticket);
    }
  });

  return statusKeys.map((statusKey) => ({
    key: statusKey,
    label: statusMeta[statusKey].label,
    tone: statusMeta[statusKey].tone,
    items: grouped[statusKey]
  }));
};

const createPipelineVisibleCounts = () => (
  statusKeys.reduce((accumulator, statusKey) => {
    accumulator[statusKey] = PIPELINE_VISIBLE_BATCH;
    return accumulator;
  }, {})
);

const getFocusableElements = (container) => {
  if (!container) {
    return [];
  }

  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([type="hidden"]):not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  return Array.from(container.querySelectorAll(selector)).filter(
    (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true'
  );
};

const trapFocusInContainer = (event, container) => {
  if (event.key !== 'Tab') {
    return;
  }

  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement;

  if (event.shiftKey) {
    if (activeElement === firstElement || !container.contains(activeElement)) {
      event.preventDefault();
      lastElement.focus();
    }
    return;
  }

  if (activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
};

const matchesSearch = (ticket, searchTerm) => {
  if (!searchTerm) {
    return true;
  }

  const normalizedQuery = searchTerm.trim().toLowerCase();
  const searchableText = [
    ticket.id,
    ticket.title,
    ticket.requester,
    ticket.assignee,
    categoryLabels[ticket.category]
  ].join(' ').toLowerCase();

  return searchableText.includes(normalizedQuery);
};

const getInitials = (fullName) => (
  String(fullName || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '??'
);

const isPrimaryOperatorUser = (user) => {
  const normalizedName = String(user?.name || '').trim().toLowerCase();
  const normalizedEmail = String(user?.email || '').trim().toLowerCase();

  return normalizedName === 'programador' || normalizedEmail === 'programador@linher.com.mx';
};

const toDateTimeInput = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const normalizeOptionalNumber = (value) => {
  const normalized = Number(value);
  return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
};

const readFileAsDataUrl = (file) => (
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No fue posible leer el archivo seleccionado.'));
    reader.readAsDataURL(file);
  })
);

const loadImageFromFile = async (file) => {
  const source = await readFileAsDataUrl(file);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No fue posible procesar la imagen seleccionada.'));
    image.src = source;
  });
};

const compressImageAttachment = async (file) => {
  if (!String(file.type || '').startsWith('image/')) {
    return file;
  }

  if (file.size <= IMAGE_COMPRESSION_TRIGGER_BYTES) {
    return file;
  }

  const image = await loadImageFromFile(file);
  const maxSide = Math.max(image.width, image.height);
  const scale = maxSide > IMAGE_COMPRESSION_MAX_DIMENSION
    ? IMAGE_COMPRESSION_MAX_DIMENSION / maxSide
    : 1;

  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/webp', IMAGE_COMPRESSION_QUALITY);
  });

  if (!blob || blob.size >= file.size) {
    return file;
  }

  const nextName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${nextName || 'adjunto'}.webp`, {
    type: 'image/webp',
    lastModified: Date.now()
  });
};

const normalizeAttachmentForUpload = async (file) => {
  const preparedFile = await compressImageAttachment(file);

  if (preparedFile.size > MAX_ATTACHMENT_FILE_SIZE_BYTES) {
    throw new Error('El archivo supera el límite de 5 MB después de optimizarse.');
  }

  return preparedFile;
};

const buildTicketFormDefaults = ({ requesters = [] } = {}) => ({
  title: '',
  summary: '',
  type: 'solicitud',
  category: 'acceso_logico',
  priority: 'media',
  requester_user_id: requesters[0]?.id ? String(requesters[0].id) : '',
  assignee_user_id: '',
  due_at: '',
  channel: channelOptions[0]
});

const buildEditFormDefaults = (ticket) => ({
  title: ticket.title,
  summary: ticket.summary,
  type: ticket.type,
  category: ticket.category,
  priority: ticket.priority,
  requester_user_id: String(ticket.requesterUserId),
  assignee_user_id: ticket.assigneeUserId ? String(ticket.assigneeUserId) : '',
  due_at: toDateTimeInput(ticket.dueAt),
  channel: normalizeChannelOption(ticket.channel)
});

const buildTicketPayload = (formData) => ({
  title: String(formData.title || '').trim(),
  summary: String(formData.summary || '').trim(),
  type: formData.type,
  category: formData.category,
  priority: formData.priority,
  requester_user_id: normalizeOptionalNumber(formData.requester_user_id),
  assignee_user_id: normalizeOptionalNumber(formData.assignee_user_id),
  due_at: formData.due_at || null,
  channel: formData.channel
});

const TicketBadge = ({ label, tone }) => (
  <span className={`ticket-badge ticket-badge--${tone}`}>{label}</span>
);

const TicketEditorModal = ({
  title,
  open,
  onClose,
  onSubmit,
  formData,
  onFieldChange,
  requesterUsers,
  assigneeUsers,
  submitLabel,
  isSubmitting,
  submitError,
  returnFocusRef
}) => {
  const modalRef = useRef(null);
  const titleInputRef = useRef(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        returnFocusRef?.current?.focus?.();
      }
      wasOpenRef.current = false;
      return undefined;
    }

    wasOpenRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      const fallbackTarget = getFocusableElements(modalRef.current)[0] || null;
      (titleInputRef.current || fallbackTarget)?.focus?.();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, returnFocusRef]);

  if (!open) {
    return null;
  }

  return (
    <div className="ticket-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ticket-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={modalRef}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
            return;
          }

          trapFocusInContainer(event, modalRef.current);
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ticket-modal__header">
          <h2 className="ticket-modal__title">{title}</h2>
          <button
            type="button"
            className="ticket-modal__close"
            onClick={onClose}
            aria-label="Cerrar formulario de ticket"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <form className="ticket-modal__form" onSubmit={onSubmit}>
          <label className="ticket-modal__field">
            <span>Título</span>
            <input
              ref={titleInputRef}
              type="text"
              name="title"
              value={formData.title}
              onChange={onFieldChange}
              maxLength={220}
              required
            />
          </label>

          <label className="ticket-modal__field">
            <span>Resumen</span>
            <textarea
              name="summary"
              rows="4"
              value={formData.summary}
              onChange={onFieldChange}
              required
            />
          </label>

          <div className="ticket-modal__grid">
            <label className="ticket-modal__field">
              <span>Tipo</span>
              <select name="type" value={formData.type} onChange={onFieldChange}>
                {Object.entries(typeMeta).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="ticket-modal__field">
              <span>Categoría</span>
              <select name="category" value={formData.category} onChange={onFieldChange}>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="ticket-modal__field">
              <span>Prioridad</span>
              <select name="priority" value={formData.priority} onChange={onFieldChange}>
                {Object.entries(priorityMeta).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="ticket-modal__field">
              <span>Canal</span>
              <select name="channel" value={formData.channel} onChange={onFieldChange}>
                {channelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="ticket-modal__field">
              <span>Solicitante</span>
              <select
                name="requester_user_id"
                value={formData.requester_user_id}
                onChange={onFieldChange}
                required
              >
                {requesterUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="ticket-modal__field">
              <span>Responsable</span>
              <select
                name="assignee_user_id"
                value={formData.assignee_user_id}
                onChange={onFieldChange}
              >
                <option value="">Sin asignar</option>
                {assigneeUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="ticket-modal__field ticket-modal__field--full">
              <span>Vence</span>
              <input
                type="datetime-local"
                name="due_at"
                value={formData.due_at}
                onChange={onFieldChange}
              />
            </label>
          </div>

          {submitError ? (
            <p className="ticket-modal__error" role="alert">{submitError}</p>
          ) : null}

          <footer className="ticket-modal__actions">
            <button
              type="button"
              className="tickets-empty-state__action tickets-empty-state__action--ghost"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="tickets-page__primary-action" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : submitLabel}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

const AdvancedFiltersModal = ({
  open,
  onClose,
  draftFilters,
  onDraftChange,
  onApply,
  onClear,
  assigneeUsers,
  returnFocusRef
}) => {
  const modalRef = useRef(null);
  const prioritySelectRef = useRef(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        returnFocusRef?.current?.focus?.();
      }
      wasOpenRef.current = false;
      return undefined;
    }

    wasOpenRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      const fallbackTarget = getFocusableElements(modalRef.current)[0] || null;
      (prioritySelectRef.current || fallbackTarget)?.focus?.();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, returnFocusRef]);

  if (!open) {
    return null;
  }

  return (
    <div className="ticket-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ticket-modal ticket-modal--narrow"
        role="dialog"
        aria-modal="true"
        aria-label="Filtros avanzados"
        ref={modalRef}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
            return;
          }

          trapFocusInContainer(event, modalRef.current);
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ticket-modal__header">
          <h2 className="ticket-modal__title">Filtros avanzados</h2>
          <button
            type="button"
            className="ticket-modal__close"
            onClick={onClose}
            aria-label="Cerrar filtros avanzados"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="ticket-modal__form">
          <div className="ticket-modal__grid">
            <label className="ticket-modal__field">
              <span>Prioridad</span>
              <select
                ref={prioritySelectRef}
                name="priority"
                value={draftFilters.priority}
                onChange={onDraftChange}
              >
                <option value="all">Todas</option>
                {Object.entries(priorityMeta).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="ticket-modal__field">
              <span>Categoría</span>
              <select
                name="category"
                value={draftFilters.category}
                onChange={onDraftChange}
              >
                <option value="all">Todas</option>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="ticket-modal__field">
              <span>Responsable</span>
              <select
                name="assigneeUserId"
                value={draftFilters.assigneeUserId}
                onChange={onDraftChange}
              >
                <option value="all">Todos</option>
                <option value="none">Sin asignar</option>
                {assigneeUsers.map((user) => (
                  <option key={user.id} value={String(user.id)}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="ticket-modal__field">
              <span>Adjuntos</span>
              <select
                name="hasAttachments"
                value={draftFilters.hasAttachments}
                onChange={onDraftChange}
              >
                <option value="all">Todos</option>
                <option value="with">Con adjuntos</option>
                <option value="without">Sin adjuntos</option>
              </select>
            </label>
          </div>

          <footer className="ticket-modal__actions">
            <button
              type="button"
              className="tickets-empty-state__action tickets-empty-state__action--ghost"
              onClick={onClear}
            >
              Limpiar
            </button>
            <button type="button" className="tickets-empty-state__action" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="tickets-page__primary-action" onClick={onApply}>
              Aplicar filtros
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

const TicketDetailPanel = ({
  ticket,
  onClose,
  onEdit,
  onChangeStatus,
  onAddComment,
  isStatusSubmitting,
  statusChangeError,
  isCommentSubmitting,
  commentError,
  onUploadAttachment,
  isUploadingAttachment,
  attachmentError,
  closeButtonRef
}) => {
  const attachmentInputRef = useRef(null);
  const detailTabRefs = useRef({});
  const [nextStatus, setNextStatus] = useState(ticket?.status || 'nuevo');
  const [commentDraft, setCommentDraft] = useState('');
  const [detailTab, setDetailTab] = useState('comments');

  useEffect(() => {
    if (!ticket) {
      return;
    }

    setNextStatus(ticket.status);
    setCommentDraft('');
    setDetailTab('comments');
  }, [ticket]);

  if (!ticket) {
    return (
      <aside className="ticket-detail ticket-detail--empty" aria-label="Detalle del ticket">
        <p className="ticket-detail__empty-title">Selecciona un ticket</p>
        <p className="ticket-detail__empty-copy">
          El detalle, la actividad, los comentarios y los adjuntos aparecerán aquí.
        </p>
      </aside>
    );
  }

  const isStatusUnchanged = nextStatus === ticket.status;
  const ticketDomId = String(ticket.id || 'ticket').toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  const getDetailTabId = (tabKey) => `ticket-detail-tab-${ticketDomId}-${tabKey}`;
  const getDetailPanelId = (tabKey) => `ticket-detail-panel-${ticketDomId}-${tabKey}`;

  const moveTabFocus = (tabKey) => {
    const nextButton = detailTabRefs.current[tabKey];
    if (nextButton) {
      nextButton.focus();
    }
  };

  const handleDetailTabKeyDown = (event, currentTabKey) => {
    const currentIndex = detailTabs.indexOf(currentTabKey);
    if (currentIndex === -1) {
      return;
    }

    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % detailTabs.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + detailTabs.length) % detailTabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = detailTabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextTabKey = detailTabs[nextIndex];
    setDetailTab(nextTabKey);
    requestAnimationFrame(() => moveTabFocus(nextTabKey));
  };

  return (
    <aside
      className={`ticket-detail ticket-detail--tone-${statusMeta[ticket.status]?.tone || 'neutral'}`}
      aria-label={`Detalle de ${ticket.id}`}
    >
      <div className="ticket-detail__header">
        <div className="ticket-detail__header-top">
          <div className="ticket-detail__header-id">
            <span className="ticket-detail__ticket-id">{ticket.id}</span>
            <TicketBadge label={statusMeta[ticket.status].label} tone={statusMeta[ticket.status].tone} />
          </div>
          <div className="ticket-detail__header-actions">
            <button
              type="button"
              className="ticket-detail__edit"
              onClick={(event) => onEdit(event.currentTarget)}
            >
              Editar
            </button>
            <button
              type="button"
              className="ticket-detail__close"
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Cerrar detalle"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
        <h2 className="ticket-detail__title">{ticket.title}</h2>
        <p className="ticket-detail__summary">{ticket.summary}</p>
      </div>

      <div className="ticket-detail__meta-grid">
        <div className="ticket-detail__meta-item">
          <span className="ticket-detail__meta-label">Solicitante</span>
          <strong>{ticket.requester}</strong>
        </div>
        <div className="ticket-detail__meta-item">
          <span className="ticket-detail__meta-label">Responsable</span>
          <strong>{ticket.assignee}</strong>
        </div>
        <div className="ticket-detail__meta-item">
          <span className="ticket-detail__meta-label">Tipo</span>
          <strong>{typeMeta[ticket.type].label}</strong>
        </div>
        <div className="ticket-detail__meta-item">
          <span className="ticket-detail__meta-label">Prioridad</span>
          <strong>{priorityMeta[ticket.priority].label}</strong>
        </div>
      </div>

      <section className="ticket-detail__section ticket-detail__section--status">
        <div className="ticket-detail__section-headline">
          <div className="ticket-detail__section-title">
            <ArrowRightLeft size={16} aria-hidden="true" />
            <span>Estado operativo</span>
          </div>
        </div>
        <form
          className="ticket-detail__status-controls"
          onSubmit={(event) => {
            event.preventDefault();
            void onChangeStatus(nextStatus);
          }}
        >
          <label className="ticket-detail__status-field" htmlFor="ticket-detail-next-status">
            <span className="sr-only">Seleccionar nuevo estado</span>
            <select
              id="ticket-detail-next-status"
              name="ticket_detail_next_status"
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value)}
              disabled={isStatusSubmitting}
            >
              {Object.entries(statusMeta).map(([statusKey, statusValue]) => (
                <option key={statusKey} value={statusKey}>
                  {statusValue.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="ticket-detail__status-submit"
            disabled={isStatusSubmitting || isStatusUnchanged}
          >
            <span>
              {isStatusSubmitting
                ? 'Actualizando...'
                : (isStatusUnchanged ? 'Sin cambios' : 'Guardar estado')}
            </span>
          </button>
        </form>

        <p className="ticket-detail__status-help">
          En pipeline también puedes mover este ticket arrastrándolo al carril de destino.
        </p>

        {statusChangeError ? (
          <p className="ticket-detail__attach-error" role="alert">{statusChangeError}</p>
        ) : null}
      </section>

      <section className="ticket-detail__section ticket-detail__section--log">
        <div
          className="ticket-detail__tabs"
          role="tablist"
          aria-label="Registro del ticket"
          aria-orientation="horizontal"
        >
          <button
            type="button"
            role="tab"
            id={getDetailTabId('comments')}
            aria-selected={detailTab === 'comments'}
            aria-controls={getDetailPanelId('comments')}
            tabIndex={detailTab === 'comments' ? 0 : -1}
            className={`ticket-detail__tab ${detailTab === 'comments' ? 'ticket-detail__tab--active' : ''}`}
            onClick={() => setDetailTab('comments')}
            onKeyDown={(event) => handleDetailTabKeyDown(event, 'comments')}
            ref={(node) => {
              detailTabRefs.current.comments = node;
            }}
          >
            <span>Comentarios</span>
            <span>{ticket.comments.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            id={getDetailTabId('activity')}
            aria-selected={detailTab === 'activity'}
            aria-controls={getDetailPanelId('activity')}
            tabIndex={detailTab === 'activity' ? 0 : -1}
            className={`ticket-detail__tab ${detailTab === 'activity' ? 'ticket-detail__tab--active' : ''}`}
            onClick={() => setDetailTab('activity')}
            onKeyDown={(event) => handleDetailTabKeyDown(event, 'activity')}
            ref={(node) => {
              detailTabRefs.current.activity = node;
            }}
          >
            <span>Actividad</span>
            <span>{ticket.activity.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            id={getDetailTabId('attachments')}
            aria-selected={detailTab === 'attachments'}
            aria-controls={getDetailPanelId('attachments')}
            tabIndex={detailTab === 'attachments' ? 0 : -1}
            className={`ticket-detail__tab ${detailTab === 'attachments' ? 'ticket-detail__tab--active' : ''}`}
            onClick={() => setDetailTab('attachments')}
            onKeyDown={(event) => handleDetailTabKeyDown(event, 'attachments')}
            ref={(node) => {
              detailTabRefs.current.attachments = node;
            }}
          >
            <span>Adjuntos</span>
            <span>{ticket.attachments.length}</span>
          </button>
        </div>

        {detailTab === 'comments' ? (
          <div
            className="ticket-detail__tab-panel"
            id={getDetailPanelId('comments')}
            role="tabpanel"
            aria-labelledby={getDetailTabId('comments')}
            tabIndex={0}
          >
            <section className="ticket-detail__section ticket-detail__section--comments">
              <form
                className="ticket-detail__comment-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const nextComment = String(commentDraft || '').trim();
                  if (!nextComment || isCommentSubmitting) {
                    return;
                  }

                  const wasSaved = await onAddComment(nextComment);
                  if (wasSaved) {
                    setCommentDraft('');
                  }
                }}
              >
                <label className="ticket-detail__comment-field" htmlFor="ticket-detail-comment-input">
                  <span className="sr-only">Agregar comentario al ticket</span>
                  <textarea
                    id="ticket-detail-comment-input"
                    name="ticket_detail_comment_input"
                    rows="3"
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Escribe un comentario operativo..."
                    maxLength={1800}
                    disabled={isCommentSubmitting}
                  />
                </label>
                <button
                  type="submit"
                  className="ticket-detail__comment-submit"
                  disabled={isCommentSubmitting || String(commentDraft || '').trim().length === 0}
                >
                  {isCommentSubmitting ? 'Guardando...' : 'Agregar comentario'}
                </button>
              </form>

              {commentError ? (
                <p className="ticket-detail__attach-error" role="alert">{commentError}</p>
              ) : null}

              {ticket.comments.length > 0 ? (
                <>
                  <div className="ticket-detail__comment-history-headline" aria-hidden="true">
                    <span>Historial de comentarios</span>
                    <span>{ticket.comments.length}</span>
                  </div>
                  <p className="ticket-detail__comment-history-caption">Más recientes primero</p>
                  <ul className="ticket-activity ticket-activity--comments" aria-label="Historial de comentarios">
                    {ticket.comments.map((comment) => (
                      <li key={comment.id} className="ticket-activity__item">
                        <span className="ticket-activity__dot" aria-hidden="true" />
                        <div>
                          <p className="ticket-activity__title">{comment.text}</p>
                          <p className="ticket-activity__meta">
                            {comment.authorName} · {comment.createdLabel || 'Sin fecha'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="ticket-detail__comment-empty">Aún no hay comentarios en este ticket.</p>
              )}
            </section>
          </div>
        ) : null}

        {detailTab === 'activity' ? (
          <div
            className="ticket-detail__tab-panel"
            id={getDetailPanelId('activity')}
            role="tabpanel"
            aria-labelledby={getDetailTabId('activity')}
            tabIndex={0}
          >
            <section className="ticket-detail__section ticket-detail__section--activity">
              <ul className="ticket-activity">
                {ticket.activity.map((event) => (
                  <li key={event.id} className="ticket-activity__item">
                    <span className="ticket-activity__dot" aria-hidden="true" />
                    <div>
                      <p className="ticket-activity__title">{event.title}</p>
                      <p className="ticket-activity__meta">{event.meta}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}

        {detailTab === 'attachments' ? (
          <div
            className="ticket-detail__tab-panel"
            id={getDetailPanelId('attachments')}
            role="tabpanel"
            aria-labelledby={getDetailTabId('attachments')}
            tabIndex={0}
          >
            <section className="ticket-detail__section ticket-detail__section--attachments">
              <div className="ticket-detail__section-headline">
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept={ATTACHMENT_ACCEPT}
                  className="ticket-detail__attach-input"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0];
                    if (nextFile) {
                      onUploadAttachment(nextFile);
                    }
                    event.target.value = '';
                  }}
                />

                <button
                  type="button"
                  className="ticket-detail__attach-action"
                  onClick={() => attachmentInputRef.current?.click()}
                  disabled={isUploadingAttachment}
                >
                  <Upload size={14} aria-hidden="true" />
                  <span>{isUploadingAttachment ? 'Subiendo...' : 'Agregar adjunto'}</span>
                </button>
              </div>

              <p className="ticket-detail__attach-help">
                Puedes subir JPG, PNG, WEBP, PDF o TXT (máx. 5 MB).
              </p>

              {attachmentError ? (
                <p className="ticket-detail__attach-error" role="alert">{attachmentError}</p>
              ) : null}

              {ticket.attachments.length > 0 ? (
                <ul className="ticket-attachments">
                  {ticket.attachments.map((attachment) => (
                    <li key={`${attachment.id}-${attachment.name}`} className="ticket-attachments__item">
                      {attachment.url ? (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="ticket-attachments__name ticket-attachments__name--link"
                          aria-label={`${attachment.name} (se abre en una pestaña nueva)`}
                          title={`${attachment.name} (se abre en una pestaña nueva)`}
                        >
                          {attachment.name}
                        </a>
                      ) : (
                        <span className="ticket-attachments__name">{attachment.name}</span>
                      )}
                      <span className="ticket-attachments__size">{attachment.size}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ticket-detail__empty-copy">Este ticket todavía no tiene adjuntos.</p>
              )}
            </section>
          </div>
        ) : null}
      </section>
    </aside>
  );
};

const TicketDetailContextState = ({
  reason,
  ticketId,
  targetPage,
  onGoToPage,
  onResetFilters,
  onClose,
  closeButtonRef
}) => (
  <aside className="ticket-detail ticket-detail--empty" aria-label="Estado del detalle del ticket">
    <p className="ticket-detail__empty-title">El ticket seleccionado quedó fuera de esta vista</p>
    <p className="sr-only" aria-live="polite">
      {reason === 'page'
        ? `El ticket ${ticketId} está fuera de la página actual`
        : 'Este ticket no coincide con los filtros actuales'}
    </p>
    <p className="ticket-detail__empty-copy">
      {reason === 'page'
        ? `El ticket ${ticketId} está fuera de la página actual.`
        : 'Este ticket no coincide con los filtros actuales.'}
    </p>
    <div className="ticket-detail__empty-actions">
      {reason === 'page' && targetPage ? (
        <button type="button" className="tickets-empty-state__action" onClick={onGoToPage}>
          Ir a la página {targetPage}
        </button>
      ) : null}
      {reason === 'filters' ? (
        <button type="button" className="tickets-empty-state__action" onClick={onResetFilters}>
          Limpiar filtros
        </button>
      ) : null}
      <button
        type="button"
        className="tickets-empty-state__action tickets-empty-state__action--ghost"
        onClick={onClose}
        ref={closeButtonRef}
      >
        Cerrar panel
      </button>
    </div>
  </aside>
);

const TicketsPage = () => {
  const navigate = useNavigate();
  const { authUser, accessToken, clearSession } = useAuth();
  const currentOperator = String(authUser?.name || '').trim();
  const [tickets, setTickets] = useState([]);
  const [catalogRequesterUsers, setCatalogRequesterUsers] = useState([]);
  const [catalogAssigneeUsers, setCatalogAssigneeUsers] = useState([]);
  const [isTicketsLoading, setIsTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState('');
  const [isAuthRequiredError, setIsAuthRequiredError] = useState(false);
  const [activeView, setActiveView] = useState('list');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState(defaultAdvancedFilters);
  const [advancedDraft, setAdvancedDraft] = useState(defaultAdvancedFilters);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [pipelineVisibleCounts, setPipelineVisibleCounts] = useState(createPipelineVisibleCounts);
  const [draggingTicketId, setDraggingTicketId] = useState(null);
  const [dragOverLaneKey, setDragOverLaneKey] = useState('');
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState(buildTicketFormDefaults());
  const [ticketFormError, setTicketFormError] = useState('');
  const [isTicketFormSubmitting, setIsTicketFormSubmitting] = useState(false);
  const [isAttachmentUploading, setIsAttachmentUploading] = useState(false);
  const [attachmentUploadError, setAttachmentUploadError] = useState('');
  const [statusChangeError, setStatusChangeError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [actionToast, setActionToast] = useState(null);
  const detailCloseButtonRef = useRef(null);
  const detailTriggerRef = useRef(null);
  const shouldAutoFocusDetailRef = useRef(false);
  const advancedFiltersTriggerRef = useRef(null);
  const createTicketTriggerRef = useRef(null);
  const editTicketTriggerRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const clearToastTimer = () => {
    if (!toastTimeoutRef.current) {
      return;
    }

    window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = null;
  };

  const dismissToast = () => {
    clearToastTimer();
    setActionToast(null);
  };

  const showToast = (message, tone = 'success', duration = 3600) => {
    clearToastTimer();

    const nextToast = {
      id: `${Date.now()}-${Math.random()}`,
      tone,
      message
    };

    setActionToast(nextToast);

    if (duration > 0) {
      toastTimeoutRef.current = window.setTimeout(() => {
        setActionToast((currentToast) => (
          currentToast?.id === nextToast.id ? null : currentToast
        ));
      }, duration);
    }
  };

  useEffect(() => () => {
    clearToastTimer();
  }, []);

  const resetVolumeViews = () => {
    setCurrentPage(1);
    setPipelineVisibleCounts(createPipelineVisibleCounts());
  };

  const clearFilters = () => {
    closeTicketDetail(false);
    setScopeFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setSearchTerm('');
    setAdvancedFilters(defaultAdvancedFilters);
    setAdvancedDraft(defaultAdvancedFilters);
    resetVolumeViews();
  };

  const updateTicketInMemory = (nextTicket) => {
    setTickets((currentTickets) => (
      currentTickets.map((ticket) => (
        ticket.ticketId === nextTicket.ticketId ? nextTicket : ticket
      ))
    ));
  };

  const prependTicketInMemory = (nextTicket) => {
    setTickets((currentTickets) => [nextTicket, ...currentTickets]);
  };

  const openTicketDetail = (ticketId, triggerElement, options = {}) => {
    const { shouldAutoFocus = false } = options;

    if (triggerElement instanceof HTMLElement) {
      detailTriggerRef.current = triggerElement;
    }

    shouldAutoFocusDetailRef.current = Boolean(shouldAutoFocus);
    setAttachmentUploadError('');
    setStatusChangeError('');
    setCommentError('');
    setSelectedTicketId(ticketId);
    setIsDetailOpen(true);
  };

  const closeTicketDetail = (shouldRestoreFocus = true) => {
    setIsDetailOpen(false);
    setSelectedTicketId(null);
    setAttachmentUploadError('');
    setStatusChangeError('');
    setCommentError('');
    shouldAutoFocusDetailRef.current = false;

    if (shouldRestoreFocus) {
      window.requestAnimationFrame(() => {
        detailTriggerRef.current?.focus();
      });
    }
  };

  const activateView = (nextView) => {
    if (nextView === activeView) {
      return;
    }

    setActiveView(nextView);
    closeTicketDetail(false);
    resetVolumeViews();

    if (nextView === 'pipeline' && statusFilter !== 'all') {
      setStatusFilter('all');
    }
  };

  const loadWorkspaceData = async () => {
    setIsTicketsLoading(true);
    setTicketsError('');
    setIsAuthRequiredError(false);

    if (!accessToken) {
      setTickets([]);
      setCatalogRequesterUsers([]);
      setCatalogAssigneeUsers([]);
      setTicketsError('Debes iniciar sesión para continuar.');
      setIsAuthRequiredError(true);
      setIsTicketsLoading(false);
      navigate('/login', { replace: true, state: { from: '/tickets' } });
      return;
    }

    try {
      const [ticketsData, catalogData] = await Promise.all([
        listTickets(),
        getTicketsCatalog().catch(() => null)
      ]);

      const fallbackUsers = Array.isArray(catalogData?.users) ? catalogData.users : [];
      const requesterUsers = Array.isArray(catalogData?.requester_users)
        ? catalogData.requester_users
        : fallbackUsers;
      const assignableUsers = Array.isArray(catalogData?.assignee_users)
        ? catalogData.assignee_users
        : fallbackUsers;
      const fallbackAssigneeUsers = authUser?.id
        ? [{
          id: authUser.id,
          name: authUser.name,
          email: authUser.email || ''
        }]
        : requesterUsers.filter((user) => isPrimaryOperatorUser(user));
      const assigneeUsers = assignableUsers.length > 0
        ? assignableUsers
        : fallbackAssigneeUsers;

      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      setCatalogRequesterUsers(requesterUsers);
      setCatalogAssigneeUsers(assigneeUsers);
      setTicketForm(buildTicketFormDefaults({
        requesters: requesterUsers
      }));
      setIsAuthRequiredError(false);
    } catch (error) {
      setTickets([]);
      setCatalogRequesterUsers([]);
      setCatalogAssigneeUsers([]);
      const errorMessage = error?.message || 'No fue posible cargar la bandeja de tickets.';
      setTicketsError(errorMessage);
      const authError = isTicketsAuthError(error);
      setIsAuthRequiredError(authError);
      if (authError) {
        clearSession();
        navigate('/login', { replace: true, state: { from: '/tickets' } });
        return;
      }
      showToast(errorMessage, 'error', 5000);
    } finally {
      setIsTicketsLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkspaceData();
  }, [accessToken]);

  const ticketsByScopeAndType = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesScope = (
        scopeFilter === 'all' ||
        (scopeFilter === 'mine' && currentOperator && ticket.assignee === currentOperator) ||
        (scopeFilter === 'due_soon' && ticket.dueLabel.startsWith('Hoy'))
      );

      const matchesType = typeFilter === 'all' || ticket.type === typeFilter;
      const matchesPriority = (
        advancedFilters.priority === 'all' ||
        ticket.priority === advancedFilters.priority
      );
      const matchesCategory = (
        advancedFilters.category === 'all' ||
        ticket.category === advancedFilters.category
      );
      const matchesAssignee = (
        advancedFilters.assigneeUserId === 'all' ||
        (advancedFilters.assigneeUserId === 'none' && !ticket.assigneeUserId) ||
        String(ticket.assigneeUserId || '') === advancedFilters.assigneeUserId
      );
      const matchesAttachments = (
        advancedFilters.hasAttachments === 'all' ||
        (advancedFilters.hasAttachments === 'with' && ticket.attachmentsCount > 0) ||
        (advancedFilters.hasAttachments === 'without' && ticket.attachmentsCount === 0)
      );

      return (
        matchesScope &&
        matchesType &&
        matchesPriority &&
        matchesCategory &&
        matchesAssignee &&
        matchesAttachments &&
        matchesSearch(ticket, searchTerm)
      );
    });
  }, [tickets, scopeFilter, typeFilter, advancedFilters, searchTerm]);

  const statusSummary = useMemo(
    () => summarizeByStatus(ticketsByScopeAndType),
    [ticketsByScopeAndType]
  );

  const filteredTickets = useMemo(() => {
    if (activeView !== 'list' || statusFilter === 'all') {
      return ticketsByScopeAndType;
    }

    return ticketsByScopeAndType.filter((ticket) => ticket.status === statusFilter);
  }, [ticketsByScopeAndType, statusFilter, activeView]);

  const activeAdvancedFiltersCount = useMemo(
    () => Object.values(advancedFilters).filter((value) => value !== 'all').length,
    [advancedFilters]
  );

  const hasResults = filteredTickets.length > 0;
  const groupedTickets = useMemo(
    () => groupTicketsByStatus(filteredTickets),
    [filteredTickets]
  );
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / itemsPerPage));
  const resolvedCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (resolvedCurrentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredTickets.slice(pageStart, pageStart + itemsPerPage);
  const selectedTicketInDataset = tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;
  const selectedTicket = filteredTickets.find((ticket) => ticket.id === selectedTicketId) ?? null;
  const isSelectedTicketVisibleInList = paginatedTickets.some((ticket) => ticket.id === selectedTicketId);
  const selectedTicketListIndex = selectedTicket
    ? filteredTickets.findIndex((ticket) => ticket.id === selectedTicket.id)
    : -1;
  const selectedTicketTargetPage = selectedTicketListIndex >= 0
    ? Math.floor(selectedTicketListIndex / itemsPerPage) + 1
    : null;
  const isDetailHiddenByPage = Boolean(
    isDetailOpen &&
    activeView === 'list' &&
    selectedTicket &&
    !isSelectedTicketVisibleInList
  );
  const isDetailHiddenByFilters = Boolean(
    isDetailOpen &&
    selectedTicketId &&
    selectedTicketInDataset &&
    !selectedTicket
  );
  const detailHiddenReason = isDetailHiddenByPage ? 'page' : (isDetailHiddenByFilters ? 'filters' : null);
  const shouldRenderDetailNotice = Boolean(detailHiddenReason);
  const shouldRenderDetail = Boolean(
    selectedTicket &&
    isDetailOpen &&
    !isDetailHiddenByPage
  );
  const hasDetailPanel = shouldRenderDetail || shouldRenderDetailNotice;
  const liveStatusMessage = useMemo(() => {
    if (activeView === 'list') {
      if (!hasResults) {
        return 'Vista de lista. No hay tickets para los filtros actuales.';
      }

      const start = pageStart + 1;
      const end = Math.min(pageStart + itemsPerPage, filteredTickets.length);
      const statusLabel = statusFilter === 'all'
        ? 'todos los estados'
        : statusMeta[statusFilter]?.label.toLowerCase();

      return `Vista de lista. Filtro por ${statusLabel}. Mostrando ${start} a ${end} de ${filteredTickets.length} tickets. Página ${resolvedCurrentPage} de ${totalPages}.`;
    }

    if (!hasResults) {
      return 'Vista pipeline. No hay tickets para los filtros actuales.';
    }

    const visibleInPipeline = groupedTickets.reduce((totalVisible, lane) => {
      const visibleCount = pipelineVisibleCounts[lane.key] ?? PIPELINE_VISIBLE_BATCH;
      return totalVisible + Math.min(lane.items.length, visibleCount);
    }, 0);

    return `Vista pipeline. Mostrando ${visibleInPipeline} de ${filteredTickets.length} tickets cargados en carriles.`;
  }, [
    activeView,
    hasResults,
    pageStart,
    itemsPerPage,
    filteredTickets.length,
    resolvedCurrentPage,
    totalPages,
    statusFilter,
    groupedTickets,
    pipelineVisibleCounts
  ]);

  useEffect(() => {
    if (!isDetailOpen || (!shouldRenderDetail && !shouldRenderDetailNotice)) {
      return undefined;
    }

    if (!shouldAutoFocusDetailRef.current) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      detailCloseButtonRef.current?.focus();
      shouldAutoFocusDetailRef.current = false;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isDetailOpen, shouldRenderDetail, shouldRenderDetailNotice, selectedTicketId, activeView]);

  useEffect(() => {
    if (!isDetailOpen || isAdvancedFiltersOpen || isCreateModalOpen || isEditModalOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      closeTicketDetail();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailOpen, isAdvancedFiltersOpen, isCreateModalOpen, isEditModalOpen]);

  const handleOpenAdvancedFilters = () => {
    setAdvancedDraft(advancedFilters);
    setIsAdvancedFiltersOpen(true);
  };

  const handleApplyAdvancedFilters = () => {
    closeTicketDetail(false);
    setAdvancedFilters(advancedDraft);
    setIsAdvancedFiltersOpen(false);
    resetVolumeViews();
  };

  const handleClearAdvancedFilters = () => {
    closeTicketDetail(false);
    setAdvancedDraft(defaultAdvancedFilters);
    setAdvancedFilters(defaultAdvancedFilters);
    resetVolumeViews();
  };

  const handleOpenCreateModal = () => {
    setTicketFormError('');
    setTicketForm(buildTicketFormDefaults({ requesters: catalogRequesterUsers }));
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (triggerElement) => {
    if (!selectedTicket) {
      return;
    }

    if (triggerElement instanceof HTMLElement) {
      editTicketTriggerRef.current = triggerElement;
    }

    setTicketFormError('');
    setTicketForm(buildEditFormDefaults(selectedTicket));
    setIsEditModalOpen(true);
  };

  const handleTicketFormChange = (event) => {
    const { name, value } = event.target;
    setTicketForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const handleCreateTicket = async (event) => {
    event.preventDefault();
    setIsTicketFormSubmitting(true);
    setTicketFormError('');

    try {
      const payload = buildTicketPayload(ticketForm);
      const createdTicket = await createTicket(payload);
      prependTicketInMemory(createdTicket);
      setSelectedTicketId(createdTicket.id);
      setIsDetailOpen(true);
      setIsCreateModalOpen(false);
      setTicketForm(buildTicketFormDefaults({ requesters: catalogRequesterUsers }));
      resetVolumeViews();
      showToast(`Ticket ${createdTicket.id} creado correctamente.`, 'success');
    } catch (error) {
      const errorMessage = error?.message || 'No fue posible crear el ticket.';
      setTicketFormError(errorMessage);
      showToast(errorMessage, 'error', 5000);
    } finally {
      setIsTicketFormSubmitting(false);
    }
  };

  const handleEditTicket = async (event) => {
    event.preventDefault();
    if (!selectedTicket) {
      return;
    }

    setIsTicketFormSubmitting(true);
    setTicketFormError('');

    try {
      const payload = buildTicketPayload(ticketForm);
      const updatedTicket = await updateTicket(selectedTicket.ticketId, payload);
      updateTicketInMemory(updatedTicket);
      setIsEditModalOpen(false);
      showToast(`Ticket ${updatedTicket.id} actualizado correctamente.`, 'success');
    } catch (error) {
      const errorMessage = error?.message || 'No fue posible actualizar el ticket.';
      setTicketFormError(errorMessage);
      showToast(errorMessage, 'error', 5000);
    } finally {
      setIsTicketFormSubmitting(false);
    }
  };

  const handleUploadAttachment = async (sourceFile) => {
    if (!selectedTicket) {
      return;
    }

    setIsAttachmentUploading(true);
    setAttachmentUploadError('');
    setCommentError('');

    try {
      const preparedFile = await normalizeAttachmentForUpload(sourceFile);
      const updatedTicket = await uploadTicketAttachment(selectedTicket.ticketId, preparedFile);
      updateTicketInMemory(updatedTicket);
      showToast(`Adjunto agregado en ${updatedTicket.id}.`, 'success');
    } catch (error) {
      const errorMessage = error?.message || 'No fue posible subir el adjunto.';
      setAttachmentUploadError(errorMessage);
      showToast(errorMessage, 'error', 5000);
    } finally {
      setIsAttachmentUploading(false);
    }
  };

  const handleAddCommentFromDetail = async (commentText) => {
    if (!selectedTicket || isCommentSubmitting) {
      return false;
    }

    setIsCommentSubmitting(true);
    setCommentError('');
    setTicketsError('');

    try {
      const updatedTicket = await addTicketComment(selectedTicket.ticketId, commentText);
      updateTicketInMemory(updatedTicket);
      setSelectedTicketId(updatedTicket.id);
      setIsDetailOpen(true);
      showToast('Comentario agregado correctamente.', 'success');
      return true;
    } catch (error) {
      const errorMessage = error?.message || 'No fue posible guardar el comentario.';
      setCommentError(errorMessage);
      showToast(errorMessage, 'error', 5000);
      return false;
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleDropOnLane = async (targetStatus) => {
    if (!draggingTicketId || isStatusSubmitting) {
      setDragOverLaneKey('');
      return;
    }

    const sourceTicket = tickets.find((ticket) => String(ticket.ticketId) === String(draggingTicketId));

    if (!sourceTicket || sourceTicket.status === targetStatus) {
      setDragOverLaneKey('');
      setDraggingTicketId(null);
      return;
    }

    setIsStatusSubmitting(true);
    setTicketsError('');

    try {
      const updatedTicket = await updateTicketStatus(sourceTicket.ticketId, targetStatus);
      updateTicketInMemory(updatedTicket);
      setSelectedTicketId(updatedTicket.id);
      setIsDetailOpen(true);
      showToast(`Estado actualizado a ${statusMeta[targetStatus]?.label || 'nuevo estado'}.`, 'success');
    } catch (error) {
      const errorMessage = error?.message || 'No fue posible mover el ticket en pipeline.';
      setTicketsError(errorMessage);
      showToast(errorMessage, 'error', 5000);
    } finally {
      setDragOverLaneKey('');
      setDraggingTicketId(null);
      setIsStatusSubmitting(false);
    }
  };

  const handleChangeStatusFromDetail = async (nextStatus) => {
    if (!selectedTicket || isStatusSubmitting || nextStatus === selectedTicket.status) {
      return;
    }

    setIsStatusSubmitting(true);
    setStatusChangeError('');
    setCommentError('');
    setTicketsError('');

    try {
      const updatedTicket = await updateTicketStatus(selectedTicket.ticketId, nextStatus);
      updateTicketInMemory(updatedTicket);
      setSelectedTicketId(updatedTicket.id);
      setIsDetailOpen(true);
      showToast(`Estado actualizado a ${statusMeta[nextStatus]?.label || 'nuevo estado'}.`, 'success');
    } catch (error) {
      const errorMessage = error?.message || 'No fue posible actualizar el estado del ticket.';
      setStatusChangeError(errorMessage);
      showToast(errorMessage, 'error', 5000);
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  return (
    <section className="tickets-page" aria-label="Área de trabajo de Tickets">
      <header className="tickets-page__header">
        <div className="tickets-page__heading">
          <h1 className="tickets-page__title">Tickets</h1>
        </div>

        <div className="tickets-page__header-actions">
          <button
            type="button"
            className="tickets-page__ghost-action"
            ref={advancedFiltersTriggerRef}
            onClick={handleOpenAdvancedFilters}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            <span>
              Filtros avanzados
              {activeAdvancedFiltersCount > 0 ? ` (${activeAdvancedFiltersCount})` : ''}
            </span>
          </button>
          <button
            type="button"
            className="tickets-page__primary-action"
            ref={createTicketTriggerRef}
            onClick={handleOpenCreateModal}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Nuevo ticket</span>
          </button>
        </div>
      </header>

      <section className="tickets-page__surface">
        <div className="tickets-page__toolbar">
          <label className="tickets-page__search" htmlFor="ticket-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Buscar en tickets</span>
            <input
              className="tickets-page__search-input"
              id="ticket-search"
              name="ticket_search"
              type="search"
              value={searchTerm}
              onChange={(event) => {
                closeTicketDetail(false);
                setSearchTerm(event.target.value);
                resetVolumeViews();
              }}
              placeholder="Buscar tickets por folio, título o solicitante"
            />
          </label>

          <SegmentedControl
            label="Vistas de tickets"
            options={viewOptions}
            activeKey={activeView}
            onActivate={activateView}
            idPrefix="tickets-view-tab"
            panelIdByKey={(key) => (key === 'list' ? 'tickets-list-panel' : 'tickets-pipeline-panel')}
            onKeyDown={(event) => {
              if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
                return;
              }

              event.preventDefault();
              const currentIndex = viewOptions.findIndex((option) => option.key === activeView);
              if (currentIndex === -1) {
                return;
              }

              let nextIndex = currentIndex;
              if (event.key === 'ArrowRight') {
                nextIndex = (currentIndex + 1) % viewOptions.length;
              } else if (event.key === 'ArrowLeft') {
                nextIndex = (currentIndex - 1 + viewOptions.length) % viewOptions.length;
              } else if (event.key === 'Home') {
                nextIndex = 0;
              } else if (event.key === 'End') {
                nextIndex = viewOptions.length - 1;
              }

              const nextView = viewOptions[nextIndex];
              if (!nextView) {
                return;
              }

              activateView(nextView.key);
              window.requestAnimationFrame(() => {
                document.getElementById(`tickets-view-tab-${nextView.key}`)?.focus();
              });
            }}
          />
        </div>

        <div className="tickets-page__control-row">
          <div
            className={`tickets-page__summary-slot${activeView !== 'list' ? ' tickets-page__summary-slot--placeholder' : ''}`}
            aria-hidden={activeView !== 'list'}
          >
            {activeView === 'list' ? (
              <div className="tickets-page__summary" role="group" aria-label="Resumen por estado">
                <button
                  type="button"
                  className={`tickets-page__summary-card tickets-page__summary-card--all${statusFilter === 'all' ? ' tickets-page__summary-card--active' : ''}`}
                  onClick={() => {
                    closeTicketDetail(false);
                    setStatusFilter('all');
                    resetVolumeViews();
                  }}
                  aria-pressed={statusFilter === 'all'}
                  aria-label={`Filtrar todos los tickets. ${ticketsByScopeAndType.length} resultados visibles.`}
                >
                  <span className="tickets-page__summary-label">Todos</span>
                  <strong className="tickets-page__summary-value">{ticketsByScopeAndType.length}</strong>
                </button>

                {statusSummary.map((itemSummary) => (
                  <button
                    key={itemSummary.key}
                    type="button"
                    className={`tickets-page__summary-card tickets-page__summary-card--${itemSummary.tone}${statusFilter === itemSummary.key ? ' tickets-page__summary-card--active' : ''}`}
                    onClick={() => {
                      closeTicketDetail(false);
                      setStatusFilter(itemSummary.key);
                      resetVolumeViews();
                    }}
                    aria-pressed={statusFilter === itemSummary.key}
                    aria-label={`Filtrar tickets en ${itemSummary.label}. ${itemSummary.count} resultados visibles.`}
                  >
                    <span className="tickets-page__summary-label">{itemSummary.label}</span>
                    <strong className="tickets-page__summary-value">{itemSummary.count}</strong>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="tickets-page__filters" aria-label="Filtros de tickets">
            <FilterChipGroup
              label="Alcance de tickets"
              options={scopeOptions}
              activeKey={scopeFilter}
              onSelect={(optionKey) => {
                closeTicketDetail(false);
                setScopeFilter(optionKey);
                resetVolumeViews();
              }}
            />

            <FilterChipGroup
              label="Tipo de ticket"
              options={typeOptions}
              activeKey={typeFilter}
              onSelect={(optionKey) => {
                closeTicketDetail(false);
                setTypeFilter(optionKey);
                resetVolumeViews();
              }}
            />
          </div>
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {liveStatusMessage}
        </p>

        <div className={`tickets-layout tickets-layout--${activeView}${hasDetailPanel ? ' tickets-layout--detail-open' : ''}`}>
          <div className="tickets-layout__main">
            {isTicketsLoading ? (
              <EmptyState
                title="Cargando tickets"
                copy="Estamos obteniendo la bandeja operativa desde base de datos."
              />
            ) : ticketsError ? (
              <EmptyState
                title="No fue posible cargar los tickets"
                copy={ticketsError}
              >
                <div className="tickets-empty-state__actions">
                  {isAuthRequiredError ? (
                    <button
                      type="button"
                      className="tickets-page__primary-action"
                      onClick={() => {
                        clearSession();
                        navigate('/login', { replace: true, state: { from: '/tickets' } });
                      }}
                    >
                      Iniciar sesión
                    </button>
                  ) : null}
                  <button type="button" className="tickets-empty-state__action" onClick={loadWorkspaceData}>
                    Reintentar carga
                  </button>
                </div>
              </EmptyState>
            ) : activeView === 'list' ? (
              hasResults ? (
                <div
                  className={`ticket-list${statusFilter !== 'all' ? ` ticket-list--${statusMeta[statusFilter].tone}` : ''}`}
                  id="tickets-list-panel"
                  role="tabpanel"
                  aria-labelledby="tickets-view-tab-list"
                  hidden={activeView !== 'list'}
                >
                  <div className="ticket-list__scroll">
                    <table className="ticket-list__table">
                      <colgroup>
                        <col className="ticket-list__col ticket-list__col--ticket" />
                        <col className="ticket-list__col ticket-list__col--status" />
                        <col className="ticket-list__col ticket-list__col--priority" />
                        <col className="ticket-list__col ticket-list__col--requester" />
                        <col className="ticket-list__col ticket-list__col--assignee" />
                        <col className="ticket-list__col ticket-list__col--due" />
                        <col className="ticket-list__col ticket-list__col--activity" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th scope="col">Ticket</th>
                          <th scope="col">Estado</th>
                          <th scope="col">Prioridad</th>
                          <th scope="col">Solicitante</th>
                          <th scope="col">Responsable</th>
                          <th scope="col">Vence</th>
                          <th scope="col">Actividad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTickets.map((ticket) => {
                          const isSelected = selectedTicket?.id === ticket.id;

                          return (
                            <tr
                              key={ticket.id}
                              className={isSelected ? 'ticket-list__row ticket-list__row--active' : 'ticket-list__row'}
                            >
                              <td>
                                <button
                                  type="button"
                                  className="ticket-list__row-action"
                                  onClick={(event) => {
                                    openTicketDetail(ticket.id, event.currentTarget, {
                                      shouldAutoFocus: event.detail === 0
                                    });
                                  }}
                                  aria-label={`Ver detalle del ticket ${ticket.id}`}
                                >
                                  <span className="ticket-list__ticket-id">{ticket.id}</span>
                                  <span className="ticket-list__ticket-title">{ticket.title}</span>
                                  <span className="ticket-list__ticket-meta">
                                    {typeMeta[ticket.type].label} · {categoryLabels[ticket.category]}
                                  </span>
                                  <span className="ticket-list__ticket-meta ticket-list__ticket-meta--compact">
                                    {ticket.requester} · {ticket.assignee} · {ticket.dueLabel}
                                  </span>
                                </button>
                              </td>
                              <td className="ticket-list__cell ticket-list__cell--status">
                                <TicketBadge label={statusMeta[ticket.status].label} tone={statusMeta[ticket.status].tone} />
                              </td>
                              <td className="ticket-list__cell ticket-list__cell--priority">
                                <TicketBadge label={priorityMeta[ticket.priority].label} tone={priorityMeta[ticket.priority].tone} />
                              </td>
                              <td className="ticket-list__cell ticket-list__cell--requester">
                                <div className="ticket-list__person">
                                  <span className="ticket-list__avatar" aria-hidden="true">
                                    {ticket.requesterPhoto ? (
                                      <img src={ticket.requesterPhoto} alt="" loading="lazy" />
                                    ) : (
                                      <span>{getInitials(ticket.requester)}</span>
                                    )}
                                  </span>
                                  <div className="ticket-list__person-copy">
                                    <strong>{ticket.requester}</strong>
                                    <span>{ticket.area}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="ticket-list__cell ticket-list__cell--assignee">
                                <span className="ticket-list__truncate">{ticket.assignee}</span>
                              </td>
                              <td className="ticket-list__cell ticket-list__cell--due">
                                <span className="ticket-list__truncate">{ticket.dueLabel}</span>
                              </td>
                              <td className="ticket-list__cell ticket-list__cell--activity">
                                <div className="ticket-list__activity">
                                  <span>{ticket.activityLabel || ticket.updatedLabel}</span>
                                  <span>{ticket.commentsLabel || `${ticket.commentsCount} comentarios`}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="ticket-list__pagination" aria-label="Paginación de tickets">
                    <div className="ticket-list__pagination-meta">
                      <p className="ticket-list__pagination-summary">
                        Mostrando <strong>{pageStart + 1}</strong>-
                        <strong>{Math.min(pageStart + itemsPerPage, filteredTickets.length)}</strong> de{' '}
                        <strong>{filteredTickets.length}</strong>
                      </p>

                      <label className="ticket-list__page-size" htmlFor="tickets-page-size">
                        <span>Por página</span>
                        <select
                          id="tickets-page-size"
                          name="tickets_page_size"
                          value={itemsPerPage}
                          onChange={(event) => {
                            setItemsPerPage(Number(event.target.value));
                            setCurrentPage(1);
                          }}
                        >
                          {LIST_PAGE_SIZE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="ticket-list__pagination-actions">
                      <button
                        type="button"
                        className="ticket-list__pagination-button"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={resolvedCurrentPage === 1}
                      >
                        Anterior
                      </button>
                      <span className="ticket-list__pagination-page">
                        Página <strong>{resolvedCurrentPage}</strong> de <strong>{totalPages}</strong>
                      </span>
                      <button
                        type="button"
                        className="ticket-list__pagination-button"
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={resolvedCurrentPage === totalPages}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No encontramos tickets con estos filtros"
                  copy="Ajusta la búsqueda, el alcance o el tipo para recuperar resultados."
                  id="tickets-list-panel"
                  role="tabpanel"
                  ariaLabelledBy="tickets-view-tab-list"
                  hidden={activeView !== 'list'}
                >
                  <button type="button" className="tickets-empty-state__action" onClick={clearFilters}>
                    Limpiar filtros
                  </button>
                </EmptyState>
              )
            ) : (
              hasResults ? (
                <div
                  className="ticket-board-shell"
                  id="tickets-pipeline-panel"
                  role="tabpanel"
                  aria-labelledby="tickets-view-tab-pipeline"
                  aria-label="Pipeline de tickets"
                  aria-describedby="tickets-pipeline-help"
                  hidden={activeView !== 'pipeline'}
                >
                  <p id="tickets-pipeline-help" className="sr-only">
                    Arrastra un ticket al carril de destino para cambiar su estado, o ábrelo y actualízalo
                    desde el panel de detalle.
                  </p>
                  <div className="ticket-board">
                    {groupedTickets.map((lane) => {
                      const visibleCount = pipelineVisibleCounts[lane.key] ?? PIPELINE_VISIBLE_BATCH;
                      const visibleItems = lane.items.slice(0, visibleCount);
                      const remainingCount = Math.max(0, lane.items.length - visibleCount);

                      return (
                        <section
                          key={lane.key}
                          className={`ticket-board__lane ticket-board__lane--${lane.tone}`}
                          aria-labelledby={`lane-${lane.key}`}
                        >
                          <header className="ticket-board__lane-header">
                            <div>
                              <h2 id={`lane-${lane.key}`} className="ticket-board__lane-title">{lane.label}</h2>
                              <span className="ticket-board__lane-count">{lane.items.length}</span>
                            </div>
                          </header>

                          <div
                            className={`ticket-board__lane-body${dragOverLaneKey === lane.key ? ' ticket-board__lane-body--drag-over' : ''}`}
                            onDragOver={(event) => {
                              event.preventDefault();
                              if (dragOverLaneKey !== lane.key) {
                                setDragOverLaneKey(lane.key);
                              }
                            }}
                            onDragLeave={() => {
                              if (dragOverLaneKey === lane.key) {
                                setDragOverLaneKey('');
                              }
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              void handleDropOnLane(lane.key);
                            }}
                          >
                            {visibleItems.map((ticket) => {
                              const isSelected = selectedTicket?.id === ticket.id;

                              return (
                                <button
                                  key={ticket.id}
                                  type="button"
                                  className={`ticket-card${isSelected ? ' ticket-card--active' : ''}`}
                                  onClick={(event) => {
                                    openTicketDetail(ticket.id, event.currentTarget, {
                                      shouldAutoFocus: event.detail === 0
                                    });
                                  }}
                                  aria-label={`Ver detalle del ticket ${ticket.id}`}
                                  draggable
                                  onDragStart={(event) => {
                                    event.dataTransfer.effectAllowed = 'move';
                                    event.dataTransfer.setData('text/plain', String(ticket.ticketId));
                                    setDraggingTicketId(ticket.ticketId);
                                  }}
                                  onDragEnd={() => {
                                    setDraggingTicketId(null);
                                    setDragOverLaneKey('');
                                  }}
                                >
                                  <div className="ticket-card__header">
                                    <span className="ticket-card__id">{ticket.id}</span>
                                    <TicketBadge label={priorityMeta[ticket.priority].label} tone={priorityMeta[ticket.priority].tone} />
                                  </div>
                                  <p className="ticket-card__title">{ticket.title}</p>
                                  <div className="ticket-card__footer">
                                    <span>{ticket.requester}</span>
                                    <span>{ticket.dueLabel}</span>
                                  </div>
                                </button>
                              );
                            })}

                            {remainingCount > 0 ? (
                              <button
                                type="button"
                                className={`ticket-board__more ticket-board__more--${lane.tone}`}
                                aria-label={`Ver más tickets en ${lane.label}. Quedan ${remainingCount} por mostrar`}
                                onClick={() => {
                                  setPipelineVisibleCounts((currentCounts) => ({
                                    ...currentCounts,
                                    [lane.key]: currentCounts[lane.key] + PIPELINE_VISIBLE_BATCH
                                  }));
                                }}
                              >
                                Ver más ({remainingCount})
                              </button>
                            ) : null}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No encontramos tickets en este pipeline"
                  copy="Ajusta los filtros o cambia a vista lista para revisar más resultados."
                  id="tickets-pipeline-panel"
                  role="tabpanel"
                  ariaLabelledBy="tickets-view-tab-pipeline"
                  hidden={activeView !== 'pipeline'}
                >
                  <button type="button" className="tickets-empty-state__action" onClick={clearFilters}>
                    Limpiar filtros
                  </button>
                </EmptyState>
              )
            )}
          </div>

          {hasDetailPanel ? (
            <aside className="tickets-layout__detail" aria-label="Panel contextual de detalle">
              {shouldRenderDetail ? (
                <TicketDetailPanel
                  ticket={selectedTicket}
                  onClose={closeTicketDetail}
                  onEdit={handleOpenEditModal}
                  onChangeStatus={handleChangeStatusFromDetail}
                  onAddComment={handleAddCommentFromDetail}
                  isStatusSubmitting={isStatusSubmitting}
                  statusChangeError={statusChangeError}
                  isCommentSubmitting={isCommentSubmitting}
                  commentError={commentError}
                  onUploadAttachment={handleUploadAttachment}
                  isUploadingAttachment={isAttachmentUploading}
                  attachmentError={attachmentUploadError}
                  closeButtonRef={detailCloseButtonRef}
                />
              ) : (
                <TicketDetailContextState
                  reason={detailHiddenReason}
                  ticketId={selectedTicketId}
                  targetPage={selectedTicketTargetPage}
                  onGoToPage={() => {
                    if (selectedTicketTargetPage) {
                      setCurrentPage(selectedTicketTargetPage);
                    }
                  }}
                  onResetFilters={clearFilters}
                  onClose={closeTicketDetail}
                  closeButtonRef={detailCloseButtonRef}
                />
              )}
            </aside>
          ) : null}
        </div>
      </section>

      <AdvancedFiltersModal
        open={isAdvancedFiltersOpen}
        onClose={() => setIsAdvancedFiltersOpen(false)}
        draftFilters={advancedDraft}
        onDraftChange={(event) => {
          const { name, value } = event.target;
          setAdvancedDraft((currentFilters) => ({
            ...currentFilters,
            [name]: value
          }));
        }}
        onApply={handleApplyAdvancedFilters}
        onClear={handleClearAdvancedFilters}
        assigneeUsers={catalogAssigneeUsers}
        returnFocusRef={advancedFiltersTriggerRef}
      />

      <TicketEditorModal
        title="Nuevo ticket"
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTicket}
        formData={ticketForm}
        onFieldChange={handleTicketFormChange}
        requesterUsers={catalogRequesterUsers}
        assigneeUsers={catalogAssigneeUsers}
        submitLabel="Crear ticket"
        isSubmitting={isTicketFormSubmitting}
        submitError={ticketFormError}
        returnFocusRef={createTicketTriggerRef}
      />

      <TicketEditorModal
        title="Editar ticket"
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditTicket}
        formData={ticketForm}
        onFieldChange={handleTicketFormChange}
        requesterUsers={catalogRequesterUsers}
        assigneeUsers={catalogAssigneeUsers}
        submitLabel="Guardar cambios"
        isSubmitting={isTicketFormSubmitting}
        submitError={ticketFormError}
        returnFocusRef={editTicketTriggerRef}
      />

      {isStatusSubmitting && !actionToast ? (
        <div className="tickets-toast tickets-toast--info" role="status" aria-live="polite">
          <Info size={16} aria-hidden="true" className="tickets-toast__icon" />
          <span>Actualizando estado del ticket...</span>
        </div>
      ) : null}

      {actionToast ? (
        <div
          className={`tickets-toast tickets-toast--${actionToast.tone || 'info'}`}
          role={actionToast.tone === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {actionToast.tone === 'success' ? (
            <Check size={16} aria-hidden="true" className="tickets-toast__icon" />
          ) : actionToast.tone === 'error' ? (
            <AlertTriangle size={16} aria-hidden="true" className="tickets-toast__icon" />
          ) : (
            <Info size={16} aria-hidden="true" className="tickets-toast__icon" />
          )}
          <span className="tickets-toast__message">{actionToast.message}</span>
          <button
            type="button"
            className="tickets-toast__close"
            aria-label="Cerrar notificación"
            onClick={dismissToast}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default TicketsPage;
