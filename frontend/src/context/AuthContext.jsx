import PropTypes from 'prop-types';
import { useState } from 'react';

import { loginSession, logoutSession } from '../services/authService.js';
import {
  clearSessionState,
  getStoredSessionState,
  normalizeSession,
  persistSessionState
} from '../services/sessionStore.js';
import { AuthContext } from './authContextInstance.js';

export const AuthProvider = ({ children }) => {
  const initialState = getStoredSessionState();
  const [authSession, setAuthSession] = useState(initialState.session);

  const applySession = (nextSession, nextRememberSession) => {
    const normalized = normalizeSession(nextSession);
    setAuthSession(normalized);
    persistSessionState({
      session: normalized,
      rememberSession: nextRememberSession
    });
  };

  const clearSession = () => {
    setAuthSession(null);
    clearSessionState();
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
        refreshToken: currentSession?.refresh_token
      });
    } catch {
      // La sesion local ya quedo cerrada.
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
