const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api/v1'
);

const buildApiError = (response, payload, fallbackMessage) => {
  const error = new Error(payload?.message || fallbackMessage);
  error.status = Number(response?.status || 0);
  error.code = payload?.error?.code || null;
  error.details = payload?.error?.details || null;
  error.isAuthError = (
    error.status === 401 ||
    error.code === 'AUTH_REQUIRED' ||
    error.code === 'INVALID_ACCESS_TOKEN' ||
    error.code === 'INVALID_REFRESH_TOKEN' ||
    error.code === 'REFRESH_TOKEN_REQUIRED'
  );
  return error;
};

const requestJson = async (path, {
  method = 'GET',
  body = null,
  accessToken = ''
} = {}) => {
  const headers = {
    Accept: 'application/json',
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw buildApiError(response, payload, 'No fue posible completar la operación de sesión.');
  }

  return payload.data;
};

export const isAuthError = (error) => (
  Boolean(
    error?.isAuthError ||
    error?.status === 401 ||
    error?.code === 'AUTH_REQUIRED'
  )
);

export const loginSession = ({ email, password, rememberMe = false }) => requestJson('/auth/login', {
  method: 'POST',
  body: {
    email,
    password,
    remember_me: rememberMe
  }
});

export const logoutSession = ({ refreshToken, accessToken = '' } = {}) => {
  const normalizedRefreshToken = String(refreshToken || '').trim();
  if (!normalizedRefreshToken) {
    return Promise.resolve({ revoked: false });
  }

  return requestJson('/auth/logout', {
    method: 'POST',
    body: {
      refresh_token: normalizedRefreshToken
    },
    accessToken
  });
};

export const getCurrentSession = ({ accessToken }) => requestJson('/auth/me', {
  method: 'GET',
  accessToken
});
