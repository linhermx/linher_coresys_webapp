import { API_BASE_URL, isApiAuthError, requestJson } from './apiClient.js';
import { getAccessToken } from './sessionStore.js';

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

export const isAuthError = (error) => (
  Boolean(
    isApiAuthError(error) ||
    error?.code === 'AUTH_REQUIRED'
  )
);

const requestTicketJson = (path, options = {}) => requestJson(path, {
  fallbackMessage: 'No fue posible completar la solicitud de tickets.',
  ...options
});

const requestFormData = async (path, { method = 'POST', formData } = {}) => {
  const accessToken = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: formData
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    const error = new Error(payload?.message || 'No fue posible completar la solicitud de adjuntos.');
    error.status = Number(response?.status || 0);
    error.code = payload?.error?.code || null;
    error.details = payload?.error?.details || null;
    error.isAuthError = isAuthError(error);
    throw error;
  }

  return payload.data;
};

export const listTickets = async () => normalizeTicketCollection(await requestTicketJson('/tickets'));

export const getTicketsCatalog = () => requestTicketJson('/tickets/catalog');

export const createTicket = (payload) => requestTicketJson('/tickets', {
  method: 'POST',
  body: payload
}).then(normalizeTicketPayload);

export const updateTicket = (ticketId, payload) => requestTicketJson(`/tickets/${ticketId}`, {
  method: 'PATCH',
  body: payload
}).then(normalizeTicketPayload);

export const updateTicketStatus = (ticketId, status) => requestTicketJson(`/tickets/${ticketId}/status`, {
  method: 'PATCH',
  body: { status }
}).then(normalizeTicketPayload);

export const addTicketComment = (ticketId, commentText) => requestTicketJson(`/tickets/${ticketId}/comments`, {
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
