import {
  clearSessionState,
  getAccessToken,
  getRefreshToken,
  getStoredSessionState,
  normalizeSession,
  persistSessionState
} from './sessionStore.js';

const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api/v1'
);

const AUTH_ERROR_CODES = new Set([
  'AUTH_REQUIRED',
  'INVALID_ACCESS_TOKEN',
  'INVALID_REFRESH_TOKEN',
  'REFRESH_TOKEN_REQUIRED',
  'REFRESH_TOKEN_REVOKED',
  'EXPIRED_REFRESH_TOKEN',
  'INVALID_REFRESH_USER'
]);

const isAuthEndpoint = (path) => String(path || '').startsWith('/auth/');

const toNetworkError = (message, fallbackMessage) => {
  const error = new Error(String(message || fallbackMessage || 'No fue posible conectar con el servidor.'));
  error.status = 0;
  error.code = 'NETWORK_ERROR';
  error.details = null;
  error.isAuthError = false;
  return error;
};

const buildApiError = (response, payload, fallbackMessage) => {
  const error = new Error(payload?.message || fallbackMessage);
  error.status = Number(response?.status || 0);
  error.code = payload?.error?.code || null;
  error.details = payload?.error?.details || null;
  error.isAuthError = (
    error.status === 401 ||
    AUTH_ERROR_CODES.has(String(error.code || ''))
  );
  return error;
};

export const isApiAuthError = (error) => (
  Boolean(
    error?.isAuthError ||
    error?.status === 401 ||
    AUTH_ERROR_CODES.has(String(error?.code || ''))
  )
);

const executeRequest = async (path, {
  method = 'GET',
  body = null,
  accessToken = '',
  fallbackMessage = 'No fue posible completar la operación.',
  extraHeaders = {}
} = {}) => {
  const headers = {
    Accept: 'application/json',
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...extraHeaders
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  } catch (error) {
    throw toNetworkError(error?.message, 'No fue posible conectar con la API.');
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw buildApiError(response, payload, fallbackMessage);
  }

  return payload.data;
};

let refreshInFlightPromise = null;

const refreshSessionToken = async () => {
  if (refreshInFlightPromise) {
    return refreshInFlightPromise;
  }

  const activeState = getStoredSessionState();
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw toNetworkError('No existe refresh token en sesión.', 'La sesión no tiene refresh token.');
  }

  refreshInFlightPromise = (async () => {
    const refreshedSession = await executeRequest('/auth/refresh', {
      method: 'POST',
      body: {
        refresh_token: refreshToken
      },
      accessToken: String(activeState.session?.access_token || '').trim(),
      fallbackMessage: 'No fue posible refrescar la sesión.'
    });

    const normalized = normalizeSession(refreshedSession);
    if (!normalized) {
      throw toNetworkError('La respuesta de refresh no incluye access token válido.', 'No fue posible renovar la sesión.');
    }

    persistSessionState({
      session: normalized,
      rememberSession: activeState.rememberSession
    });

    return normalized;
  })().finally(() => {
    refreshInFlightPromise = null;
  });

  return refreshInFlightPromise;
};

export const requestJson = async (path, {
  method = 'GET',
  body = null,
  fallbackMessage = 'No fue posible completar la operación.',
  allowAuthRetry = true
} = {}) => {
  const attemptWithCurrentToken = () => executeRequest(path, {
    method,
    body,
    accessToken: getAccessToken(),
    fallbackMessage
  });

  try {
    return await attemptWithCurrentToken();
  } catch (error) {
    const canRetryWithRefresh = (
      allowAuthRetry &&
      !isAuthEndpoint(path) &&
      isApiAuthError(error)
    );

    if (!canRetryWithRefresh) {
      throw error;
    }

    try {
      const nextSession = await refreshSessionToken();
      return await executeRequest(path, {
        method,
        body,
        accessToken: nextSession.access_token,
        fallbackMessage
      });
    } catch (refreshError) {
      if (isApiAuthError(refreshError)) {
        clearSessionState();
      }

      throw refreshError;
    }
  }
};
