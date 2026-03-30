import { createErrorResponse } from "../utils/apiResponse.js";

const errorHandler = (error, req, res, _next) => {
  const statusCode = error.statusCode ?? 500;

  res.status(statusCode).json(
    createErrorResponse({
      code: error.code ?? "internal_server_error",
      message: error.message ?? "Error interno del servidor.",
      details:
        req.app.get("env") === "development"
          ? { stack: error.stack }
          : undefined,
    }),
  );
};

export default errorHandler;

