import { BaseModel } from './BaseModel.js';

const ALLOWED_TICKET_COLUMNS = new Set([
  'title',
  'summary',
  'priority',
  'ticket_type',
  'category_key',
  'requester_user_id',
  'requester_name',
  'requester_area',
  'assignee_user_id',
  'assignee_name',
  'due_at',
  'channel'
]);

const mapUserSnapshot = (row) => ({
  id: Number(row.id),
  name: row.name,
  email: row.email || null,
  area_name: row.area_name,
  photo_path: row.photo_path || null
});

const ticketAssignPermissionWhereClause = `
  p.deleted_at IS NULL
  AND (
    p.permission_key = 'tickets.assign'
    OR (p.module_key = 'tickets' AND p.action_key = 'assign')
    OR p.permission_key = 'assign'
    OR (p.module_key = 'global' AND p.action_key = 'assign')
  )
`;

const appendTicketRelations = async (db, ticketRows) => {
  if (ticketRows.length === 0) {
    return [];
  }

  const ticketIds = ticketRows.map((row) => Number(row.id));

  const [eventRows] = await db.query(`
    SELECT
      id,
      ticket_id,
      event_title,
      event_meta,
      created_at
    FROM ticket_events
    WHERE ticket_id IN (?)
    ORDER BY created_at DESC, id DESC
  `, [ticketIds]);

  const [attachmentRows] = await db.query(`
    SELECT
      id,
      ticket_id,
      file_name,
      file_storage_path,
      file_mime_type,
      file_size_bytes,
      file_size_label,
      created_at
    FROM ticket_attachments
    WHERE ticket_id IN (?)
    ORDER BY created_at DESC, id DESC
  `, [ticketIds]);

  const [commentRows] = await db.query(`
    SELECT
      c.id,
      c.ticket_id,
      c.author_user_id,
      COALESCE(u.name, 'Sistema') AS author_name,
      c.comment_text,
      c.created_at
    FROM ticket_comments c
    LEFT JOIN users u
      ON u.id = c.author_user_id
    WHERE c.ticket_id IN (?)
      AND c.deleted_at IS NULL
    ORDER BY c.created_at DESC, c.id DESC
  `, [ticketIds]);

  return ticketRows.map((ticketRow) => ({
    ...ticketRow,
    events: eventRows.filter((eventRow) => Number(eventRow.ticket_id) === Number(ticketRow.id)),
    attachments: attachmentRows.filter((attachmentRow) => Number(attachmentRow.ticket_id) === Number(ticketRow.id)),
    comments: commentRows.filter((commentRow) => Number(commentRow.ticket_id) === Number(ticketRow.id))
  }));
};

const toTicketBaseSelect = () => `
  SELECT
    t.id,
    t.folio,
    t.title,
    t.summary,
    t.status,
    t.priority,
    t.ticket_type,
    t.category_key,
    t.requester_user_id,
    t.requester_name,
    t.requester_area,
    ru.photo_path AS requester_photo_path,
    t.assignee_user_id,
    t.assignee_name,
    t.due_at,
    t.channel,
    t.created_at,
    t.updated_at,
    COALESCE(tc.comments_count, 0) AS comments_count,
    COALESCE(ta.attachments_count, 0) AS attachments_count,
    GREATEST(
      COALESCE(t.updated_at, '1970-01-01 00:00:00'),
      COALESCE(tc.last_comment_at, '1970-01-01 00:00:00'),
      COALESCE(te.last_event_at, '1970-01-01 00:00:00'),
      COALESCE(ta.last_attachment_at, '1970-01-01 00:00:00')
    ) AS last_activity_at
  FROM tickets t
  LEFT JOIN (
    SELECT
      ticket_id,
      COUNT(*) AS comments_count,
      MAX(created_at) AS last_comment_at
    FROM ticket_comments
    WHERE deleted_at IS NULL
    GROUP BY ticket_id
  ) tc
    ON tc.ticket_id = t.id
  LEFT JOIN (
    SELECT
      ticket_id,
      MAX(created_at) AS last_event_at
    FROM ticket_events
    GROUP BY ticket_id
  ) te
    ON te.ticket_id = t.id
  LEFT JOIN users ru
    ON ru.id = t.requester_user_id
  LEFT JOIN (
    SELECT
      ticket_id,
      COUNT(*) AS attachments_count,
      MAX(created_at) AS last_attachment_at
    FROM ticket_attachments
    GROUP BY ticket_id
  ) ta
    ON ta.ticket_id = t.id
`;

export class TicketModel extends BaseModel {
  constructor(db) {
    super('tickets', db);
  }

  async listTickets() {
    const [ticketRows] = await this.db.query(`
      ${toTicketBaseSelect()}
      WHERE t.deleted_at IS NULL
      ORDER BY
        CASE t.status
          WHEN 'en_proceso' THEN 1
          WHEN 'nuevo' THEN 2
          WHEN 'en_espera' THEN 3
          WHEN 'resuelto' THEN 4
          WHEN 'cerrado' THEN 5
          ELSE 6
        END ASC,
        CASE t.priority
          WHEN 'critica' THEN 1
          WHEN 'alta' THEN 2
          WHEN 'media' THEN 3
          WHEN 'baja' THEN 4
          ELSE 5
        END ASC,
        CASE WHEN t.due_at IS NULL THEN 1 ELSE 0 END ASC,
        t.due_at ASC,
        last_activity_at DESC,
        t.id DESC
    `);

    return appendTicketRelations(this.db, ticketRows);
  }

  async getTicketById(ticketId) {
    const [rows] = await this.db.query(`
      ${toTicketBaseSelect()}
      WHERE t.id = ?
        AND t.deleted_at IS NULL
      LIMIT 1
    `, [ticketId]);

    if (rows.length === 0) {
      return null;
    }

    const [ticket] = await appendTicketRelations(this.db, rows);
    return ticket || null;
  }

  async findUserSnapshot(db, userId) {
    const [rows] = await db.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        COALESCE(c.area_name, 'Sin área') AS area_name,
        u.photo_path
      FROM users u
      LEFT JOIN collaborators c
        ON c.id = u.collaborator_id
        AND c.deleted_at IS NULL
      WHERE u.id = ?
        AND u.status = 'active'
        AND u.deleted_at IS NULL
      LIMIT 1
    `, [userId]);

    return rows[0] || null;
  }

  async listActiveUsers() {
    const [rows] = await this.db.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        COALESCE(c.area_name, 'Sin área') AS area_name,
        u.photo_path
      FROM users u
      LEFT JOIN collaborators c
        ON c.id = u.collaborator_id
        AND c.deleted_at IS NULL
      WHERE u.status = 'active'
        AND u.deleted_at IS NULL
      ORDER BY u.name ASC
    `);

    return rows.map(mapUserSnapshot);
  }

  async listAssignableUsers() {
    const [rows] = await this.db.query(`
      SELECT DISTINCT
        u.id,
        u.name,
        u.email,
        COALESCE(c.area_name, 'Sin área') AS area_name,
        u.photo_path
      FROM users u
      LEFT JOIN collaborators c
        ON c.id = u.collaborator_id
        AND c.deleted_at IS NULL
      WHERE u.status = 'active'
        AND u.deleted_at IS NULL
        AND (
          EXISTS (
            SELECT 1
            FROM user_roles ur
            INNER JOIN roles r
              ON r.id = ur.role_id
            WHERE ur.user_id = u.id
              AND r.role_key IN ('admin', 'operator')
          )
          OR EXISTS (
            SELECT 1
            FROM user_roles ur
            INNER JOIN role_permissions rp
              ON rp.role_id = ur.role_id
            INNER JOIN permissions p
              ON p.id = rp.permission_id
            WHERE ur.user_id = u.id
              AND ${ticketAssignPermissionWhereClause}
          )
          OR EXISTS (
            SELECT 1
            FROM user_permissions up
            INNER JOIN permissions p
              ON p.id = up.permission_id
            WHERE up.user_id = u.id
              AND up.granted = 1
              AND ${ticketAssignPermissionWhereClause}
          )
        )
      ORDER BY u.name ASC
    `);

    return rows.map(mapUserSnapshot);
  }

  async hasTicketAssignPermission(db, userId) {
    const [rows] = await db.query(`
      SELECT 1
      FROM users u
      WHERE u.id = ?
        AND u.status = 'active'
        AND u.deleted_at IS NULL
        AND (
          EXISTS (
            SELECT 1
            FROM user_roles ur
            INNER JOIN roles r
              ON r.id = ur.role_id
            WHERE ur.user_id = u.id
              AND r.role_key IN ('admin', 'operator')
          )
          OR EXISTS (
            SELECT 1
            FROM user_roles ur
            INNER JOIN role_permissions rp
              ON rp.role_id = ur.role_id
            INNER JOIN permissions p
              ON p.id = rp.permission_id
            WHERE ur.user_id = u.id
              AND ${ticketAssignPermissionWhereClause}
          )
          OR EXISTS (
            SELECT 1
            FROM user_permissions up
            INNER JOIN permissions p
              ON p.id = up.permission_id
            WHERE up.user_id = u.id
              AND up.granted = 1
              AND ${ticketAssignPermissionWhereClause}
          )
        )
      LIMIT 1
    `, [userId]);

    return rows.length > 0;
  }

  async ensureTicketFolioSequenceTable(db) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS ticket_folio_sequences (
        period_key CHAR(4) NOT NULL,
        last_value INT UNSIGNED NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (period_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async lockAndGetNextFolioNumber(db, periodKey) {
    await this.ensureTicketFolioSequenceTable(db);

    await db.query(`
      INSERT INTO ticket_folio_sequences (
        period_key,
        last_value
      ) VALUES (?, 0)
      ON DUPLICATE KEY UPDATE period_key = VALUES(period_key)
    `, [periodKey]);

    await db.query(`
      UPDATE ticket_folio_sequences
      SET last_value = LAST_INSERT_ID(last_value + 1)
      WHERE period_key = ?
    `, [periodKey]);

    const [rows] = await db.query('SELECT LAST_INSERT_ID() AS next_value');
    return Number(rows[0]?.next_value || 0);
  }

  async createTicket(db, {
    folio,
    title,
    summary,
    status,
    priority,
    ticketType,
    categoryKey,
    requesterUserId,
    requesterName,
    requesterArea,
    assigneeUserId = null,
    assigneeName = null,
    dueAt = null,
    channel = 'Portal'
  }) {
    const [result] = await db.query(`
      INSERT INTO tickets (
        folio,
        title,
        summary,
        status,
        priority,
        ticket_type,
        category_key,
        requester_user_id,
        requester_name,
        requester_area,
        assignee_user_id,
        assignee_name,
        due_at,
        channel
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      folio,
      title,
      summary,
      status,
      priority,
      ticketType,
      categoryKey,
      requesterUserId,
      requesterName,
      requesterArea,
      assigneeUserId,
      assigneeName,
      dueAt,
      channel
    ]);

    return Number(result.insertId);
  }

  async updateTicket(db, { ticketId, updates }) {
    const entries = Object.entries(updates).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
      return false;
    }

    const updateFragments = [];
    const values = [];

    entries.forEach(([column, value]) => {
      if (!ALLOWED_TICKET_COLUMNS.has(column)) {
        return;
      }

      updateFragments.push(`${column} = ?`);
      values.push(value);
    });

    if (updateFragments.length === 0) {
      return false;
    }

    values.push(ticketId);

    const [result] = await db.query(`
      UPDATE tickets
      SET ${updateFragments.join(', ')},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND deleted_at IS NULL
    `, values);

    return result.affectedRows > 0;
  }

  async updateTicketStatus(db, { ticketId, status }) {
    const [result] = await db.query(`
      UPDATE tickets
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND deleted_at IS NULL
    `, [status, ticketId]);

    return result.affectedRows > 0;
  }

  async registerMissingOverdueEvents(db, {
    eventTitle,
    eventMeta
  }) {
    const [result] = await db.query(`
      INSERT INTO ticket_events (
        ticket_id,
        event_title,
        event_meta,
        created_at
      )
      SELECT
        t.id,
        ?,
        ?,
        CURRENT_TIMESTAMP
      FROM tickets t
      LEFT JOIN ticket_events te
        ON te.ticket_id = t.id
        AND te.event_title = ?
      WHERE t.deleted_at IS NULL
        AND t.status IN ('nuevo', 'en_proceso', 'en_espera')
        AND t.due_at IS NOT NULL
        AND t.due_at < CURRENT_TIMESTAMP
        AND te.id IS NULL
    `, [eventTitle, eventMeta, eventTitle]);

    return Number(result.affectedRows || 0);
  }

  async createTicketEvent(db, {
    ticketId,
    eventTitle,
    eventMeta,
    createdAt = null
  }) {
    await db.query(`
      INSERT INTO ticket_events (
        ticket_id,
        event_title,
        event_meta,
        created_at
      ) VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
    `, [ticketId, eventTitle, eventMeta, createdAt]);
  }

  async createTicketAttachment(db, {
    ticketId,
    fileName,
    fileStoragePath,
    fileMimeType,
    fileSizeBytes,
    fileSizeLabel,
    createdAt = null
  }) {
    const [result] = await db.query(`
      INSERT INTO ticket_attachments (
        ticket_id,
        file_name,
        file_storage_path,
        file_mime_type,
        file_size_bytes,
        file_size_label,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
    `, [
      ticketId,
      fileName,
      fileStoragePath,
      fileMimeType,
      fileSizeBytes,
      fileSizeLabel,
      createdAt
    ]);

    return Number(result.insertId);
  }

  async createTicketComment(db, {
    ticketId,
    authorUserId = null,
    commentText,
    createdAt = null
  }) {
    const [result] = await db.query(`
      INSERT INTO ticket_comments (
        ticket_id,
        author_user_id,
        comment_text,
        created_at
      ) VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
    `, [
      ticketId,
      authorUserId,
      commentText,
      createdAt
    ]);

    return Number(result.insertId);
  }
}
