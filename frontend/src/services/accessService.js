import { isApiAuthError, requestJson } from './apiClient.js';

export const isAccessAuthError = (error) => (
  Boolean(
    isApiAuthError(error) ||
    error?.code === 'AUTH_REQUIRED'
  )
);

const requestAccessJson = (path, options = {}) => requestJson(path, {
  fallbackMessage: 'No fue posible completar la solicitud de accesos.',
  ...options
});

export const getAccessMap = () => requestAccessJson('/access/map');

export const getAccessCatalog = () => requestAccessJson('/access/catalog');

export const listAccessMedia = ({ mediumTypeKey = '', statusKey = '', search = '' } = {}) => {
  const query = new URLSearchParams();

  if (String(mediumTypeKey || '').trim()) {
    query.set('medium_type_key', String(mediumTypeKey || '').trim());
  }

  if (String(statusKey || '').trim()) {
    query.set('status_key', String(statusKey || '').trim());
  }

  if (String(search || '').trim()) {
    query.set('search', String(search || '').trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return requestAccessJson(`/access/media${suffix}`);
};

export const getAccessMediaDetail = (accessMediaId) => requestAccessJson(`/access/media/${accessMediaId}`);

export const createAccessMedia = (payload) => requestAccessJson('/access/media', {
  method: 'POST',
  body: payload
});

export const listAccessMediaAssignments = ({
  collaboratorId = '',
  accessMediaId = '',
  statusKey = '',
  search = '',
  limit = 240
} = {}) => {
  const query = new URLSearchParams();

  if (Number(collaboratorId) > 0) {
    query.set('collaborator_id', String(Number(collaboratorId)));
  }

  if (Number(accessMediaId) > 0) {
    query.set('access_media_id', String(Number(accessMediaId)));
  }

  if (String(statusKey || '').trim()) {
    query.set('status_key', String(statusKey || '').trim());
  }

  if (String(search || '').trim()) {
    query.set('search', String(search || '').trim());
  }

  if (Number(limit) > 0) {
    query.set('limit', String(Number(limit)));
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return requestAccessJson(`/access/media-assignments${suffix}`);
};

export const assignAccessMedia = (payload) => requestAccessJson('/access/media-assignments', {
  method: 'POST',
  body: payload
});

export const returnAccessMediaAssignment = (accessMediaAssignmentId, payload) => requestAccessJson(
  `/access/media-assignments/${accessMediaAssignmentId}/return`,
  {
    method: 'POST',
    body: payload
  }
);

export const markAccessMediaAssignmentNotReturned = (accessMediaAssignmentId, payload) => requestAccessJson(
  `/access/media-assignments/${accessMediaAssignmentId}/not-returned`,
  {
    method: 'POST',
    body: payload
  }
);

export const listAccessEnrollments = ({
  collaboratorId = '',
  accessSystemId = '',
  statusKey = '',
  search = '',
  limit = 240
} = {}) => {
  const query = new URLSearchParams();

  if (Number(collaboratorId) > 0) {
    query.set('collaborator_id', String(Number(collaboratorId)));
  }

  if (Number(accessSystemId) > 0) {
    query.set('access_system_id', String(Number(accessSystemId)));
  }

  if (String(statusKey || '').trim()) {
    query.set('status_key', String(statusKey || '').trim());
  }

  if (String(search || '').trim()) {
    query.set('search', String(search || '').trim());
  }

  if (Number(limit) > 0) {
    query.set('limit', String(Number(limit)));
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return requestAccessJson(`/access/enrollments${suffix}`);
};

export const createAccessEnrollment = (payload) => requestAccessJson('/access/enrollments', {
  method: 'POST',
  body: payload
});

export const updateAccessEnrollmentStatus = (accessEnrollmentId, payload) => requestAccessJson(
  `/access/enrollments/${accessEnrollmentId}/status`,
  {
    method: 'PATCH',
    body: payload
  }
);

export const offboardCollaboratorAccess = (collaboratorId, payload) => requestAccessJson(
  `/access/collaborators/${collaboratorId}/offboard`,
  {
    method: 'POST',
    body: payload
  }
);

export const listAccessEvents = ({
  collaboratorId = '',
  accessMediaId = '',
  accessEnrollmentId = '',
  limit = 240
} = {}) => {
  const query = new URLSearchParams();

  if (Number(collaboratorId) > 0) {
    query.set('collaborator_id', String(Number(collaboratorId)));
  }

  if (Number(accessMediaId) > 0) {
    query.set('access_media_id', String(Number(accessMediaId)));
  }

  if (Number(accessEnrollmentId) > 0) {
    query.set('access_enrollment_id', String(Number(accessEnrollmentId)));
  }

  if (Number(limit) > 0) {
    query.set('limit', String(Number(limit)));
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return requestAccessJson(`/access/events${suffix}`);
};
