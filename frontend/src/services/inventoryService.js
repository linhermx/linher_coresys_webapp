import { isApiAuthError, requestJson } from './apiClient.js';

export const isAuthError = (error) => (
  Boolean(
    isApiAuthError(error) ||
    error?.code === 'AUTH_REQUIRED'
  )
);

const requestInventoryJson = (path, options = {}) => requestJson(path, {
  fallbackMessage: 'No fue posible completar la solicitud de inventario.',
  ...options
});

export const getInventoryMap = () => requestInventoryJson('/inventory/map');

export const getInventoryCatalog = () => requestInventoryJson('/inventory/catalog');

export const listCatalogAssetTypes = ({ includeInactive = false } = {}) => {
  const query = new URLSearchParams();
  if (includeInactive) {
    query.set('include_inactive', '1');
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return requestInventoryJson(`/inventory/catalog/asset-types${suffix}`);
};

export const createCatalogAssetType = (payload) => requestInventoryJson('/inventory/catalog/asset-types', {
  method: 'POST',
  body: payload
});

export const updateCatalogAssetType = (assetTypeId, payload) => requestInventoryJson(`/inventory/catalog/asset-types/${assetTypeId}`, {
  method: 'PATCH',
  body: payload
});

export const deactivateCatalogAssetType = (assetTypeId) => requestInventoryJson(`/inventory/catalog/asset-types/${assetTypeId}/deactivate`, {
  method: 'POST'
});

export const reactivateCatalogAssetType = (assetTypeId) => requestInventoryJson(`/inventory/catalog/asset-types/${assetTypeId}/reactivate`, {
  method: 'POST'
});

export const listCatalogLocationTypes = ({ includeInactive = false } = {}) => {
  const query = new URLSearchParams();
  if (includeInactive) {
    query.set('include_inactive', '1');
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return requestInventoryJson(`/inventory/catalog/location-types${suffix}`);
};

export const createCatalogLocationType = (payload) => requestInventoryJson('/inventory/catalog/location-types', {
  method: 'POST',
  body: payload
});

export const updateCatalogLocationType = (locationTypeId, payload) => requestInventoryJson(`/inventory/catalog/location-types/${locationTypeId}`, {
  method: 'PATCH',
  body: payload
});

export const deactivateCatalogLocationType = (locationTypeId) => requestInventoryJson(`/inventory/catalog/location-types/${locationTypeId}/deactivate`, {
  method: 'POST'
});

export const reactivateCatalogLocationType = (locationTypeId) => requestInventoryJson(`/inventory/catalog/location-types/${locationTypeId}/reactivate`, {
  method: 'POST'
});

export const listAssets = ({ search = '', status = '', operationalStatus = '', trackingModeKey = '' } = {}) => {
  const query = new URLSearchParams();

  if (String(search || '').trim()) {
    query.set('search', String(search || '').trim());
  }

  const resolvedStatus = String(operationalStatus || status || '').trim();
  if (resolvedStatus) {
    query.set('operational_status', resolvedStatus);
  }

  if (String(trackingModeKey || '').trim()) {
    query.set('tracking_mode_key', String(trackingModeKey || '').trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return requestInventoryJson(`/inventory/assets${suffix}`);
};

export const getAssetDetail = (assetId, { movementLimit = 60 } = {}) => requestInventoryJson(
  `/inventory/assets/${assetId}?movement_limit=${Number(movementLimit) || 60}`
);

export const listAssetUnits = (assetId) => requestInventoryJson(`/inventory/assets/${assetId}/units`);

export const listInventoryAssetUnits = ({ status = '', assetId = '', search = '', assetTypeKey = '' } = {}) => {
  const query = new URLSearchParams();

  if (String(status || '').trim()) {
    query.set('status', String(status || '').trim());
  }

  if (Number(assetId) > 0) {
    query.set('asset_id', String(Number(assetId)));
  }

  if (String(search || '').trim()) {
    query.set('search', String(search || '').trim());
  }

  if (String(assetTypeKey || '').trim()) {
    query.set('asset_type_key', String(assetTypeKey || '').trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return requestInventoryJson(`/inventory/asset-units${suffix}`);
};

export const createAssetUnits = (assetId, payload) => requestInventoryJson(`/inventory/assets/${assetId}/units`, {
  method: 'POST',
  body: payload
});

export const createAsset = (payload) => requestInventoryJson('/inventory/assets', {
  method: 'POST',
  body: payload
});

export const updateAsset = (assetId, payload) => requestInventoryJson(`/inventory/assets/${assetId}`, {
  method: 'PATCH',
  body: payload
});

export const listInventoryMovements = ({ limit = 120 } = {}) => requestInventoryJson(
  `/inventory/movements?limit=${Number(limit) || 120}`
);

export const registerInventoryMovement = (payload) => requestInventoryJson('/inventory/movements', {
  method: 'POST',
  body: payload
});

export const listLocations = ({ status = '' } = {}) => {
  const query = new URLSearchParams();
  if (String(status || '').trim()) {
    query.set('status', String(status || '').trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return requestInventoryJson(`/inventory/locations${suffix}`);
};

export const createLocation = (payload) => requestInventoryJson('/inventory/locations', {
  method: 'POST',
  body: payload
});

export const updateLocation = (locationId, payload) => requestInventoryJson(`/inventory/locations/${locationId}`, {
  method: 'PATCH',
  body: payload
});

export const listAssetAssignments = ({
  assetUnitId = '',
  assetId = '',
  collaboratorId = '',
  status = '',
  search = ''
} = {}) => {
  const query = new URLSearchParams();

  if (Number(assetUnitId) > 0) {
    query.set('asset_unit_id', String(Number(assetUnitId)));
  }

  if (Number(assetId) > 0) {
    query.set('asset_id', String(Number(assetId)));
  }

  if (Number(collaboratorId) > 0) {
    query.set('collaborator_id', String(Number(collaboratorId)));
  }

  if (String(status || '').trim()) {
    query.set('status', String(status || '').trim());
  }

  if (String(search || '').trim()) {
    query.set('search', String(search || '').trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return requestInventoryJson(`/inventory/assignments${suffix}`);
};

export const createAssetAssignment = (payload) => requestInventoryJson('/inventory/assignments', {
  method: 'POST',
  body: payload
});

export const closeAssetAssignment = (assignmentId, payload) => requestInventoryJson(`/inventory/assignments/${assignmentId}/close`, {
  method: 'POST',
  body: payload
});

export const updateAssetUnitStatus = (assetUnitId, payload) => requestInventoryJson(`/inventory/units/${assetUnitId}/status`, {
  method: 'PATCH',
  body: payload
});

export const getAssetUnitLabel = (assetUnitId) => requestInventoryJson(`/inventory/units/${assetUnitId}/label`);

export const getLocationLabel = (locationId) => requestInventoryJson(`/inventory/locations/${locationId}/label`);
