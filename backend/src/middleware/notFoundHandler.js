import { createErrorResponse } from "../utils/apiResponse.js";

const notFoundHandler = (req, res) => {
  res.status(404).json(
    createErrorResponse({
      code: "route_not_found",
      message: "La ruta solicitada no existe.",
      details: {
        path: req.originalUrl,
        method: req.method,
      },
    }),
  );
};

export default notFoundHandler;

