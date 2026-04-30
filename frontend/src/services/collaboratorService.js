import { isApiAuthError, requestJson } from './apiClient.js';

export const isCollaboratorAuthError = (error) => (
  Boolean(
    isApiAuthError(error) ||
    error?.code === 'AUTH_REQUIRED'
  )
);

const requestCollaboratorJson = (path, options = {}) => requestJson(path, {
  fallbackMessage: 'No fue posible completar la solicitud de colaboradores.',
  ...options
});

export const listCollaborators = ({ search = '', status = 'active', linked = '' } = {}) => {
  const query = new URLSearchParams();

  if (String(search || '').trim()) {
    query.set('search', String(search || '').trim());
  }

  if (String(status || '').trim()) {
    query.set('status', String(status || '').trim());
  }

  if (String(linked || '').trim()) {
    query.set('linked', String(linked || '').trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return requestCollaboratorJson(`/collaborators${suffix}`);
};
