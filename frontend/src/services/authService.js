import { isApiAuthError, requestJson } from './apiClient.js';

export const isAuthError = (error) => (
  Boolean(
    isApiAuthError(error) ||
    error?.code === 'AUTH_REQUIRED'
  )
);

export const loginSession = ({ email, password, rememberMe = false }) => requestJson('/auth/login', {
  method: 'POST',
  body: {
    email,
    password,
    remember_me: rememberMe
  },
  allowAuthRetry: false,
  fallbackMessage: 'No fue posible completar la operacion de sesion.'
});

export const refreshSession = ({ refreshToken } = {}) => {
  const normalizedRefreshToken = String(refreshToken || '').trim();
  if (!normalizedRefreshToken) {
    return Promise.reject(new Error('Debes indicar un refresh token.'));
  }

  return requestJson('/auth/refresh', {
    method: 'POST',
    body: {
      refresh_token: normalizedRefreshToken
    },
    allowAuthRetry: false,
    fallbackMessage: 'No fue posible actualizar la sesion.'
  });
};

export const logoutSession = ({ refreshToken } = {}) => {
  const normalizedRefreshToken = String(refreshToken || '').trim();
  if (!normalizedRefreshToken) {
    return Promise.resolve({ revoked: false });
  }

  return requestJson('/auth/logout', {
    method: 'POST',
    body: {
      refresh_token: normalizedRefreshToken
    },
    allowAuthRetry: false,
    fallbackMessage: 'No fue posible cerrar la sesion.'
  });
};

export const getCurrentSession = () => requestJson('/auth/me', {
  method: 'GET',
  allowAuthRetry: false,
  fallbackMessage: 'No fue posible obtener la sesion actual.'
});