import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { ticketAttachmentConstraints } from '../middleware/uploadMiddleware.js';
import { TicketModel } from '../models/TicketModel.js';
import { AuditService } from './auditService.js';

const ticketModel = new TicketModel(pool);

const statusMeta = Object.freeze({
  nuevo: { label: 'Nuevo', tone: 'info' },
  en_proceso: { label: 'En proceso', tone: 'primary' },
  en_espera: { label: 'En espera', tone: 'warning' },
  resuelto: { label: 'Resuelto', tone: 'success' },
  cerrado: { label: 'Cerrado', tone: 'neutral' }
});

const priorityMeta = Object.freeze({
  baja: { label: 'Baja', tone: 'neutral' },
  media: { label: 'Media', tone: 'info' },
  alta: { label: 'Alta', tone: 'warning' },
  critica: { label: 'Crítica', tone: 'danger' }
});

const typeMeta = Object.freeze({
  incidencia: { label: 'Incidencia', tone: 'danger' },
  solicitud: { label: 'Solicitud', tone: 'primary' }
});

const categoryMeta = Object.freeze({
  hardware_equipo: { label: 'Hardware y equipo' },
  software_aplicacion: { label: 'Software y aplicación' },
  red_conectividad: { label: 'Red y conectividad' },
  correo_colaboracion: { label: 'Correo y colaboración' },
  acceso_logico: { label: 'Acceso lógico' },
  acceso_fisico: { label: 'Acceso físico' },
  impresion_perifericos: { label: 'Impresión y periféricos' },
  telefonia_soporte: { label: 'Telefonía y soporte' },
  otro: { label: 'Otro' }
});

const channelCatalog = Object.freeze(['Portal', 'Captura interna']);
const channelAliasMap = Object.freeze({
  'Mesa de ayuda': 'Captura interna'
});
const ATTACHMENT_RELATIVE_DIR = 'tickets';

const normalizeText = (value) => String(value || '').trim();

const isPrimaryOperatorUser = (user) => {
  const normalizedName = normalizeText(user?.name).toLowerCase();
  const normalizedEmail = normalizeText(user?.email).toLowerCase();

  return (
    normalizedName === 'programador'
    || normalizedEmail === 'programador@linher.com.mx'
  );
};

const normalizeId = (value) => {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    return null;
  }

  return normalized;
};

const normalizeEnum = ({ value, catalog, label, required = true }) => {
  const normalized = normalizeText(value).toLowerCase();

  if (!normalized && !required) {
    return null;
  }

  if (!catalog.includes(normalized)) {
    throw new AppError(`El valor de ${label} no es válido.`, {
      statusCode: 400,
      code: 'INVALID_TICKET_FIELD',
      details: {
        field: label,
        value
      }
    });
  }

  return normalized;
};

const normalizeChannel = (value, { required = true } = {}) => {
  const normalizedRaw = normalizeText(value);
  if (!normalizedRaw && !required) {
    return null;
  }

  const normalized = channelAliasMap[normalizedRaw] || normalizedRaw;

  if (!channelCatalog.includes(normalized)) {
    throw new AppError('El canal del ticket no es válido.', {
      statusCode: 400,
      code: 'INVALID_TICKET_CHANNEL',
      details: {
        value
      }
    });
  }

  return normalized;
};

const normalizeChannelOutput = (value) => {
  const normalizedRaw = normalizeText(value);
  if (!normalizedRaw) {
    return 'Portal';
  }

  const normalized = channelAliasMap[normalizedRaw] || normalizedRaw;
  return channelCatalog.includes(normalized) ? normalized : 'Portal';
};

const normalizeAttachmentName = (value) => (
  String(value || 'adjunto')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 220) || 'adjunto'
);

const toPosixPath = (value) => String(value || '').replace(/\\/g, '/');

const toAttachmentPublicUrl = (storagePath) => {
  const normalizedPath = toPosixPath(storagePath).replace(/^\/+/, '');
  return normalizedPath ? `/uploads/${normalizedPath}` : null;
};

const toFileSizeLabel = (sizeBytes) => {
  const value = Number(sizeBytes);
  if (!Number.isFinite(value) || value <= 0) {
    return '0 KB';
  }

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(value / 1024))} KB`;
};

const safeUnlinkFile = async (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore cleanup errors.
  }
};

const normalizeDueAt = (value, { required = false } = {}) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    if (required) {
      throw new AppError('Debes indicar una fecha de vencimiento válida.', {
        statusCode: 400,
        code: 'INVALID_TICKET_DUE_AT'
      });
    }

    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    throw new AppError('El formato de vencimiento debe ser YYYY-MM-DDTHH:mm.', {
      statusCode: 400,
      code: 'INVALID_TICKET_DUE_AT'
    });
  }

  return `${normalized.replace('T', ' ')}:00`;
};

const normalizeTicketTitle = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    throw new AppError('Debes indicar el título del ticket.', {
      statusCode: 400,
      code: 'INVALID_TICKET_TITLE'
    });
  }

  if (normalized.length > 220) {
    throw new AppError('El título del ticket no puede superar 220 caracteres.', {
      statusCode: 400,
      code: 'INVALID_TICKET_TITLE_LENGTH'
    });
  }

  return normalized;
};

const normalizeTicketSummary = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    throw new AppError('Debes indicar el resumen del ticket.', {
      statusCode: 400,
      code: 'INVALID_TICKET_SUMMARY'
    });
  }

  return normalized;
};

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatRelativeLabel = (dateValue) => {
  const date = normalizeDate(dateValue);
  if (!date) {
    return 'Sin actividad';
  }

  const now = new Date();
  const diffMinutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));

  if (diffMinutes < 60) {
    return `Hace ${Math.max(1, diffMinutes)} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Hace ${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return 'Ayer';
  }

  return `Hace ${diffDays} d`;
};

const formatDateTimeShort = (dateValue) => {
  const date = normalizeDate(dateValue);
  if (!date) {
    return null;
  }

  const day = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    timeZone: 'America/Mexico_City'
  }).format(date).replace('.', '');

  const time = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Mexico_City'
  }).format(date);

  return `${day} · ${time}`;
};

const formatEventTime = (dateValue = new Date()) => (
  new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Mexico_City'
  }).format(normalizeDate(dateValue) || new Date())
);

const formatCommentsLabel = (value) => {
  const total = Number(value || 0);
  return `${total} ${total === 1 ? 'comentario' : 'comentarios'}`;
};

const normalizeCommentText = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    throw new AppError('Debes escribir un comentario.', {
      statusCode: 400,
      code: 'INVALID_TICKET_COMMENT'
    });
  }

  if (normalized.length > 1800) {
    throw new AppError('El comentario no puede superar 1800 caracteres.', {
      statusCode: 400,
      code: 'INVALID_TICKET_COMMENT_LENGTH'
    });
  }

  return normalized;
};

const formatDueLabel = ({ status, dueAt }) => {
  if (status === 'resuelto') {
    return 'Resuelto';
  }

  if (status === 'cerrado') {
    return 'Cerrado';
  }

  const dueDate = normalizeDate(dueAt);
  if (!dueDate) {
    return 'Sin fecha';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const dueTime = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Mexico_City'
  }).format(dueDate);

  if (dueDay.getTime() === today.getTime()) {
    return `Hoy · ${dueTime}`;
  }

  if (dueDay.getTime() === tomorrow.getTime()) {
    return `Mañana · ${dueTime}`;
  }

  return formatDateTimeShort(dueDate);
};

const buildTicketActivity = (row) => {
  const events = (row.events || []).map((eventRow) => ({
    id: `ev-${eventRow.id}`,
    title: eventRow.event_title,
    meta: eventRow.event_meta,
    createdAt: normalizeDate(eventRow.created_at)
  }));

  const comments = (row.comments || []).map((commentRow) => ({
    id: `cm-${commentRow.id}`,
    title: commentRow.comment_text,
    meta: `${commentRow.author_name || 'Sistema'} · ${formatEventTime(commentRow.created_at)}`,
    createdAt: normalizeDate(commentRow.created_at),
    kind: 'comment'
  }));

  return [...events, ...comments]
    .sort((leftItem, rightItem) => {
      const leftTime = leftItem.createdAt?.getTime?.() || 0;
      const rightTime = rightItem.createdAt?.getTime?.() || 0;
      return rightTime - leftTime;
    })
    .slice(0, 12)
    .map(({ createdAt, ...item }) => item);
};

const toTicketResponse = (row) => ({
  ticketId: Number(row.id),
  id: row.folio,
  title: row.title,
  summary: row.summary,
  status: row.status,
  priority: row.priority,
  type: row.ticket_type,
  category: row.category_key,
  requesterUserId: Number(row.requester_user_id),
  requester: row.requester_name,
  requesterPhoto: row.requester_photo_path || null,
  area: row.requester_area,
  assigneeUserId: row.assignee_user_id ? Number(row.assignee_user_id) : null,
  assignee: row.assignee_name || 'Sin asignar',
  dueAt: row.due_at,
  dueLabel: formatDueLabel({ status: row.status, dueAt: row.due_at }),
  createdLabel: formatDateTimeShort(row.created_at),
  updatedLabel: formatRelativeLabel(row.last_activity_at || row.updated_at),
  activityLabel: formatRelativeLabel(row.last_activity_at || row.updated_at),
  commentsCount: Number(row.comments_count || 0),
  commentsLabel: formatCommentsLabel(row.comments_count),
  attachmentsCount: Number(row.attachments_count || 0),
  channel: normalizeChannelOutput(row.channel),
  comments: (row.comments || []).map((commentRow) => ({
    id: Number(commentRow.id),
    ticketId: Number(commentRow.ticket_id),
    authorUserId: commentRow.author_user_id ? Number(commentRow.author_user_id) : null,
    authorName: commentRow.author_name || 'Sistema',
    text: commentRow.comment_text,
    createdAt: commentRow.created_at,
    createdLabel: formatDateTimeShort(commentRow.created_at)
  })),
  attachments: (row.attachments || []).map((attachmentRow) => ({
    id: Number(attachmentRow.id),
    name: attachmentRow.file_name,
    size: attachmentRow.file_size_label,
    sizeBytes: Number(attachmentRow.file_size_bytes || 0),
    mimeType: attachmentRow.file_mime_type || null,
    url: toAttachmentPublicUrl(attachmentRow.file_storage_path)
  })),
  activity: buildTicketActivity(row)
});

const buildPeriodKey = (date = new Date()) => {
  const month = new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    timeZone: 'America/Mexico_City'
  }).format(date);

  const year = new Intl.DateTimeFormat('en-US', {
    year: '2-digit',
    timeZone: 'America/Mexico_City'
  }).format(date);

  return `${month}${year}`;
};

const buildFolio = (periodKey, sequenceNumber) => {
  if (!Number.isInteger(sequenceNumber) || sequenceNumber <= 0 || sequenceNumber > 999) {
    throw new AppError('No fue posible generar el folio del ticket para este periodo.', {
      statusCode: 409,
      code: 'TICKET_FOLIO_SEQUENCE_EXHAUSTED',
      details: {
        period: periodKey
      }
    });
  }

  return `TK-${periodKey}${String(sequenceNumber).padStart(3, '0')}`;
};

const resolveActorName = (authUser) => normalizeText(authUser?.name) || 'Sistema';

const statusChangeTitles = Object.freeze({
  nuevo: 'Ticket movido a Nuevo',
  en_proceso: 'Ticket movido a En proceso',
  en_espera: 'Ticket movido a En espera',
  resuelto: 'Ticket marcado como Resuelto',
  cerrado: 'Ticket marcado como Cerrado'
});

const overdueEventTitle = 'Ticket vencido';

const syncOverdueTicketEvents = async () => {
  await ticketModel.registerMissingOverdueEvents(pool, {
    eventTitle: overdueEventTitle,
    eventMeta: `Sistema · ${formatEventTime(new Date())}`
  });
};

const getTicketOrThrow = async (ticketId) => {
  const normalizedTicketId = normalizeId(ticketId);
  if (!normalizedTicketId) {
    throw new AppError('El identificador del ticket no es válido.', {
      statusCode: 400,
      code: 'INVALID_TICKET_ID'
    });
  }

  const ticket = await ticketModel.getTicketById(normalizedTicketId);
  if (!ticket) {
    throw new AppError('El ticket solicitado no existe.', {
      statusCode: 404,
      code: 'TICKET_NOT_FOUND'
    });
  }

  return {
    normalizedTicketId,
    ticket
  };
};

export const TicketService = {
  getMap() {
    return {
      purpose: 'Gestionar solicitudes e incidencias operativas de Sistemas con trazabilidad completa.',
      problem: 'Centralizar soporte con estados, responsables, actividad y evidencia adjunta.',
      root_entity: 'tickets',
      lifecycle: ['nuevo', 'en_proceso', 'en_espera', 'resuelto', 'cerrado'],
      main_flow: ['create_ticket', 'triage_ticket', 'assign_ticket', 'resolve_ticket', 'close_ticket'],
      critical_actions: ['view', 'create', 'update', 'change_status', 'track_activity', 'attach_evidence'],
      relationships: [
        'tickets -> users',
        'tickets -> ticket_events',
        'tickets -> ticket_attachments',
        'tickets -> ticket_comments'
      ],
      traceability: ['ticket_created', 'ticket_updated', 'ticket_status_changed', 'ticket_overdue']
    };
  },

  async listTickets() {
    await syncOverdueTicketEvents();
    const rows = await ticketModel.listTickets();
    return rows.map(toTicketResponse);
  },

  async getCatalog() {
    const [requesters, assignableUsers] = await Promise.all([
      ticketModel.listActiveUsers(),
      ticketModel.listAssignableUsers()
    ]);

    const fallbackAssignees = requesters.filter((user) => isPrimaryOperatorUser(user));

    const assignees = assignableUsers.length > 0
      ? assignableUsers
      : fallbackAssignees;

    return {
      statuses: Object.entries(statusMeta).map(([key, value]) => ({ key, ...value })),
      priorities: Object.entries(priorityMeta).map(([key, value]) => ({ key, ...value })),
      types: Object.entries(typeMeta).map(([key, value]) => ({ key, ...value })),
      categories: Object.entries(categoryMeta).map(([key, value]) => ({ key, ...value })),
      channels: channelCatalog.map((channel) => ({ key: channel, label: channel })),
      attachment_policy: {
        max_file_size_bytes: ticketAttachmentConstraints.max_file_size_bytes,
        allowed_mime_types: ticketAttachmentConstraints.allowed_mime_types
      },
      requester_users: requesters,
      assignee_users: assignees,
      users: assignees
    };
  },

  async createTicket({
    payload,
    authUser = null,
    requestContext = {}
  }) {
    const title = normalizeTicketTitle(payload?.title);
    const summary = normalizeTicketSummary(payload?.summary);
    const priority = normalizeEnum({
      value: payload?.priority || 'media',
      catalog: Object.keys(priorityMeta),
      label: 'prioridad'
    });
    const ticketType = normalizeEnum({
      value: payload?.type || 'solicitud',
      catalog: Object.keys(typeMeta),
      label: 'tipo'
    });
    const categoryKey = normalizeEnum({
      value: payload?.category || 'otro',
      catalog: Object.keys(categoryMeta),
      label: 'categoría'
    });
    const channel = normalizeChannel(payload?.channel || 'Portal');
    const dueAt = normalizeDueAt(payload?.due_at, { required: false });
    const requesterUserId = normalizeId(payload?.requester_user_id);
    const assigneeUserId = normalizeId(payload?.assignee_user_id);

    if (!requesterUserId) {
      throw new AppError('Debes indicar un solicitante válido.', {
        statusCode: 400,
        code: 'INVALID_REQUESTER_USER'
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const requester = await ticketModel.findUserSnapshot(connection, requesterUserId);
      if (!requester) {
        throw new AppError('El solicitante indicado no existe o no está activo.', {
          statusCode: 404,
          code: 'REQUESTER_NOT_FOUND'
        });
      }

      const assignee = assigneeUserId
        ? await ticketModel.findUserSnapshot(connection, assigneeUserId)
        : null;

      if (assigneeUserId && !assignee) {
        throw new AppError('El responsable indicado no existe o no está activo.', {
          statusCode: 404,
          code: 'ASSIGNEE_NOT_FOUND'
        });
      }

      if (assigneeUserId) {
        const canAssignTickets = await ticketModel.hasTicketAssignPermission(connection, assigneeUserId);
        if (!canAssignTickets) {
          throw new AppError('El responsable indicado no tiene permisos para gestionar tickets.', {
            statusCode: 400,
            code: 'ASSIGNEE_NOT_AUTHORIZED'
          });
        }
      }

      const periodKey = buildPeriodKey(new Date());
      const sequenceNumber = await ticketModel.lockAndGetNextFolioNumber(connection, periodKey);
      const folio = buildFolio(periodKey, sequenceNumber);

      const ticketId = await ticketModel.createTicket(connection, {
        folio,
        title,
        summary,
        status: 'nuevo',
        priority,
        ticketType,
        categoryKey,
        requesterUserId: requester.id,
        requesterName: requester.name,
        requesterArea: requester.area_name,
        assigneeUserId: assignee?.id || null,
        assigneeName: assignee?.name || null,
        dueAt,
        channel
      });

      const actorName = resolveActorName(authUser);

      await ticketModel.createTicketEvent(connection, {
        ticketId,
        eventTitle: 'Ticket creado desde portal interno',
        eventMeta: `${actorName} · ${formatEventTime(new Date())}`
      });

      if (assignee?.name) {
        await ticketModel.createTicketEvent(connection, {
          ticketId,
          eventTitle: 'Ticket asignado',
          eventMeta: `${assignee.name} · ${formatEventTime(new Date())}`
        });
      }

      await connection.commit();

      const createdTicket = await ticketModel.getTicketById(ticketId);
      const responsePayload = toTicketResponse(createdTicket);

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'tickets.create',
        entityType: 'tickets',
        entityId: ticketId,
        beforeSnapshot: null,
        afterSnapshot: responsePayload,
        details: {
          event_key: 'ticket_created'
        },
        requestContext
      });

      return responsePayload;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateTicket({
    ticketId,
    payload,
    authUser = null,
    requestContext = {}
  }) {
    const { normalizedTicketId, ticket: currentTicket } = await getTicketOrThrow(ticketId);

    const updates = {};

    if (payload?.title !== undefined) {
      updates.title = normalizeTicketTitle(payload.title);
    }

    if (payload?.summary !== undefined) {
      updates.summary = normalizeTicketSummary(payload.summary);
    }

    if (payload?.priority !== undefined) {
      updates.priority = normalizeEnum({
        value: payload.priority,
        catalog: Object.keys(priorityMeta),
        label: 'prioridad'
      });
    }

    if (payload?.type !== undefined) {
      updates.ticket_type = normalizeEnum({
        value: payload.type,
        catalog: Object.keys(typeMeta),
        label: 'tipo'
      });
    }

    if (payload?.category !== undefined) {
      updates.category_key = normalizeEnum({
        value: payload.category,
        catalog: Object.keys(categoryMeta),
        label: 'categoría'
      });
    }

    if (payload?.channel !== undefined) {
      updates.channel = normalizeChannel(payload.channel);
    }

    if (payload?.due_at !== undefined) {
      updates.due_at = normalizeDueAt(payload.due_at, { required: false });
    }

    const nextRequesterUserId = normalizeId(payload?.requester_user_id);
    if (payload?.requester_user_id !== undefined) {
      if (!nextRequesterUserId) {
        throw new AppError('Debes indicar un solicitante válido.', {
          statusCode: 400,
          code: 'INVALID_REQUESTER_USER'
        });
      }

      const requester = await ticketModel.findUserSnapshot(pool, nextRequesterUserId);
      if (!requester) {
        throw new AppError('El solicitante indicado no existe o no está activo.', {
          statusCode: 404,
          code: 'REQUESTER_NOT_FOUND'
        });
      }

      updates.requester_user_id = requester.id;
      updates.requester_name = requester.name;
      updates.requester_area = requester.area_name;
    }

    if (payload?.assignee_user_id !== undefined) {
      const nextAssigneeUserId = normalizeId(payload.assignee_user_id);

      if (!nextAssigneeUserId) {
        updates.assignee_user_id = null;
        updates.assignee_name = null;
      } else {
        const assignee = await ticketModel.findUserSnapshot(pool, nextAssigneeUserId);
        if (!assignee) {
          throw new AppError('El responsable indicado no existe o no está activo.', {
            statusCode: 404,
            code: 'ASSIGNEE_NOT_FOUND'
          });
        }

        const canAssignTickets = await ticketModel.hasTicketAssignPermission(pool, nextAssigneeUserId);
        if (!canAssignTickets) {
          throw new AppError('El responsable indicado no tiene permisos para gestionar tickets.', {
            statusCode: 400,
            code: 'ASSIGNEE_NOT_AUTHORIZED'
          });
        }

        updates.assignee_user_id = assignee.id;
        updates.assignee_name = assignee.name;
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError('No hay cambios para guardar en el ticket.', {
        statusCode: 400,
        code: 'EMPTY_TICKET_UPDATE'
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const wasUpdated = await ticketModel.updateTicket(connection, {
        ticketId: normalizedTicketId,
        updates
      });

      if (!wasUpdated) {
        throw new AppError('No fue posible actualizar el ticket.', {
          statusCode: 409,
          code: 'TICKET_NOT_UPDATED'
        });
      }

      const actorName = resolveActorName(authUser);
      await ticketModel.createTicketEvent(connection, {
        ticketId: normalizedTicketId,
        eventTitle: 'Ticket actualizado',
        eventMeta: `${actorName} · ${formatEventTime(new Date())}`
      });

      await connection.commit();

      const updatedTicket = await ticketModel.getTicketById(normalizedTicketId);
      const responsePayload = toTicketResponse(updatedTicket);

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'tickets.update',
        entityType: 'tickets',
        entityId: normalizedTicketId,
        beforeSnapshot: toTicketResponse(currentTicket),
        afterSnapshot: responsePayload,
        details: {
          changed_fields: Object.keys(updates),
          event_key: 'ticket_updated'
        },
        requestContext
      });

      return responsePayload;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateTicketStatus({
    ticketId,
    status,
    authUser = null,
    requestContext = {}
  }) {
    const normalizedStatus = normalizeEnum({
      value: status,
      catalog: Object.keys(statusMeta),
      label: 'estado'
    });

    const { normalizedTicketId, ticket: currentTicket } = await getTicketOrThrow(ticketId);
    const currentStatus = currentTicket.status;

    if (currentStatus === normalizedStatus) {
      return toTicketResponse(currentTicket);
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const wasUpdated = await ticketModel.updateTicketStatus(connection, {
        ticketId: normalizedTicketId,
        status: normalizedStatus
      });

      if (!wasUpdated) {
        throw new AppError('No fue posible mover el ticket al nuevo estado.', {
          statusCode: 409,
          code: 'TICKET_STATUS_NOT_UPDATED'
        });
      }

      const actorName = resolveActorName(authUser);
      await ticketModel.createTicketEvent(connection, {
        ticketId: normalizedTicketId,
        eventTitle: statusChangeTitles[normalizedStatus] || 'Estado del ticket actualizado',
        eventMeta: `${actorName} · ${formatEventTime(new Date())}`
      });

      await connection.commit();

      const updatedTicket = await ticketModel.getTicketById(normalizedTicketId);
      const responsePayload = toTicketResponse(updatedTicket);

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'tickets.update_status',
        entityType: 'tickets',
        entityId: normalizedTicketId,
        beforeSnapshot: {
          status: currentStatus
        },
        afterSnapshot: {
          status: normalizedStatus
        },
        details: {
          event_key: 'ticket_updated'
        },
        requestContext
      });

      return responsePayload;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async addComment({
    ticketId,
    payload,
    authUser = null,
    requestContext = {}
  }) {
    const commentText = normalizeCommentText(payload?.comment_text);
    const { normalizedTicketId, ticket: currentTicket } = await getTicketOrThrow(ticketId);

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await ticketModel.createTicketComment(connection, {
        ticketId: normalizedTicketId,
        authorUserId: authUser?.id || null,
        commentText
      });

      const actorName = resolveActorName(authUser);
      await ticketModel.createTicketEvent(connection, {
        ticketId: normalizedTicketId,
        eventTitle: 'Comentario agregado',
        eventMeta: `${actorName} · ${formatEventTime(new Date())}`
      });

      await connection.commit();

      const updatedTicket = await ticketModel.getTicketById(normalizedTicketId);
      const responsePayload = toTicketResponse(updatedTicket);

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'tickets.add_comment',
        entityType: 'tickets',
        entityId: normalizedTicketId,
        beforeSnapshot: toTicketResponse(currentTicket),
        afterSnapshot: responsePayload,
        details: {
          event_key: 'ticket_updated',
          comment_length: commentText.length
        },
        requestContext
      });

      return responsePayload;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async addAttachment({
    ticketId,
    file,
    authUser = null,
    requestContext = {}
  }) {
    if (!file) {
      throw new AppError('Debes seleccionar un archivo para adjuntar.', {
        statusCode: 400,
        code: 'ATTACHMENT_REQUIRED'
      });
    }

    const absoluteFilePath = file.path;
    const attachmentName = normalizeAttachmentName(file.originalname || file.filename);
    const attachmentMimeType = normalizeText(file.mimetype).toLowerCase();
    const attachmentSizeBytes = Number(file.size || 0);
    const attachmentSizeLabel = toFileSizeLabel(attachmentSizeBytes);
    const attachmentFileName = path.basename(file.filename || file.originalname || 'adjunto');
    const attachmentStoragePath = toPosixPath(path.posix.join(ATTACHMENT_RELATIVE_DIR, attachmentFileName));

    if (!attachmentMimeType) {
      await safeUnlinkFile(absoluteFilePath);
      throw new AppError('No fue posible identificar el tipo del archivo adjunto.', {
        statusCode: 400,
        code: 'INVALID_ATTACHMENT_TYPE'
      });
    }

    if (
      !Number.isFinite(attachmentSizeBytes) ||
      attachmentSizeBytes <= 0 ||
      attachmentSizeBytes > ticketAttachmentConstraints.max_file_size_bytes
    ) {
      await safeUnlinkFile(absoluteFilePath);
      throw new AppError('El archivo adjunto no es válido o excede el límite permitido.', {
        statusCode: 400,
        code: 'INVALID_ATTACHMENT_SIZE'
      });
    }

    const { normalizedTicketId, ticket: currentTicket } = await getTicketOrThrow(ticketId).catch(async (error) => {
      await safeUnlinkFile(absoluteFilePath);
      throw error;
    });

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await ticketModel.createTicketAttachment(connection, {
        ticketId: normalizedTicketId,
        fileName: attachmentName,
        fileStoragePath: attachmentStoragePath,
        fileMimeType: attachmentMimeType,
        fileSizeBytes: attachmentSizeBytes,
        fileSizeLabel: attachmentSizeLabel
      });

      const actorName = resolveActorName(authUser);
      await ticketModel.createTicketEvent(connection, {
        ticketId: normalizedTicketId,
        eventTitle: 'Se agregó un adjunto',
        eventMeta: `${actorName} · ${formatEventTime(new Date())}`
      });

      await connection.commit();

      const updatedTicket = await ticketModel.getTicketById(normalizedTicketId);
      const responsePayload = toTicketResponse(updatedTicket);

      await AuditService.record({
        operatorId: authUser?.id || null,
        action: 'tickets.add_attachment',
        entityType: 'tickets',
        entityId: normalizedTicketId,
        beforeSnapshot: toTicketResponse(currentTicket),
        afterSnapshot: responsePayload,
        details: {
          event_key: 'ticket_updated',
          file_name: attachmentName,
          file_size_bytes: attachmentSizeBytes
        },
        requestContext
      });

      return responsePayload;
    } catch (error) {
      await connection.rollback();
      await safeUnlinkFile(absoluteFilePath);
      throw error;
    } finally {
      connection.release();
    }
  }
};
