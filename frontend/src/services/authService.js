import { apiRequest } from "./api.js";

export const authService = {
  getSession: (accessToken) =>
    apiRequest("/auth/session", {
      token: accessToken,
    }),
  getCurrentUser: (accessToken) =>
    apiRequest("/auth/me", {
      token: accessToken,
    }),
  login: ({ email, password, rememberMe = false }) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: {
        email,
        password,
        remember_me: rememberMe,
      },
    }),
  refresh: (refreshToken) =>
    apiRequest("/auth/refresh", {
      method: "POST",
      body: {
        refreshToken,
      },
    }),
  logout: ({ refreshToken, accessToken }) =>
    apiRequest("/auth/logout", {
      method: "POST",
      token: accessToken,
      body: {
        refreshToken,
      },
    }),
};
