const DEFAULT_LOADING_COPY = 'Estamos preparando la vista operativa del módulo.';
const DEFAULT_NO_RESULTS_COPY = 'Ajusta la búsqueda o los filtros para recuperar resultados.';

export const createWorkspaceLoadingState = (label) => ({
  title: `Cargando ${label}`,
  copy: DEFAULT_LOADING_COPY
});

export const createWorkspaceErrorTitle = (label) => `No fue posible cargar ${label}`;

export const createWorkspaceNoResultsState = (label, copy = DEFAULT_NO_RESULTS_COPY) => ({
  title: `No encontramos ${label} con estos filtros`,
  copy
});

export const createWorkspaceNoRecordsState = (label, copy) => ({
  title: `Aún no hay ${label} registrados`,
  copy
});
