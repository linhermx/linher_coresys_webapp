import { getPool } from "../config/database.js";
import { ticketModel } from "../models/ticketModel.js";
import { buildAuditLogDraft, recordAuditLog } from "./auditService.js";

const OPEN_STATUS_ID = 1;
const ACTIVE_STATUS_IDS = [1, 2, 3];
const PRIORITY_ORDER_CASE = `
  CASE t.ticket_priority_id
    WHEN 4 THEN 1
    WHEN 3 THEN 2
    WHEN 2 THEN 3
    ELSE 4
  END
`;

const mapTicketRow = (row) => ({
  id: row.id,
  folio: row.folio,
  title: row.title,
  description: row.description,
  requesterName: row.requester_name,
  requesterEmail: row.requester_email,
  requesterArea: row.requester_area,
  dueAt: row.due_at,
  resolvedAt: row.resolved_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  status: {
    id: row.status_id,
    name: row.status_name,
  },
  priority: {
    id: row.priority_id,
    name: row.priority_name,
  },
  category: row.category_id
    ? {
        id: row.category_id,
        name: row.category_name,
      }
    : null,
  assignee: row.assignee_user_id
    ? {
        id: row.assignee_user_id,
        name: row.assignee_name,
      }
    : null,
});

const listCatalog = async (tableName) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `
      SELECT id, name, description, created_at
      FROM ${tableName}
      ORDER BY id ASC
    `,
  );

  return rows;
};

const createTicketEvent = async ({ ticketId, actorUserId, eventType, message }) => {
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO ticket_events (ticket_id, actor_user_id, event_type, message)
      VALUES (?, ?, ?, ?)
    `,
    [ticketId, actorUserId, eventType, message],
  );
};

const normalizeDueAt = (value) => {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return null;
  }

  return rawValue.includes("T") ? `${rawValue.replace("T", " ")}:00` : rawValue;
};

export const getTicketModuleBlueprint = () => ({
  model: ticketModel,
  queueStrategy: "status-priority-sla",
  workflows: ["Nuevo", "En curso", "En espera", "Resuelto", "Cerrado"],
});

export const listTicketCatalogs = async () => {
  const [statuses, priorities, categories, assignees] = await Promise.all([
    listCatalog("ticket_statuses"),
    listCatalog("ticket_priorities"),
    listCatalog("ticket_categories"),
    (async () => {
      const pool = getPool();
      const [rows] = await pool.query(
        `
          SELECT id, name, email
          FROM users
          WHERE status = 'active'
          ORDER BY name ASC
        `,
      );

      return rows;
    })(),
  ]);

  return {
    statuses,
    priorities,
    categories,
    assignees,
  };
};

export const listTickets = async ({
  search = "",
  statusId = "",
  priorityId = "",
} = {}) => {
  const pool = getPool();
  let query = `
    SELECT
      t.id,
      t.folio,
      t.title,
      t.description,
      t.requester_name,
      t.requester_email,
      t.requester_area,
      t.due_at,
      t.resolved_at,
      t.created_at,
      t.updated_at,
      ts.id AS status_id,
      ts.name AS status_name,
      tp.id AS priority_id,
      tp.name AS priority_name,
      tc.id AS category_id,
      tc.name AS category_name,
      u.id AS assignee_user_id,
      u.name AS assignee_name
    FROM tickets t
    JOIN ticket_statuses ts ON ts.id = t.ticket_status_id
    JOIN ticket_priorities tp ON tp.id = t.ticket_priority_id
    LEFT JOIN ticket_categories tc ON tc.id = t.ticket_category_id
    LEFT JOIN users u ON u.id = t.assignee_user_id
    WHERE 1 = 1
  `;

  const params = [];
  const trimmedSearch = String(search ?? "").trim();

  if (trimmedSearch) {
    query += `
      AND (
        t.folio LIKE ?
        OR t.title LIKE ?
        OR t.requester_name LIKE ?
      )
    `;
    params.push(
      `%${trimmedSearch}%`,
      `%${trimmedSearch}%`,
      `%${trimmedSearch}%`,
    );
  }

  if (Number(statusId)) {
    query += " AND t.ticket_status_id = ?";
    params.push(Number(statusId));
  }

  if (Number(priorityId)) {
    query += " AND t.ticket_priority_id = ?";
    params.push(Number(priorityId));
  }

  query += `
    ORDER BY
      ${PRIORITY_ORDER_CASE},
      CASE WHEN t.due_at IS NULL THEN 1 ELSE 0 END,
      t.due_at ASC,
      t.created_at DESC
  `;

  const [rows] = await pool.query(query, params);
  return rows.map(mapTicketRow);
};

export const getTicketSummary = async () => {
  const pool = getPool();
  const [summaryRows] = await pool.query(
    `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN ticket_status_id IN (1, 2, 3) THEN 1 ELSE 0 END) AS open_count,
        SUM(CASE WHEN ticket_priority_id = 4 AND ticket_status_id IN (1, 2, 3) THEN 1 ELSE 0 END) AS critical_count,
        SUM(CASE WHEN assignee_user_id IS NULL AND ticket_status_id IN (1, 2, 3) THEN 1 ELSE 0 END) AS unassigned_count,
        SUM(CASE WHEN due_at IS NOT NULL AND DATE(due_at) = CURRENT_DATE() AND ticket_status_id IN (1, 2, 3) THEN 1 ELSE 0 END) AS due_today_count
      FROM tickets
    `,
  );

  const [statusRows] = await pool.query(
    `
      SELECT
        ts.id,
        ts.name,
        COUNT(t.id) AS total
      FROM ticket_statuses ts
      LEFT JOIN tickets t ON t.ticket_status_id = ts.id
      GROUP BY ts.id, ts.name
      ORDER BY ts.id ASC
    `,
  );

  const [upcomingRows] = await pool.query(
    `
      SELECT
        t.id,
        t.folio,
        t.title,
        t.requester_name,
        t.due_at,
        tp.name AS priority_name
      FROM tickets t
      JOIN ticket_priorities tp ON tp.id = t.ticket_priority_id
      WHERE t.ticket_status_id IN (1, 2, 3) AND t.due_at IS NOT NULL
      ORDER BY t.due_at ASC, ${PRIORITY_ORDER_CASE}
      LIMIT 5
    `,
  );

  const summary = summaryRows[0] ?? {};

  return {
    total: Number(summary.total ?? 0),
    open: Number(summary.open_count ?? 0),
    critical: Number(summary.critical_count ?? 0),
    unassigned: Number(summary.unassigned_count ?? 0),
    dueToday: Number(summary.due_today_count ?? 0),
    byStatus: statusRows.map((row) => ({
      id: row.id,
      name: row.name,
      total: Number(row.total ?? 0),
    })),
    upcoming: upcomingRows.map((row) => ({
      id: row.id,
      folio: row.folio,
      title: row.title,
      requesterName: row.requester_name,
      dueAt: row.due_at,
      priorityName: row.priority_name,
    })),
  };
};

export const createTicket = async ({
  title,
  description = "",
  requesterName,
  requesterEmail = "",
  requesterArea = "",
  priorityId,
  categoryId = null,
  assigneeUserId = null,
  dueAt = null,
  authUser = null,
  requestContext = {},
}) => {
  if (!String(title ?? "").trim()) {
    const error = new Error("El titulo es obligatorio.");
    error.code = "ticket_title_required";
    error.statusCode = 400;
    throw error;
  }

  if (!String(requesterName ?? "").trim()) {
    const error = new Error("El solicitante es obligatorio.");
    error.code = "ticket_requester_required";
    error.statusCode = 400;
    throw error;
  }

  if (!Number(priorityId)) {
    const error = new Error("La prioridad es obligatoria.");
    error.code = "ticket_priority_required";
    error.statusCode = 400;
    throw error;
  }

  const pool = getPool();
  const [result] = await pool.query(
    `
      INSERT INTO tickets (
        folio,
        title,
        description,
        ticket_status_id,
        ticket_priority_id,
        ticket_category_id,
        requester_name,
        requester_email,
        requester_area,
        assignee_user_id,
        created_by,
        due_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      null,
      String(title).trim(),
      String(description ?? "").trim() || null,
      OPEN_STATUS_ID,
      Number(priorityId),
      Number(categoryId) || null,
      String(requesterName).trim(),
      String(requesterEmail ?? "").trim() || null,
      String(requesterArea ?? "").trim() || null,
      Number(assigneeUserId) || null,
      authUser?.id ?? null,
      normalizeDueAt(dueAt),
    ],
  );

  const ticketId = Number(result.insertId);
  const folio = `TIC-${String(ticketId).padStart(6, "0")}`;

  await pool.query("UPDATE tickets SET folio = ? WHERE id = ?", [folio, ticketId]);

  await createTicketEvent({
    ticketId,
    actorUserId: authUser?.id ?? null,
    eventType: "created",
    message: "Ticket registrado.",
  });

  await recordAuditLog(
    buildAuditLogDraft({
      action: "tickets.create",
      operatorId: authUser?.id ?? null,
      operatorRole: authUser?.role_name ?? null,
      entityName: "tickets",
      entityId: ticketId,
      afterSnapshot: {
        folio,
        title: String(title).trim(),
        requester_name: String(requesterName).trim(),
      },
      requestContext,
    }),
  );

  const items = await listTickets();
  return items.find((item) => item.id === ticketId) ?? null;
};
