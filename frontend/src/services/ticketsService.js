import { apiRequest } from "./api.js";

export const ticketsService = {
  list: async ({ token, search = "", statusId = "", priorityId = "" }) => {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (statusId) {
      params.set("statusId", String(statusId));
    }

    if (priorityId) {
      params.set("priorityId", String(priorityId));
    }

    const queryString = params.toString();
    const response = await apiRequest(
      `/tickets${queryString ? `?${queryString}` : ""}`,
      { token },
    );

    return response.data;
  },
  create: async ({ token, payload }) => {
    const response = await apiRequest("/tickets", {
      method: "POST",
      token,
      body: payload,
    });

    return response.data.item;
  },
};
