const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

const buildError = async (response) => {
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const message =
    payload?.error?.message ?? payload?.message ?? "Ocurrió un error al comunicar con la API.";

  const error = new Error(message);
  error.status = response.status;
  error.code = payload?.error?.code ?? "api_error";
  error.payload = payload;
  return error;
};

export const apiRequest = async (path, { body, headers = {}, method = "GET", token } = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw await buildError(response);
  }

  return response.json();
};
