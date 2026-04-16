const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api/v1'
);
const ACCESS_TOKEN_ENV = String(
  import.meta.env.VITE_TICKETS_ACCESS_TOKEN ||
  import.meta.env.VITE_AUTH_ACCESS_TOKEN ||
  ''
).trim();
const ACCESS_TOKEN_STORAGE_KEYS = [
  'coresys_access_token',
  'access_token',
  'auth_access_token'
];

const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return '';
  }
})();

const resolveAssetUrl = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return null;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  if (!API_ORIGIN) {
    return normalized;
  }

  return normalized.startsWith('/')
    ? `${API_ORIGIN}${normalized}`
    : `${API_ORIGIN}/${normalized}`;
};

const normalizeTicketPayload = (ticket) => {
  if (!ticket || typeof ticket !== 'object') {
    return ticket;
  }

  const attachments = Array.isArray(ticket.attachments)
    ? ticket.attachments.map((attachment) => ({
      ...attachment,
      url: resolveAssetUrl(attachment?.url)
    }))
    : [];

  return {
    ...ticket,
    attachments
  };
};

const normalizeTicketCollection = (data) => (
  Array.isArray(data)
    ? data.map(normalizeTicketPayload)
    : data
);

const readTokenFromStorage = (storage) => {
  if (!storage) {
    return null;
  }

  for (const storageKey of ACCESS_TOKEN_STORAGE_KEYS) {
    const candidate = String(storage.getItem(storageKey) || '').trim();
    if (candidate) {
      return candidate;
    }
  }

  const sessionSnapshot = String(storage.getItem('coresys_auth_session') || '').trim();
  if (!sessionSnapshot) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(sessionSnapshot);
    const candidate = String(parsedSession?.access_token || '').trim();
    return candidate || null;
  } catch {
    return null;
  }
};

const getAccessToken = () => {
  if (ACCESS_TOKEN_ENV) {
    return ACCESS_TOKEN_ENV;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  return (
    readTokenFromStorage(window.localStorage)
    || readTokenFromStorage(window.sessionStorage)
    || null
  );
};

const buildHeaders = ({ isJson = false } = {}) => {
  const headers = {
    Accept: 'application/json',
    ...(isJson ? { 'Content-Type': 'application/json' } : {})
  };

  const accessToken = getAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
};

const requestJson = async (path, { method = 'GET', body } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders({ isJson: Boolean(body) }),
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || 'No fue posible completar la solicitud de tickets.');
  }

  return payload.data;
};

const requestFormData = async (path, { method = 'POST', formData } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(),
    body: formData
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || 'No fue posible completar la solicitud de adjuntos.');
  }

  return payload.data;
};

export const listTickets = async () => normalizeTicketCollection(await requestJson('/tickets'));

export const getTicketsCatalog = () => requestJson('/tickets/catalog');

export const createTicket = (payload) => requestJson('/tickets', {
  method: 'POST',
  body: payload
}).then(normalizeTicketPayload);

export const updateTicket = (ticketId, payload) => requestJson(`/tickets/${ticketId}`, {
  method: 'PATCH',
  body: payload
}).then(normalizeTicketPayload);

export const updateTicketStatus = (ticketId, status) => requestJson(`/tickets/${ticketId}/status`, {
  method: 'PATCH',
  body: { status }
}).then(normalizeTicketPayload);

export const addTicketComment = (ticketId, commentText) => requestJson(`/tickets/${ticketId}/comments`, {
  method: 'POST',
  body: { comment_text: commentText }
}).then(normalizeTicketPayload);

export const uploadTicketAttachment = (ticketId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  return requestFormData(`/tickets/${ticketId}/attachments`, {
    method: 'POST',
    formData
  }).then(normalizeTicketPayload);
};
