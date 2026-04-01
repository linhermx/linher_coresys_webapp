import {
  authenticateUser,
  getAuthBlueprint,
  revokeSession,
  rotateSession,
} from "../services/authService.js";
import { createSuccessResponse } from "../utils/apiResponse.js";

export const getSession = (req, res) => {
  res.json(
    createSuccessResponse({
      message: "Sesión actual disponible.",
      data: {
        session: {
          authenticated: true,
          user: req.authUser,
        },
        auth: getAuthBlueprint(),
      },
      meta: {
        requestId: req.context.requestId,
      },
    }),
  );
};

export const getCurrentUser = (req, res) => {
  res.json(
    createSuccessResponse({
      message: "Usuario actual disponible.",
      data: {
        user: req.authUser,
      },
      meta: {
        requestId: req.context.requestId,
      },
    }),
  );
};

export const login = async (req, res, next) => {
  try {
    const { email, password, remember_me: rememberMe = false } = req.body ?? {};
    const session = await authenticateUser({
      email,
      password,
      rememberMe,
      requestContext: req.context,
    });

    res.json(
      createSuccessResponse({
        message: "Sesión iniciada correctamente.",
        data: {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          accessExpiresAt: session.access_expires_at,
          refreshExpiresAt: session.refresh_expires_at,
          user: session.user,
        },
        meta: {
          requestId: req.context.requestId,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const session = await rotateSession({
      refreshToken: req.body?.refreshToken,
      requestContext: req.context,
    });

    res.json(
      createSuccessResponse({
        message: "Sesión actualizada correctamente.",
        data: {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          accessExpiresAt: session.access_expires_at,
          refreshExpiresAt: session.refresh_expires_at,
          user: session.user,
        },
        meta: {
          requestId: req.context.requestId,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await revokeSession({
      refreshToken: req.body?.refreshToken,
      authUser: req.authUser ?? null,
      requestContext: req.context,
    });

    res.json(
      createSuccessResponse({
        message: "Sesión cerrada correctamente.",
        meta: {
          requestId: req.context.requestId,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};
