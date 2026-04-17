import PropTypes from 'prop-types';
import { useState } from 'react';

import { loginSession, logoutSession } from '../services/authService.js';
import { AuthContext } from './authContextInstance.js';

const AUTH_SESSION_STORAGE_KEY = 'coresys_auth_session';
const ACCESS_TOKEN_STORAGE_KEYS = [
  'coresys_access_token',
  'access_token',
  'auth_access_token'
];
const REFRESH_TOKEN_STORAGE_KEYS = [
  'coresys_refresh_token',
  'refresh_token',
  'auth_refresh_token'
];

const normalizeSession = (session) => {
  if (!session || typeof session !== 'object') {
    return null;
  }

  const accessToken = String(session.access_token || '').trim();
  if (!accessToken) {
    return null;
  }

  return {
    user: session.user && typeof session.user === 'object' ? session.user : null,
    access_token: accessToken,
    refresh_token: String(session.refresh_token || '').trim(),
    access_expires_at: session.access_expires_at || null,
    refresh_expires_at: session.refresh_expires_at || null
  };
};

const clearSessionFromStorage = (storage) => {
  if (!storage) {
    return;
  }

  storage.removeItem(AUTH_SESSION_STORAGE_KEY);
  ACCESS_TOKEN_STORAGE_KEYS.forEach((key) => storage.removeItem(key));
  REFRESH_TOKEN_STORAGE_KEYS.forEach((key) => storage.removeItem(key));
};

const readSessionFromStorage = (storage) => {
  if (!storage) {
    return null;
  }

  const snapshot = String(storage.getItem(AUTH_SESSION_STORAGE_KEY) || '').trim();
  if (snapshot) {
    try {
      const parsed = JSON.parse(snapshot);
      const normalized = normalizeSession(parsed);
      if (normalized) {
        return normalized;
      }
    } catch {
      // noop: intentamos fallback por llaves sueltas
    }
  }

  for (const tokenKey of ACCESS_TOKEN_STORAGE_KEYS) {
    const candidate = String(storage.getItem(tokenKey) || '').trim();
    if (candidate) {
      return normalizeSession({
        access_token: candidate,
        refresh_token: '',
        user: null
      });
    }
  }

  return null;
};

const getInitialSessionState = () => {
  if (typeof window === 'undefined') {
    return {
      session: null,
      rememberSession: true
    };
  }

  const localSession = readSessionFromStorage(window.localStorage);
  if (localSession) {
    return {
      session: localSession,
      rememberSession: true
    };
  }

  const transientSession = readSessionFromStorage(window.sessionStorage);
  if (transientSession) {
    return {
      session: transientSession,
      rememberSession: false
    };
  }

  return {
    session: null,
    rememberSession: true
  };
};

const persistSession = ({ session, rememberSession }) => {
  if (typeof window === 'undefined') {
    return;
  }

  clearSessionFromStorage(window.localStorage);
  clearSessionFromStorage(window.sessionStorage);

  if (!session) {
    return;
  }

  const targetStorage = rememberSession ? window.localStorage : window.sessionStorage;
  targetStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  targetStorage.setItem(ACCESS_TOKEN_STORAGE_KEYS[0], session.access_token);

  if (session.refresh_token) {
    targetStorage.setItem(REFRESH_TOKEN_STORAGE_KEYS[0], session.refresh_token);
  }
};

export const AuthProvider = ({ children }) => {
  const initialState = getInitialSessionState();
  const [authSession, setAuthSession] = useState(initialState.session);
  const [rememberSession, setRememberSession] = useState(initialState.rememberSession);

  const applySession = (nextSession, nextRememberSession) => {
    const normalized = normalizeSession(nextSession);
    setAuthSession(normalized);
    setRememberSession(nextRememberSession);
    persistSession({
      session: normalized,
      rememberSession: nextRememberSession
    });
  };

  const clearSession = () => {
    setAuthSession(null);
    persistSession({
      session: null,
      rememberSession
    });
  };

  const login = async ({ email, password, rememberMe }) => {
    const nextSession = await loginSession({
      email,
      password,
      rememberMe
    });

    applySession(nextSession, Boolean(rememberMe));
    return nextSession;
  };

  const logout = async () => {
    const currentSession = authSession;
    clearSession();

    try {
      await logoutSession({
        refreshToken: currentSession?.refresh_token,
        accessToken: currentSession?.access_token || ''
      });
    } catch {
      // Si la sesión ya caducó en backend, mantenemos cierre local.
    }
  };

  const value = {
    authSession,
    authUser: authSession?.user || null,
    accessToken: String(authSession?.access_token || '').trim(),
    isAuthenticated: Boolean(authSession?.access_token),
    login,
    logout,
    clearSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};
