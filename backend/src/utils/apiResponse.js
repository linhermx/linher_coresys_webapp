export const createSuccessResponse = ({
  data = {},
  message = "Operacion completada.",
  meta = {},
}) => ({
  ok: true,
  message,
  data,
  meta,
});

export const createErrorResponse = ({
  code = "unexpected_error",
  details = null,
  message = "Ocurrio un error no controlado.",
}) => ({
  ok: false,
  error: {
    code,
    message,
    details,
  },
});

