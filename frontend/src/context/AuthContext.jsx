import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService.js";

const ACCESS_TOKEN_KEY = "auth.access.token";
const REFRESH_TOKEN_KEY = "auth.refresh.token";

const AuthContext = createContext(null);

const readToken = (key) =>
  typeof window === "undefined" ? "" : window.localStorage.getItem(key) ?? "";

const writeToken = (key, value) => {
  if (typeof window === "undefined") {
    return;
  }

  if (value) {
    window.localStorage.setItem(key, value);
    return;
  }

  window.localStorage.removeItem(key);
};

const persistSession = ({ accessToken = "", refreshToken = "" } = {}) => {
  writeToken(ACCESS_TOKEN_KEY, accessToken);
  writeToken(REFRESH_TOKEN_KEY, refreshToken);
};

const clearSession = () => {
  writeToken(ACCESS_TOKEN_KEY, "");
  writeToken(REFRESH_TOKEN_KEY, "");
};

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    status: "loading",
    user: null,
    accessToken: readToken(ACCESS_TOKEN_KEY),
    refreshToken: readToken(REFRESH_TOKEN_KEY),
  });

  useEffect(() => {
    let active = true;

    const resolveSession = async () => {
      const accessToken = readToken(ACCESS_TOKEN_KEY);
      const refreshToken = readToken(REFRESH_TOKEN_KEY);

      if (!accessToken && !refreshToken) {
        if (active) {
          setState({
            status: "unauthenticated",
            user: null,
            accessToken: "",
            refreshToken: "",
          });
        }
        return;
      }

      const applyAuthenticatedState = ({ user, nextAccessToken, nextRefreshToken }) => {
        persistSession({
          accessToken: nextAccessToken,
          refreshToken: nextRefreshToken,
        });

        if (active) {
          setState({
            status: "authenticated",
            user,
            accessToken: nextAccessToken,
            refreshToken: nextRefreshToken,
          });
        }
      };

      try {
        if (accessToken) {
          const response = await authService.getSession(accessToken);

          applyAuthenticatedState({
            user: response.data.session.user,
            nextAccessToken: accessToken,
            nextRefreshToken: refreshToken,
          });
          return;
        }
      } catch {
        // Intenta refresh debajo.
      }

      if (!refreshToken) {
        clearSession();
        if (active) {
          setState({
            status: "unauthenticated",
            user: null,
            accessToken: "",
            refreshToken: "",
          });
        }
        return;
      }

      try {
        const response = await authService.refresh(refreshToken);

        applyAuthenticatedState({
          user: response.data.user,
          nextAccessToken: response.data.accessToken,
          nextRefreshToken: response.data.refreshToken,
        });
      } catch {
        clearSession();

        if (active) {
          setState({
            status: "unauthenticated",
            user: null,
            accessToken: "",
            refreshToken: "",
          });
        }
      }
    };

    resolveSession();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      isAuthenticated: state.status === "authenticated",
      login: async ({ email, password, rememberMe = false }) => {
        const response = await authService.login({ email, password, rememberMe });

        persistSession({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        });

        setState({
          status: "authenticated",
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        });

        return response.data.user;
      },
      logout: async () => {
        const refreshToken = readToken(REFRESH_TOKEN_KEY);
        const accessToken = readToken(ACCESS_TOKEN_KEY);

        try {
          if (refreshToken) {
            await authService.logout({ refreshToken, accessToken });
          }
        } finally {
          clearSession();
          setState({
            status: "unauthenticated",
            user: null,
            accessToken: "",
            refreshToken: "",
          });
        }
      },
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
