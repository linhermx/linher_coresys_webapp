import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Archive,
  ArrowRightLeft,
  Boxes,
  Building2,
  ChevronRight,
  Check,
  CircleOff,
  MapPin,
  PackagePlus,
  PencilLine,
  Plus,
  ShieldCheck,
  Settings2,
  Tags,
  Undo2,
  Wrench,
  X
} from 'lucide-react';

import { EmptyState } from '../components/primitives/EmptyState.jsx';
import { FieldLabel } from '../components/primitives/FieldLabel.jsx';
import { FilterChipGroup } from '../components/primitives/FilterChipGroup.jsx';
import { FilterSelect } from '../components/primitives/FilterSelect.jsx';
import { DrawerTabs } from '../components/primitives/DrawerTabs.jsx';
import { InlineNotice } from '../components/primitives/InlineNotice.jsx';
import { OperationalPanel } from '../components/primitives/OperationalPanel.jsx';
import { OperationalTable } from '../components/primitives/OperationalTable.jsx';
import { PaginationBar } from '../components/primitives/PaginationBar.jsx';
import { SegmentedControl } from '../components/primitives/SegmentedControl.jsx';
import { ToolbarSearchField } from '../components/primitives/ToolbarSearchField.jsx';
import { WorkspaceSplitLayout } from '../components/primitives/WorkspaceSplitLayout.jsx';
import { ModalDialog } from '../components/primitives/ModalDialog.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { hasPermission } from '../utils/accessControl.js';
import { getNextHorizontalTabIndex } from '../utils/tabNavigation.js';
import {
  createWorkspaceErrorTitle,
  createWorkspaceLoadingState,
  createWorkspaceNoRecordsState,
  createWorkspaceNoResultsState
} from '../utils/workspaceStateCopy.js';
import {
  closeAssetAssignment,
  createAssetAssignment,
  createAsset,
  createAssetUnits,
  createCatalogAssetType,
  createCatalogLocationType,
  deactivateCatalogAssetType,
  deactivateCatalogLocationType,
  createLocation,
  getAssetDetail,
  getInventoryCatalog,
  isAuthError as isInventoryAuthError,
  listAssetAssignments,
  listInventoryAssetUnits,
  listAssets,
  listCatalogAssetTypes,
  listCatalogLocationTypes,
  listInventoryMovements,
  listLocations,
  reactivateCatalogAssetType,
  reactivateCatalogLocationType,
  registerInventoryMovement,
  updateAsset,
  updateCatalogAssetType,
  updateCatalogLocationType,
  updateLocation,
  updateAssetUnitStatus
} from '../services/inventoryService.js';
import { isCollaboratorAuthError, listCollaborators } from '../services/collaboratorService.js';

const inventoryViewOptions = [
  { key: 'assets', label: 'Activos', icon: Boxes },
  { key: 'movements', label: 'Movimientos', icon: ArrowRightLeft },
  { key: 'assignments', label: 'Resguardos', icon: ShieldCheck },
  { key: 'locations', label: 'Ubicaciones', icon: MapPin }
];

const inventoryLoadingState = createWorkspaceLoadingState('inventario');
const inventoryLoadErrorTitle = createWorkspaceErrorTitle('el inventario');
const inventoryAssetsNoResultsState = createWorkspaceNoResultsState('activos');
const inventoryMovementsNoRecordsState = createWorkspaceNoRecordsState(
  'movimientos',
  'Registra el primer movimiento para iniciar la trazabilidad del inventario.'
);
const inventoryAssignmentsNoResultsState = createWorkspaceNoResultsState('resguardos');
const inventoryLocationsNoResultsState = createWorkspaceNoResultsState('ubicaciones');

const validInventoryViewKeys = new Set(inventoryViewOptions.map((option) => option.key));

const resolveInventoryView = (value) => {
  const normalizedValue = String(value || '').trim();
  return validInventoryViewKeys.has(normalizedValue) ? normalizedValue : 'assets';
};

const assetStatusOptions = [
  { key: 'all', label: 'Todos' },
  { key: 'available', label: 'Disponibles' },
  { key: 'assigned', label: 'Asignados' },
  { key: 'in_repair', label: 'En reparación' },
  { key: 'retired', label: 'Baja' }
];

const assignmentStatusOptions = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'closed', label: 'Cerrados' }
];

const detailTabOptions = [
  { key: 'summary', label: 'Resumen' },
  { key: 'units', label: 'Unidades' },
  { key: 'movements', label: 'Movimientos' }
];

const catalogTabOptions = [
  { key: 'asset_types', label: 'Tipos de activo' },
  { key: 'location_types', label: 'Tipos de ubicación' }
];

const catalogTabCopy = {
  asset_types: {
    heading: 'Tipos de activo',
    editorCreateTitle: 'Nuevo tipo de activo',
    editorEditTitle: 'Editar tipo de activo',
    editorDescription: '',
    recordsTitle: 'Tipos existentes',
    countLabel: 'tipos de activo'
  },
  location_types: {
    heading: 'Tipos de ubicación',
    editorCreateTitle: 'Nuevo tipo de ubicación',
    editorEditTitle: 'Editar tipo de ubicación',
    editorDescription: '',
    recordsTitle: 'Tipos existentes',
    countLabel: 'tipos de ubicación'
  }
};

const quickReasonTemplates = [
  'Entrada inicial',
  'Ajuste de inventario',
  'Consumo operativo',
  'Traslado entre ubicaciones',
  'Salida por asignación'
];

const defaultMovementLine = {
  asset_id: '',
  quantity: '1',
  from_location_id: '',
  to_location_id: '',
  notes: ''
};

const defaultCatalogAssetTypeForm = {
  name: '',
  code_prefix: '',
  asset_category_id: '',
  default_tracking_mode_id: '',
  description: ''
};

const defaultCatalogLocationTypeForm = {
  name: '',
  code_prefix: '',
  description: ''
};

const defaultUnitLine = {
  serial_number: '',
  location_id: '',
  status_key: 'available',
  notes: ''
};

const defaultAssignmentForm = {
  asset_unit_id: '',
  collaborator_id: '',
  location_id: '',
  assigned_at: '',
  expected_return_at: '',
  delivery_condition: '',
  notes: ''
};

const defaultAssignmentCloseForm = {
  asset_unit_id: '',
  location_id: '',
  returned_at: '',
  return_condition: '',
  notes: ''
};

const defaultAssetEditForm = {
  asset_name: '',
  brand: '',
  model: '',
  min_quantity: '0',
  description: '',
  reason: 'Actualización del activo por operación de Sistemas.'
};

const defaultUnitStatusForm = {
  asset_unit_id: '',
  status_key: '',
  location_id: '',
  happened_at: '',
  reason: '',
  notes: ''
};

const INVENTORY_PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_INVENTORY_PAGE_SIZE = INVENTORY_PAGE_SIZE_OPTIONS[0];
const INVENTORY_ASSET_DETAIL_PANEL_ID = 'inventory-asset-detail-panel';
const INVENTORY_ASSET_DETAIL_TITLE_ID = 'inventory-asset-detail-title';

const normalizeOptionalNumber = (value) => {
  const normalized = Number(value);
  return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
};

const normalizeOptionalDecimal = (value) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
};

const normalizeErrorMessage = (error, fallback) => (
  String(error?.message || '').trim() || fallback
);

const normalizeCodePrefixPreview = (value, fallback) => {
  const normalized = String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);

  return normalized || fallback;
};

const normalizeLocationKeyPreview = (value, fallback) => {
  const normalized = String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

  return normalized || fallback;
};

const normalizePotentialMojibake = (value) => {
  const text = String(value ?? '');
  if (!text || !/[ÃÂâ€]/.test(text)) {
    return text;
  }

  try {
    return new TextDecoder('utf-8').decode(Uint8Array.from(text, (character) => character.charCodeAt(0)));
  } catch (error) {
    return text;
  }
};

const buildLocationTree = (items) => {
  const byId = new Map();
  const childrenByParent = new Map();

  items.forEach((item) => {
    byId.set(Number(item.id), item);
  });

  items.forEach((item) => {
    const parentId = item.parent_location_id ? Number(item.parent_location_id) : 0;
    const normalizedParentId = parentId && byId.has(parentId) ? parentId : 0;
    const siblings = childrenByParent.get(normalizedParentId) || [];
    siblings.push(item);
    childrenByParent.set(normalizedParentId, siblings);
  });

  const sortItems = (left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'es-MX');
  childrenByParent.forEach((siblings) => siblings.sort(sortItems));

  const buildBranch = (parentId = 0, depth = 0) => (
    (childrenByParent.get(parentId) || []).map((item) => ({
      ...item,
      depth,
      children: buildBranch(Number(item.id), depth + 1)
    }))
  );

  return buildBranch();
};

const flattenLocationTree = (nodes, expandedIds, forceExpandAll = false) => {
  const rows = [];

  const visit = (node) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = forceExpandAll || expandedIds.has(Number(node.id));

    rows.push({
      ...node,
      hasChildren,
      isExpanded
    });

    if (hasChildren && isExpanded) {
      node.children.forEach(visit);
    }
  };

  nodes.forEach(visit);
  return rows;
};

const formatDateTime = (value) => {
  if (!value) {
    return 'Sin fecha';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City'
  }).format(parsed);
};

const toMovementDirectionLabel = (direction) => {
  if (direction === 'in') return 'Entrada';
  if (direction === 'out') return 'Salida';
  if (direction === 'transfer') return 'Traslado';
  if (direction === 'adjustment') return 'Ajuste';
  return 'Evento';
};

const toMovementWhatHappened = (movement) => {
  const movementType = String(movement?.movement_type_name || '').trim();
  const direction = toMovementDirectionLabel(movement?.direction);
  if (!movementType) {
    return `Movimiento registrado (${direction})`;
  }
  return `${movementType} (${direction})`;
};

const toMovementImpact = (movement) => {
  const quantity = Number(movement?.quantity || 0);
  const quantityLabel = Number.isFinite(quantity)
    ? `${quantity} ${quantity === 1 ? 'unidad' : 'unidades'}`
    : 'cantidad no disponible';

  const fromLocation = String(movement?.from_location_name || '').trim();
  const toLocation = String(movement?.to_location_name || '').trim();

  if (fromLocation && toLocation) {
    return `${quantityLabel} · ${fromLocation} -> ${toLocation}`;
  }

  if (toLocation) {
    return `${quantityLabel} · hacia ${toLocation}`;
  }

  if (fromLocation) {
    return `${quantityLabel} · desde ${fromLocation}`;
  }

  return quantityLabel;
};

const sanitizeMovementReason = (reason) => (
  String(reason || '')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
);

const toStatusLabel = (status) => {
  if (status === 'active') return 'Activo';
  if (status === 'inactive') return 'Inactivo';
  return status || 'Sin estado';
};

const toStatusTone = (status) => {
  if (status === 'active') return 'success';
  if (status === 'inactive') return 'neutral';
  return 'neutral';
};

const toOperationalStatusLabel = (status) => {
  if (status === 'available') return 'Disponible';
  if (status === 'assigned') return 'Asignado';
  if (status === 'in_repair') return 'En reparación';
  if (status === 'retired') return 'Baja';
  return status || 'Sin estado';
};

const toOperationalStatusTone = (status) => {
  if (status === 'available') return 'success';
  if (status === 'assigned') return 'accent';
  if (status === 'in_repair') return 'warning';
  if (status === 'retired') return 'neutral';
  return 'neutral';
};

const toUnitStatusTone = (status) => {
  if (status === 'available') return 'success';
  if (status === 'assigned') return 'accent';
  if (status === 'in_repair') return 'warning';
  return 'neutral';
};

const InventoryPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { authUser, clearSession } = useAuth();
  const requestedView = resolveInventoryView(searchParams.get('view'));
  const canCreateInventory = hasPermission(authUser, 'inventory.create');
  const canUpdateInventory = hasPermission(authUser, 'inventory.update');
  const canAssignInventory = hasPermission(authUser, 'inventory.assign');
  const canManageCatalog = canUpdateInventory;
  const activeView = requestedView;
  const [activeDetailTab, setActiveDetailTab] = useState('summary');
  const [catalog, setCatalog] = useState({
    tracking_modes: [],
    categories: [],
    types: [],
    unit_statuses: [],
    location_types: [],
    movement_types: []
  });
  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [movements, setMovements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignableUnits, setAssignableUnits] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [assetDetail, setAssetDetail] = useState(null);
  const [isLoadingAssetDetail, setIsLoadingAssetDetail] = useState(false);
  const [isLoadingScreen, setIsLoadingScreen] = useState(true);
  const [screenError, setScreenError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [movementsSearchTerm, setMovementsSearchTerm] = useState('');
  const [assignmentsSearchTerm, setAssignmentsSearchTerm] = useState('');
  const [locationsSearchTerm, setLocationsSearchTerm] = useState('');
  const [assetStatusFilter, setAssetStatusFilter] = useState('all');
  const [trackingModeFilter, setTrackingModeFilter] = useState('all');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState('all');
  const [assignmentCollaboratorFilter, setAssignmentCollaboratorFilter] = useState('all');
  const [assetsCurrentPage, setAssetsCurrentPage] = useState(1);
  const [assetsItemsPerPage, setAssetsItemsPerPage] = useState(DEFAULT_INVENTORY_PAGE_SIZE);
  const [movementsCurrentPage, setMovementsCurrentPage] = useState(1);
  const [movementsItemsPerPage, setMovementsItemsPerPage] = useState(DEFAULT_INVENTORY_PAGE_SIZE);
  const [assignmentsCurrentPage, setAssignmentsCurrentPage] = useState(1);
  const [assignmentsItemsPerPage, setAssignmentsItemsPerPage] = useState(DEFAULT_INVENTORY_PAGE_SIZE);
  const [expandedLocationIds, setExpandedLocationIds] = useState(() => new Set());

  const [isCreateAssetOpen, setIsCreateAssetOpen] = useState(false);
  const [isEditAssetOpen, setIsEditAssetOpen] = useState(false);
  const [isCreateMovementOpen, setIsCreateMovementOpen] = useState(false);
  const [isCreateLocationOpen, setIsCreateLocationOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isCreateUnitsOpen, setIsCreateUnitsOpen] = useState(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [isCloseAssignmentOpen, setIsCloseAssignmentOpen] = useState(false);
  const [isUnitStatusOpen, setIsUnitStatusOpen] = useState(false);
  const [isGlobalAssignmentFlow, setIsGlobalAssignmentFlow] = useState(false);
  const [movementReasonFocusIndex, setMovementReasonFocusIndex] = useState(0);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editingAssetTypeId, setEditingAssetTypeId] = useState(null);
  const [editingLocationTypeId, setEditingLocationTypeId] = useState(null);
  const [activeCatalogTab, setActiveCatalogTab] = useState('asset_types');
  const [catalogAssetTypeQuery, setCatalogAssetTypeQuery] = useState('');
  const [catalogLocationTypeQuery, setCatalogLocationTypeQuery] = useState('');
  const createAssetTriggerRef = useRef(null);
  const createMovementTriggerRef = useRef(null);
  const createLocationTriggerRef = useRef(null);
  const catalogTriggerRef = useRef(null);
  const catalogAssetTabRef = useRef(null);
  const catalogLocationTabRef = useRef(null);
  const createAssetTypeSelectRef = useRef(null);
  const createMovementTypeSelectRef = useRef(null);
  const createLocationTypeSelectRef = useRef(null);
  const movementReasonTemplateFirstRef = useRef(null);
  const movementReasonChipRefs = useRef([]);
  const catalogAssetTypeNameRef = useRef(null);
  const catalogLocationTypeNameRef = useRef(null);
  const pendingCatalogEditorFocusRef = useRef(null);
  const createUnitLocationSelectRef = useRef(null);
  const createAssignmentUnitSelectRef = useRef(null);
  const createAssignmentTriggerRef = useRef(null);
  const closeAssignmentUnitSelectRef = useRef(null);
  const editAssetNameRef = useRef(null);
  const unitStatusLocationSelectRef = useRef(null);
  const unitStatusReasonRef = useRef(null);
  const assetDetailCloseButtonRef = useRef(null);
  const assetDetailTriggerRef = useRef(null);
  const shouldAutoFocusAssetDetailRef = useRef(false);
  const [catalogAssetTypes, setCatalogAssetTypes] = useState([]);
  const [catalogLocationTypes, setCatalogLocationTypes] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [unitAssignments, setUnitAssignments] = useState([]);
  const [assetEditForm, setAssetEditForm] = useState(defaultAssetEditForm);
  const [unitStatusForm, setUnitStatusForm] = useState(defaultUnitStatusForm);
  const [assetTypeForm, setAssetTypeForm] = useState(defaultCatalogAssetTypeForm);
  const [locationTypeForm, setLocationTypeForm] = useState(defaultCatalogLocationTypeForm);
  const [unitLines, setUnitLines] = useState([defaultUnitLine]);
  const [assignmentForm, setAssignmentForm] = useState(defaultAssignmentForm);
  const [assignmentCloseForm, setAssignmentCloseForm] = useState(defaultAssignmentCloseForm);

  const [assetForm, setAssetForm] = useState({
    asset_type_id: '',
    asset_name: '',
    brand: '',
    model: '',
    min_quantity: '0',
    description: '',
    reason: 'Alta inicial por operación de Sistemas.'
  });

  const [movementForm, setMovementForm] = useState({
    movement_type_key: '',
    reason: '',
    happened_at: '',
    lines: [defaultMovementLine]
  });

  const [locationForm, setLocationForm] = useState({
    location_type_id: '',
    name: '',
    location_key: '',
    parent_location_id: '',
    description: '',
    status: 'active'
  });

  const [isSubmittingAsset, setIsSubmittingAsset] = useState(false);
  const [isSubmittingAssetEdit, setIsSubmittingAssetEdit] = useState(false);
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);
  const [isSubmittingLocation, setIsSubmittingLocation] = useState(false);
  const [isSubmittingCatalogAssetType, setIsSubmittingCatalogAssetType] = useState(false);
  const [isSubmittingCatalogLocationType, setIsSubmittingCatalogLocationType] = useState(false);
  const [isSubmittingUnits, setIsSubmittingUnits] = useState(false);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [isSubmittingAssignmentClose, setIsSubmittingAssignmentClose] = useState(false);
  const [isSubmittingUnitStatus, setIsSubmittingUnitStatus] = useState(false);
  const activeCatalogTabCopy = catalogTabCopy[activeCatalogTab] || catalogTabCopy.asset_types;
  const filteredCatalogAssetTypes = useMemo(() => {
    const query = String(catalogAssetTypeQuery || '').trim().toLowerCase();
    if (!query) {
      return catalogAssetTypes;
    }

    return catalogAssetTypes.filter((assetType) => (
      String(assetType?.name || '').toLowerCase().includes(query)
      || String(assetType?.code_prefix || '').toLowerCase().includes(query)
      || String(assetType?.category_name || '').toLowerCase().includes(query)
      || String(assetType?.default_tracking_mode_name || assetType?.default_tracking_mode_key || '').toLowerCase().includes(query)
    ));
  }, [catalogAssetTypeQuery, catalogAssetTypes]);
  const filteredCatalogLocationTypes = useMemo(() => {
    const query = String(catalogLocationTypeQuery || '').trim().toLowerCase();
    if (!query) {
      return catalogLocationTypes;
    }

    return catalogLocationTypes.filter((locationType) => (
      String(locationType?.name || '').toLowerCase().includes(query)
      || String(locationType?.code_prefix || '').toLowerCase().includes(query)
      || String(locationType?.description || '').toLowerCase().includes(query)
    ));
  }, [catalogLocationTypeQuery, catalogLocationTypes]);

  const applyAuthFallback = (error) => {
    if (!isInventoryAuthError(error) && !isCollaboratorAuthError(error)) {
      return false;
    }
    clearSession();
    navigate('/login', { replace: true, state: { from: '/inventory' } });
    return true;
  };

  const handleViewChange = (nextView) => {
    const resolvedView = resolveInventoryView(nextView);
    const nextParams = new URLSearchParams(searchParams);
    if (resolvedView === 'assets') {
      nextParams.delete('view');
    } else {
      nextParams.set('view', resolvedView);
    }

    setSearchParams(nextParams, { replace: true });
  };

  const loadCoreData = async () => {
    setIsLoadingScreen(true);
    setScreenError('');
    try {
      const [catalogData, assetsData, locationsData, movementsData, assignmentsData, assignableUnitsData, collaboratorsData, assetTypesData, locationTypesData] = await Promise.all([
        getInventoryCatalog(),
        listAssets(),
        listLocations(),
        listInventoryMovements({ limit: 140 }),
        listAssetAssignments(),
        canAssignInventory ? listInventoryAssetUnits({ status: 'available' }) : Promise.resolve([]),
        canAssignInventory ? listCollaborators({ status: 'active' }) : Promise.resolve([]),
        canManageCatalog ? listCatalogAssetTypes({ includeInactive: true }) : Promise.resolve([]),
        canManageCatalog ? listCatalogLocationTypes({ includeInactive: true }) : Promise.resolve([])
      ]);
      setCatalog(catalogData);
      setAssets(Array.isArray(assetsData) ? assetsData : []);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
      setMovements(Array.isArray(movementsData) ? movementsData : []);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setAssignableUnits(Array.isArray(assignableUnitsData) ? assignableUnitsData : []);
      setCollaborators(Array.isArray(collaboratorsData) ? collaboratorsData : []);
      setCatalogAssetTypes(Array.isArray(assetTypesData) ? assetTypesData : []);
      setCatalogLocationTypes(Array.isArray(locationTypesData) ? locationTypesData : []);
    } catch (error) {
      if (applyAuthFallback(error)) return;
      setScreenError(normalizeErrorMessage(error, `${inventoryLoadErrorTitle}.`));
    } finally {
      setIsLoadingScreen(false);
    }
  };

  useEffect(() => {
    void loadCoreData();
  }, [canAssignInventory, canManageCatalog]);

  const reloadCatalogAdminData = async () => {
    if (!canManageCatalog) {
      setCatalogAssetTypes([]);
      setCatalogLocationTypes([]);
      return;
    }

    const [assetTypesData, locationTypesData] = await Promise.all([
      listCatalogAssetTypes({ includeInactive: true }),
      listCatalogLocationTypes({ includeInactive: true })
    ]);

    setCatalogAssetTypes(Array.isArray(assetTypesData) ? assetTypesData : []);
    setCatalogLocationTypes(Array.isArray(locationTypesData) ? locationTypesData : []);
  };

  useEffect(() => {
    if (!selectedAssetId) {
      setAssetDetail(null);
      return;
    }

    let isMounted = true;
    const loadDetail = async () => {
      setIsLoadingAssetDetail(true);
      try {
        const detail = await getAssetDetail(selectedAssetId, { movementLimit: 80 });
        if (isMounted) {
          setAssetDetail(detail);
        }
      } catch (error) {
        if (applyAuthFallback(error)) return;
        if (isMounted) {
          setActionError(normalizeErrorMessage(error, 'No fue posible cargar el detalle del activo.'));
          setAssetDetail(null);
        }
      } finally {
        if (isMounted) setIsLoadingAssetDetail(false);
      }
    };
    void loadDetail();
    return () => {
      isMounted = false;
    };
  }, [selectedAssetId]);

  useEffect(() => {
    if (!isCloseAssignmentOpen || !assignmentCloseForm.asset_unit_id) {
      return;
    }

    void loadAssignmentsForUnit(assignmentCloseForm.asset_unit_id);
  }, [assignmentCloseForm.asset_unit_id, isCloseAssignmentOpen]);

  const trackingModeOptions = useMemo(() => ([
    { key: 'all', label: 'Todos los modos' },
    ...catalog.tracking_modes.map((mode) => ({ key: mode.mode_key, label: mode.name }))
  ]), [catalog.tracking_modes]);

  const assetTypeFieldOptions = useMemo(() => ([
    { key: '', label: 'Seleccionar' },
    ...catalog.types.map((type) => ({ key: String(type.id), label: type.name }))
  ]), [catalog.types]);

  const movementTypeFieldOptions = useMemo(() => ([
    { key: '', label: 'Seleccionar' },
    ...catalog.movement_types.map((movementType) => ({
      key: movementType.movement_type_key,
      label: movementType.name
    }))
  ]), [catalog.movement_types]);

  const assetFieldOptions = useMemo(() => ([
    { key: '', label: 'Seleccionar' },
    ...assets.map((asset) => ({ key: String(asset.id), label: asset.asset_name }))
  ]), [assets]);

  const locationFieldOptions = useMemo(() => ([
    { key: '', label: 'Sin ubicación' },
    ...locations.map((location) => ({ key: String(location.id), label: location.name }))
  ]), [locations]);

  const fromLocationFieldOptions = useMemo(() => ([
    { key: '', label: 'Sin ubicación de origen' },
    ...locations.map((location) => ({ key: String(location.id), label: location.name }))
  ]), [locations]);

  const toLocationFieldOptions = useMemo(() => ([
    { key: '', label: 'Sin ubicación de destino' },
    ...locations.map((location) => ({ key: String(location.id), label: location.name }))
  ]), [locations]);

  const locationTypeFieldOptions = useMemo(() => ([
    { key: '', label: 'Seleccionar' },
    ...catalog.location_types.map((locationType) => ({
      key: String(locationType.id),
      label: locationType.name
    }))
  ]), [catalog.location_types]);

  const locationStatusFieldOptions = useMemo(() => ([
    { key: 'active', label: 'Activa' },
    { key: 'inactive', label: 'Inactiva' }
  ]), []);

  const assetTypeCodePreview = useMemo(() => {
    const prefix = normalizeCodePrefixPreview(assetTypeForm.code_prefix, 'LAP');
    return `Genera INV-${prefix}-001 y UNI-${prefix}-001-A.`;
  }, [assetTypeForm.code_prefix]);

  const locationTypeCodePreview = useMemo(() => {
    const prefix = normalizeCodePrefixPreview(locationTypeForm.code_prefix, 'ALM');
    return `Genera LOC-${prefix}-PRINCIPAL.`;
  }, [locationTypeForm.code_prefix]);

  const selectedLocationTypePrefix = useMemo(() => {
    const selectedType = catalog.location_types.find((locationType) => String(locationType.id) === String(locationForm.location_type_id));
    return normalizeCodePrefixPreview(selectedType?.code_prefix, 'ALM');
  }, [catalog.location_types, locationForm.location_type_id]);

  const locationKeyCodePreview = useMemo(() => {
    const locationKey = normalizeLocationKeyPreview(locationForm.location_key, 'PRINCIPAL');
    return `Genera LOC-${selectedLocationTypePrefix}-${locationKey}.`;
  }, [locationForm.location_key, selectedLocationTypePrefix]);

  const categoryFieldOptions = useMemo(() => ([
    { key: '', label: 'Seleccionar' },
    ...catalog.categories.map((category) => ({
      key: String(category.id),
      label: category.name
    }))
  ]), [catalog.categories]);

  const trackingModeCatalogFieldOptions = useMemo(() => ([
    { key: '', label: 'Seleccionar' },
    ...catalog.tracking_modes.map((mode) => ({
      key: String(mode.id),
      label: mode.name
    }))
  ]), [catalog.tracking_modes]);

  const unitStatusFieldOptions = useMemo(() => (
    catalog.unit_statuses.map((status) => ({
      key: status.status_key,
      label: status.name
    }))
  ), [catalog.unit_statuses]);

  const parentLocationFieldOptions = useMemo(() => ([
    { key: '', label: 'Raíz' },
    ...locations
      .filter((location) => Number(location.id) !== Number(editingLocationId))
      .map((location) => ({ key: String(location.id), label: location.name }))
  ]), [editingLocationId, locations]);

  const collaboratorFieldOptions = useMemo(() => ([
    { key: '', label: 'Seleccionar' },
    ...collaborators.map((collaborator) => ({
      key: String(collaborator.id),
      label: `${collaborator.employee_id} · ${collaborator.full_name}`
    }))
  ]), [collaborators]);

  const collaboratorFilterOptions = useMemo(() => ([
    { key: 'all', label: 'Todos los colaboradores' },
    ...collaborators.map((collaborator) => ({
      key: String(collaborator.id),
      label: `${collaborator.employee_id} · ${collaborator.full_name}`
    }))
  ]), [collaborators]);

  const selectedAssetTypeForForm = useMemo(() => (
    catalog.types.find((type) => String(type.id) === assetForm.asset_type_id) || null
  ), [assetForm.asset_type_id, catalog.types]);

  const assetFormTrackingModeKey = selectedAssetTypeForForm?.default_tracking_mode_key || '';
  const shouldShowAssetMinQuantity = assetFormTrackingModeKey === 'stock';

  const filteredAssets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return assets.filter((asset) => {
      if (assetStatusFilter !== 'all' && asset.operational_status_key !== assetStatusFilter) return false;
      if (trackingModeFilter !== 'all' && asset.tracking_mode_key !== trackingModeFilter) return false;
      if (!normalizedSearch) return true;
      const searchable = [
        asset.asset_name,
        asset.internal_code,
        asset.type_name,
        asset.category_name,
        asset.operational_status_name,
        asset.brand,
        asset.model
      ].join(' ').toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [assets, assetStatusFilter, searchTerm, trackingModeFilter]);

  const filteredAssignments = useMemo(() => {
    const normalizedSearch = assignmentsSearchTerm.trim().toLowerCase();

    return assignments.filter((assignment) => {
      if (assignmentStatusFilter !== 'all' && assignment.status !== assignmentStatusFilter) {
        return false;
      }

      if (assignmentCollaboratorFilter !== 'all' && Number(assignment.collaborator?.id) !== Number(assignmentCollaboratorFilter)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        assignment.asset?.asset_name,
        assignment.asset?.internal_code,
        assignment.asset?.type_name,
        assignment.asset_unit?.asset_tag,
        assignment.asset_unit?.serial_number,
        assignment.collaborator?.full_name,
        assignment.collaborator?.employee_id,
        assignment.collaborator?.area_name,
        assignment.location?.name,
        assignment.location?.code,
        assignment.delivery_condition,
        assignment.return_condition,
        assignment.notes
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [assignmentCollaboratorFilter, assignmentStatusFilter, assignments, assignmentsSearchTerm]);

  const filteredMovements = useMemo(() => {
    const normalizedSearch = movementsSearchTerm.trim().toLowerCase();

    return movements.filter((movement) => {
      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        movement.asset_name,
        movement.movement_type_name,
        movement.direction,
        toMovementDirectionLabel(movement.direction),
        movement.reason,
        movement.operator_name,
        formatDateTime(movement.happened_at)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [movements, movementsSearchTerm]);

  const normalizedLocations = useMemo(() => (
    locations.map((location) => ({
      ...location,
      name: normalizePotentialMojibake(location.name),
      code: normalizePotentialMojibake(location.code),
      location_type_name: normalizePotentialMojibake(location.location_type_name),
      parent_location_name: normalizePotentialMojibake(location.parent_location_name),
      description: normalizePotentialMojibake(location.description)
    }))
  ), [locations]);

  const filteredLocations = useMemo(() => {
    const normalizedSearch = locationsSearchTerm.trim().toLowerCase();

    return normalizedLocations.filter((location) => {
      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        location.name,
        location.code,
        location.location_type_name,
        location.parent_location_name,
        location.description,
        toStatusLabel(location.status)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [normalizedLocations, locationsSearchTerm]);

  const locationById = useMemo(() => {
    const map = new Map();
    normalizedLocations.forEach((location) => {
      map.set(Number(location.id), location);
    });
    return map;
  }, [normalizedLocations]);

  const locationVisibleIds = useMemo(() => {
    if (!locationsSearchTerm.trim()) {
      return new Set(normalizedLocations.map((location) => Number(location.id)));
    }

    const visibleIds = new Set();

    filteredLocations.forEach((location) => {
      let current = location;
      while (current) {
        const currentId = Number(current.id);
        if (visibleIds.has(currentId)) {
          break;
        }
        visibleIds.add(currentId);
        current = current.parent_location_id
          ? (locationById.get(Number(current.parent_location_id)) || null)
          : null;
      }
    });

    return visibleIds;
  }, [filteredLocations, locationById, locationsSearchTerm, normalizedLocations]);

  const visibleLocationTree = useMemo(() => {
    const visibleLocations = normalizedLocations.filter((location) => locationVisibleIds.has(Number(location.id)));
    return buildLocationTree(visibleLocations);
  }, [locationVisibleIds, normalizedLocations]);

  const visibleLocationRows = useMemo(() => (
    flattenLocationTree(visibleLocationTree, expandedLocationIds, Boolean(locationsSearchTerm.trim()))
  ), [expandedLocationIds, locationsSearchTerm, visibleLocationTree]);

  const assetsTotalPages = Math.max(1, Math.ceil(filteredAssets.length / assetsItemsPerPage));
  const resolvedAssetsPage = Math.min(assetsCurrentPage, assetsTotalPages);
  const assetsPageStart = (resolvedAssetsPage - 1) * assetsItemsPerPage;
  const paginatedAssets = filteredAssets.slice(assetsPageStart, assetsPageStart + assetsItemsPerPage);

  const movementsTotalPages = Math.max(1, Math.ceil(filteredMovements.length / movementsItemsPerPage));
  const resolvedMovementsPage = Math.min(movementsCurrentPage, movementsTotalPages);
  const movementsPageStart = (resolvedMovementsPage - 1) * movementsItemsPerPage;
  const paginatedMovements = filteredMovements.slice(movementsPageStart, movementsPageStart + movementsItemsPerPage);

  const assignmentsTotalPages = Math.max(1, Math.ceil(filteredAssignments.length / assignmentsItemsPerPage));
  const resolvedAssignmentsPage = Math.min(assignmentsCurrentPage, assignmentsTotalPages);
  const assignmentsPageStart = (resolvedAssignmentsPage - 1) * assignmentsItemsPerPage;
  const paginatedAssignments = filteredAssignments.slice(assignmentsPageStart, assignmentsPageStart + assignmentsItemsPerPage);

  useEffect(() => {
    setAssetsCurrentPage(1);
  }, [searchTerm, assetStatusFilter, trackingModeFilter]);

  useEffect(() => {
    setMovementsCurrentPage(1);
  }, [movementsItemsPerPage, movementsSearchTerm]);

  useEffect(() => {
    setAssignmentsCurrentPage(1);
  }, [assignmentCollaboratorFilter, assignmentStatusFilter, assignmentsItemsPerPage, assignmentsSearchTerm]);

  useEffect(() => {
    const validIds = new Set(normalizedLocations.map((location) => Number(location.id)));
    const rootIds = normalizedLocations
      .filter((location) => !location.parent_location_id)
      .map((location) => Number(location.id));

    setExpandedLocationIds((current) => {
      const next = new Set([...current].filter((locationId) => validIds.has(locationId)));
      if (next.size === 0) {
        rootIds.forEach((locationId) => next.add(locationId));
      }
      return next;
    });
  }, [normalizedLocations]);

  const resetActionFeedback = () => {
    setActionError('');
    setActionSuccess('');
  };

  const openAssetDetail = (assetId, triggerElement, options = {}) => {
    const { shouldAutoFocus = false } = options;

    if (triggerElement instanceof HTMLElement) {
      assetDetailTriggerRef.current = triggerElement;
    }

    shouldAutoFocusAssetDetailRef.current = Boolean(shouldAutoFocus);
    setActionError('');
    setSelectedAssetId(Number(assetId));
    setActiveDetailTab('summary');
  };

  const openAssetFromAssignment = (assignment, triggerElement) => {
    const assetId = Number(assignment?.asset?.id || 0);
    if (!assetId) {
      return;
    }

    setSearchTerm('');
    setAssetStatusFilter('all');
    setTrackingModeFilter('all');
    handleViewChange('assets');
    openAssetDetail(assetId, triggerElement);
  };

  const closeAssetDetail = (shouldRestoreFocus = true) => {
    setAssetDetail(null);
    setIsLoadingAssetDetail(false);
    setSelectedAssetId(null);
    setActiveDetailTab('summary');
    shouldAutoFocusAssetDetailRef.current = false;

    if (shouldRestoreFocus) {
      window.requestAnimationFrame(() => {
        assetDetailTriggerRef.current?.focus();
      });
    }
  };

  const reloadAssets = async ({ preserveSelection = true } = {}) => {
    const assetsData = await listAssets({
      search: searchTerm,
      operationalStatus: assetStatusFilter === 'all' ? '' : assetStatusFilter,
      trackingModeKey: trackingModeFilter === 'all' ? '' : trackingModeFilter
    });
    setAssets(Array.isArray(assetsData) ? assetsData : []);

    if (!preserveSelection) {
      return;
    }
    if (selectedAssetId == null) {
      return;
    }
    const stillExists = assetsData.some((asset) => Number(asset.id) === Number(selectedAssetId));
    if (!stillExists) {
      setSelectedAssetId(assetsData?.[0]?.id ? Number(assetsData[0].id) : null);
    }
  };

  const reloadAssignments = async () => {
    const assignmentsData = await listAssetAssignments();
    setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
  };

  const reloadAssignableUnits = async () => {
    if (!canAssignInventory) {
      setAssignableUnits([]);
      return;
    }

    const unitsData = await listInventoryAssetUnits({ status: 'available' });
    setAssignableUnits(Array.isArray(unitsData) ? unitsData : []);
  };

  const reloadSelectedAssetDetail = async () => {
    if (!selectedAssetId) {
      return;
    }

    const detail = await getAssetDetail(selectedAssetId, { movementLimit: 80 });
    setAssetDetail(detail);
  };

  const loadAssignmentsForUnit = async (assetUnitId) => {
    const normalizedUnitId = normalizeOptionalNumber(assetUnitId);
    if (!normalizedUnitId) {
      setUnitAssignments([]);
      return [];
    }

    const assignmentsData = await listAssetAssignments({
      assetUnitId: normalizedUnitId
    });
    const resolvedAssignments = Array.isArray(assignmentsData) ? assignmentsData : [];
    setUnitAssignments(resolvedAssignments);
    return resolvedAssignments;
  };

  const openCatalogModal = () => {
    if (!canManageCatalog) {
      return;
    }

    resetActionFeedback();
    setActiveCatalogTab('asset_types');
    setCatalogAssetTypeQuery('');
    setCatalogLocationTypeQuery('');
    setEditingAssetTypeId(null);
    setEditingLocationTypeId(null);
    setAssetTypeForm(defaultCatalogAssetTypeForm);
    setLocationTypeForm(defaultCatalogLocationTypeForm);
    setIsCatalogModalOpen(true);
  };

  const scheduleCatalogEditorFocus = (tabKey, selectContent = false) => {
    pendingCatalogEditorFocusRef.current = { tabKey, selectContent };
  };

  useEffect(() => {
    if (!isCatalogModalOpen || !pendingCatalogEditorFocusRef.current) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      const nextFocus = pendingCatalogEditorFocusRef.current;
      const target = nextFocus?.tabKey === 'location_types'
        ? catalogLocationTypeNameRef.current
        : catalogAssetTypeNameRef.current;

      target?.focus?.();
      if (nextFocus?.selectContent && typeof target?.select === 'function') {
        target.select();
      }
      pendingCatalogEditorFocusRef.current = null;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeCatalogTab, editingAssetTypeId, editingLocationTypeId, isCatalogModalOpen]);

  useEffect(() => {
    if (!isCreateMovementOpen) {
      return;
    }

    setMovementReasonFocusIndex(0);
  }, [isCreateMovementOpen]);

  const handleCatalogTabChange = (nextTabKey) => {
    setActiveCatalogTab(nextTabKey);

    if (nextTabKey === 'asset_types') {
      setCatalogLocationTypeQuery('');
      setEditingLocationTypeId(null);
      setLocationTypeForm(defaultCatalogLocationTypeForm);
      return;
    }

    if (nextTabKey === 'location_types') {
      setCatalogAssetTypeQuery('');
      setEditingAssetTypeId(null);
      setAssetTypeForm(defaultCatalogAssetTypeForm);
    }
  };

  const openAssetTypeEdit = (assetType) => {
    setActiveCatalogTab('asset_types');
    setEditingAssetTypeId(Number(assetType.id));
    setAssetTypeForm({
      name: assetType.name || '',
      code_prefix: assetType.code_prefix || '',
      asset_category_id: String(assetType.asset_category_id || ''),
      default_tracking_mode_id: String(assetType.default_tracking_mode_id || ''),
      description: assetType.description || ''
    });
    setIsCatalogModalOpen(true);
    scheduleCatalogEditorFocus('asset_types', true);
  };

  const resetAssetTypeEditor = () => {
    setEditingAssetTypeId(null);
    setAssetTypeForm(defaultCatalogAssetTypeForm);
    scheduleCatalogEditorFocus('asset_types');
  };

  const openLocationTypeEdit = (locationType) => {
    setActiveCatalogTab('location_types');
    setEditingLocationTypeId(Number(locationType.id));
    setLocationTypeForm({
      name: locationType.name || '',
      code_prefix: locationType.code_prefix || '',
      description: locationType.description || ''
    });
    setIsCatalogModalOpen(true);
    scheduleCatalogEditorFocus('location_types', true);
  };

  const resetLocationTypeEditor = () => {
    setEditingLocationTypeId(null);
    setLocationTypeForm(defaultCatalogLocationTypeForm);
    scheduleCatalogEditorFocus('location_types');
  };

  const openCreateUnitsModal = () => {
    if (!canCreateInventory || !detailAsset || detailAsset.tracking_mode_key !== 'unit') {
      return;
    }

    resetActionFeedback();
    setUnitLines([
      {
        ...defaultUnitLine,
        location_id: locations[0]?.id ? String(locations[0].id) : ''
      }
    ]);
    setIsCreateUnitsOpen(true);
  };

  const focusMovementReasonChip = (nextIndex) => {
    const clampedIndex = Math.max(0, Math.min(nextIndex, quickReasonTemplates.length - 1));
    setMovementReasonFocusIndex(clampedIndex);
    window.requestAnimationFrame(() => {
      movementReasonChipRefs.current[clampedIndex]?.focus?.();
    });
  };

  const handleMovementReasonKeyDown = (event, index) => {
    const nextIndex = getNextHorizontalTabIndex(quickReasonTemplates.length, index, event.key);
    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    focusMovementReasonChip(nextIndex);
  };

  const openCreateAssignmentModal = (assetUnitId = null, { useGlobal = false, triggerElement = null } = {}) => {
    if (!canAssignInventory) {
      return;
    }

    if (triggerElement instanceof HTMLElement) {
      createAssignmentTriggerRef.current = triggerElement;
    }

    const requestedUnitId = normalizeOptionalNumber(assetUnitId);
    const unitPool = useGlobal
      ? assignableUnits
      : selectedAssetUnits.filter((unit) => unit.status_key === 'available');
    const defaultUnit = requestedUnitId
      ? resolveAssignableUnit(requestedUnitId)
      : (unitPool[0] || null);

    if (!defaultUnit) {
      setActionError(useGlobal
        ? 'No hay unidades disponibles para generar un nuevo resguardo.'
        : 'Este activo no tiene unidades disponibles para asignar.');
      return;
    }

    resetActionFeedback();
    setIsGlobalAssignmentFlow(useGlobal);
    setAssignmentForm({
      ...defaultAssignmentForm,
      asset_unit_id: String(defaultUnit.id),
      location_id: defaultUnit.current_location_id ? String(defaultUnit.current_location_id) : ''
    });
    setIsCreateAssignmentOpen(true);
  };

  const openCloseAssignmentModal = async (assetUnitId = null) => {
    if (!canAssignInventory) {
      return;
    }

    const requestedUnitId = normalizeOptionalNumber(assetUnitId);
    const defaultUnit = requestedUnitId
      ? (
        selectedAssetUnits.find((unit) => Number(unit.id) === requestedUnitId)
        || assignments.find((assignment) => Number(assignment.asset_unit?.id) === requestedUnitId)
      )
      : (selectedAssetUnits.find((unit) => unit.status_key === 'assigned') || assignments.find((assignment) => assignment.status === 'active'));

    if (!defaultUnit) {
      setActionError('No hay unidades serializadas para cerrar resguardo.');
      return;
    }

    const resolvedUnitId = Number(defaultUnit.asset_unit?.id || defaultUnit.id || 0);
    const resolvedLocationId = Number(defaultUnit.location?.id || defaultUnit.current_location_id || 0);

    resetActionFeedback();
    setAssignmentCloseForm({
      ...defaultAssignmentCloseForm,
      asset_unit_id: String(resolvedUnitId),
      location_id: resolvedLocationId ? String(resolvedLocationId) : (locations[0]?.id ? String(locations[0].id) : ''),
      notes: ''
    });
    await loadAssignmentsForUnit(resolvedUnitId);
    setIsCloseAssignmentOpen(true);
  };

  const openEditAssetModal = () => {
    if (!detailAsset || !canUpdateInventory) {
      return;
    }

    resetActionFeedback();
    setAssetEditForm({
      asset_name: detailAsset.asset_name || '',
      brand: detailAsset.brand || '',
      model: detailAsset.model || '',
      min_quantity: String(detailAsset.min_quantity ?? 0),
      description: detailAsset.description || '',
      reason: 'Actualización del activo por operación de Sistemas.'
    });
    setIsEditAssetOpen(true);
  };

  const openUnitStatusModal = (unit, targetStatusKey) => {
    if (!unit || !canUpdateInventory) {
      return;
    }

    const nextReason = targetStatusKey === 'in_repair'
      ? 'Envío a reparación.'
      : targetStatusKey === 'retired'
        ? 'Baja operativa de la unidad.'
        : 'Retorno desde reparación.';

    resetActionFeedback();
    setUnitStatusForm({
      asset_unit_id: String(unit.id),
      status_key: targetStatusKey,
      location_id: targetStatusKey === 'available'
        ? (unit.current_location_id ? String(unit.current_location_id) : (locations[0]?.id ? String(locations[0].id) : ''))
        : (unit.current_location_id ? String(unit.current_location_id) : ''),
      happened_at: '',
      reason: nextReason,
      notes: ''
    });
    setIsUnitStatusOpen(true);
  };

  const handleSaveAssetType = async (event) => {
    event.preventDefault();
    resetActionFeedback();
    setIsSubmittingCatalogAssetType(true);

    try {
      const payload = {
        name: assetTypeForm.name,
        code_prefix: assetTypeForm.code_prefix,
        asset_category_id: normalizeOptionalNumber(assetTypeForm.asset_category_id),
        default_tracking_mode_id: normalizeOptionalNumber(assetTypeForm.default_tracking_mode_id),
        description: assetTypeForm.description
      };

      if (editingAssetTypeId) {
        await updateCatalogAssetType(editingAssetTypeId, payload);
      } else {
        await createCatalogAssetType(payload);
      }

      await Promise.all([loadCoreData(), reloadCatalogAdminData()]);
      setEditingAssetTypeId(null);
      setAssetTypeForm(defaultCatalogAssetTypeForm);
      setActionSuccess(editingAssetTypeId ? 'Tipo de activo actualizado correctamente.' : 'Tipo de activo creado correctamente.');
    } catch (error) {
      if (applyAuthFallback(error)) return;
      setActionError(normalizeErrorMessage(error, 'No fue posible guardar el tipo de activo.'));
    } finally {
      setIsSubmittingCatalogAssetType(false);
    }
  };

  const handleToggleAssetTypeActive = async (assetType) => {
    resetActionFeedback();
    try {
      if (assetType.is_active) {
        await deactivateCatalogAssetType(assetType.id);
      } else {
        await reactivateCatalogAssetType(assetType.id);
      }

      await Promise.all([loadCoreData(), reloadCatalogAdminData()]);
      setActionSuccess(assetType.is_active ? 'Tipo de activo desactivado correctamente.' : 'Tipo de activo reactivado correctamente.');
    } catch (error) {
      if (applyAuthFallback(error)) return;
      setActionError(normalizeErrorMessage(error, 'No fue posible actualizar el estado del tipo de activo.'));
    }
  };

  const handleSaveLocationType = async (event) => {
    event.preventDefault();
    resetActionFeedback();
    setIsSubmittingCatalogLocationType(true);

    try {
      const payload = {
        name: locationTypeForm.name,
        code_prefix: locationTypeForm.code_prefix,
        description: locationTypeForm.description
      };

      if (editingLocationTypeId) {
        await updateCatalogLocationType(editingLocationTypeId, payload);
      } else {
        await createCatalogLocationType(payload);
      }

      await Promise.all([loadCoreData(), reloadCatalogAdminData()]);
      setEditingLocationTypeId(null);
      setLocationTypeForm(defaultCatalogLocationTypeForm);
      setActionSuccess(editingLocationTypeId ? 'Tipo de ubicación actualizado correctamente.' : 'Tipo de ubicación creado correctamente.');
    } catch (error) {
      if (applyAuthFallback(error)) return;
      setActionError(normalizeErrorMessage(error, 'No fue posible guardar el tipo de ubicación.'));
    } finally {
      setIsSubmittingCatalogLocationType(false);
    }
  };

  const handleToggleLocationTypeActive = async (locationType) => {
    resetActionFeedback();
    try {
      if (locationType.is_active) {
        await deactivateCatalogLocationType(locationType.id);
      } else {
        await reactivateCatalogLocationType(locationType.id);
      }

      await Promise.all([loadCoreData(), reloadCatalogAdminData()]);
      setActionSuccess(locationType.is_active ? 'Tipo de ubicación desactivado correctamente.' : 'Tipo de ubicación reactivado correctamente.');
    } catch (error) {
      if (applyAuthFallback(error)) return;
      setActionError(normalizeErrorMessage(error, 'No fue posible actualizar el estado del tipo de ubicación.'));
    }
  };

  const handleCreateUnits = async (event) => {
    event.preventDefault();
    if (!detailAsset) {
      return;
    }

    resetActionFeedback();
    setIsSubmittingUnits(true);

    try {
      await createAssetUnits(detailAsset.id, {
        units: unitLines.map((line) => ({
          serial_number: line.serial_number || null,
          location_id: normalizeOptionalNumber(line.location_id),
          status_key: line.status_key,
          notes: line.notes || null
        }))
      });

      await Promise.all([
        reloadAssets({ preserveSelection: true }),
        reloadSelectedAssetDetail(),
        reloadAssignments(),
        reloadAssignableUnits()
      ]);
      setIsCreateUnitsOpen(false);
      setUnitLines([defaultUnitLine]);
      setActionSuccess('Unidades serializadas registradas correctamente.');
    } catch (error) {
      if (applyAuthFallback(error)) return;
      setActionError(normalizeErrorMessage(error, 'No fue posible registrar las unidades serializadas.'));
    } finally {
      setIsSubmittingUnits(false);
    }
  };

  const handleCreateAssignment = async (event) => {
    event.preventDefault();
    resetActionFeedback();
    setIsSubmittingAssignment(true);

    try {
      await createAssetAssignment({
        asset_unit_id: normalizeOptionalNumber(assignmentForm.asset_unit_id),
        collaborator_id: normalizeOptionalNumber(assignmentForm.collaborator_id),
        location_id: normalizeOptionalNumber(assignmentForm.location_id),
        assigned_at: assignmentForm.assigned_at || null,
        expected_return_at: assignmentForm.expected_return_at || null,
        delivery_condition: assignmentForm.delivery_condition || null,
        notes: assignmentForm.notes || null
      });

      await Promise.all([
        reloadAssets({ preserveSelection: true }),
        reloadSelectedAssetDetail(),
        reloadAssignments(),
        reloadAssignableUnits()
      ]);
      await loadAssignmentsForUnit(assignmentForm.asset_unit_id);
      setIsCreateAssignmentOpen(false);
      setIsGlobalAssignmentFlow(false);
      setAssignmentForm(defaultAssignmentForm);
      setActionSuccess('Resguardo registrado correctamente.');
    } catch (error) {
      if (applyAuthFallback(error)) return;
      setActionError(normalizeErrorMessage(error, 'No fue posible registrar el resguardo.'));
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const handleCloseAssignment = async (event) => {
    event.preventDefault();
    resetActionFeedback();

    const activeAssignment = unitAssignments.find((assignment) => assignment.status === 'active');
    if (!activeAssignment) {
      setActionError('La unidad seleccionada no tiene un resguardo activo.');
      return;
    }

    setIsSubmittingAssignmentClose(true);

    try {
      await closeAssetAssignment(activeAssignment.id, {
        location_id: normalizeOptionalNumber(assignmentCloseForm.location_id),
        returned_at: assignmentCloseForm.returned_at || null,
        return_condition: assignmentCloseForm.return_condition || null,
        notes: assignmentCloseForm.notes || null
      });

      await Promise.all([
        reloadAssets({ preserveSelection: true }),
        reloadSelectedAssetDetail(),
        reloadAssignments(),
        reloadAssignableUnits()
      ]);
      await loadAssignmentsForUnit(assignmentCloseForm.asset_unit_id);
      setIsCloseAssignmentOpen(false);
      setAssignmentCloseForm(defaultAssignmentCloseForm);
      setActionSuccess('Resguardo cerrado correctamente.');
    } catch (error) {
      if (applyAuthFallback(error)) return;
      setActionError(normalizeErrorMessage(error, 'No fue posible cerrar el resguardo.'));
    } finally {
      setIsSubmittingAssignmentClose(false);
    }
  };

  const handleUpdateAsset = async (event) => {
    event.preventDefault();
    if (!detailAsset) {
      return;
    }

    resetActionFeedback();
    setIsSubmittingAssetEdit(true);

    try {
      await updateAsset(detailAsset.id, {
        asset_name: assetEditForm.asset_name,
        brand: assetEditForm.brand || null,
        model: assetEditForm.model || null,
        min_quantity: detailAsset.tracking_mode_key === 'stock'
          ? (normalizeOptionalDecimal(assetEditForm.min_quantity) ?? 0)
          : 0,
        description: assetEditForm.description || null,
        reason: assetEditForm.reason || null
      });

      await Promise.all([
        reloadAssets({ preserveSelection: true }),
        reloadSelectedAssetDetail(),
        reloadAssignments()
      ]);
      setIsEditAssetOpen(false);
      setActionSuccess('Activo actualizado correctamente.');
    } catch (error) {
      if (applyAuthFallback(error)) return;
      setActionError(normalizeErrorMessage(error, 'No fue posible actualizar el activo.'));
    } finally {
      setIsSubmittingAssetEdit(false);
    }
  };

  const handleUpdateUnitStatus = async (event) => {
    event.preventDefault();
    resetActionFeedback();
    setIsSubmittingUnitStatus(true);

    try {
      await updateAssetUnitStatus(unitStatusForm.asset_unit_id, {
        status_key: unitStatusForm.status_key,
        location_id: normalizeOptionalNumber(unitStatusForm.location_id),
        happened_at: unitStatusForm.happened_at || null,
        reason: unitStatusForm.reason,
        notes: unitStatusForm.notes || null
      });

      await Promise.all([
        reloadAssets({ preserveSelection: true }),
        reloadSelectedAssetDetail(),
        reloadAssignments(),
        reloadAssignableUnits()
      ]);
      setIsUnitStatusOpen(false);
      setUnitStatusForm(defaultUnitStatusForm);
      setActionSuccess('Estado de la unidad actualizado correctamente.');
    } catch (error) {
      if (applyAuthFallback(error)) return;
      setActionError(normalizeErrorMessage(error, 'No fue posible actualizar el estado de la unidad.'));
    } finally {
      setIsSubmittingUnitStatus(false);
    }
  };

  const handleCreateAsset = async (event) => {
    event.preventDefault();
    resetActionFeedback();

    if (!assetForm.asset_type_id) {
      setActionError('Selecciona un tipo de activo.');
      return;
    }

    setIsSubmittingAsset(true);
    try {
      await createAsset({
        asset_type_id: normalizeOptionalNumber(assetForm.asset_type_id),
        asset_name: assetForm.asset_name,
        brand: assetForm.brand,
        model: assetForm.model,
        min_quantity: shouldShowAssetMinQuantity ? (normalizeOptionalDecimal(assetForm.min_quantity) ?? 0) : 0,
        description: assetForm.description,
        reason: assetForm.reason || null
      });
      await Promise.all([
        reloadAssets({ preserveSelection: false }),
        listInventoryMovements({ limit: 140 }).then((data) => setMovements(Array.isArray(data) ? data : []))
      ]);
      setIsCreateAssetOpen(false);
      setAssetForm({
        asset_type_id: '',
        asset_name: '',
        brand: '',
        model: '',
        min_quantity: '0',
        description: '',
        reason: 'Alta inicial por operación de Sistemas.'
      });
      setActionSuccess('Activo creado correctamente.');
    } catch (error) {
      if (applyAuthFallback(error)) return;
      setActionError(normalizeErrorMessage(error, 'No fue posible crear el activo.'));
    } finally {
      setIsSubmittingAsset(false);
    }
  };

  const handleCreateMovement = async (event) => {
    event.preventDefault();
    resetActionFeedback();

    if (!movementForm.movement_type_key) {
      setActionError('Selecciona un tipo de movimiento.');
      return;
    }

    if (movementForm.lines.some((line) => !line.asset_id)) {
      setActionError('Selecciona un activo en cada línea del movimiento.');
      return;
    }

    setIsSubmittingMovement(true);
    try {
      await registerInventoryMovement({
        movement_type_key: movementForm.movement_type_key,
        reason: movementForm.reason,
        happened_at: movementForm.happened_at || null,
        lines: movementForm.lines.map((line) => ({
          asset_id: normalizeOptionalNumber(line.asset_id),
          quantity: normalizeOptionalDecimal(line.quantity),
          from_location_id: normalizeOptionalNumber(line.from_location_id),
          to_location_id: normalizeOptionalNumber(line.to_location_id),
          notes: line.notes || null
        }))
      });
      await Promise.all([
        reloadAssets({ preserveSelection: true }),
        listInventoryMovements({ limit: 140 }).then((data) => setMovements(Array.isArray(data) ? data : [])),
        selectedAssetId ? getAssetDetail(selectedAssetId, { movementLimit: 80 }).then(setAssetDetail) : Promise.resolve()
      ]);
      setIsCreateMovementOpen(false);
      setMovementForm({
        movement_type_key: '',
        reason: '',
        happened_at: '',
        lines: [defaultMovementLine]
      });
      setActionSuccess('Movimiento registrado correctamente.');
    } catch (error) {
      if (applyAuthFallback(error)) return;
      setActionError(normalizeErrorMessage(error, 'No fue posible registrar el movimiento.'));
    } finally {
      setIsSubmittingMovement(false);
    }
  };

  const handleSaveLocation = async (event) => {
    event.preventDefault();
    resetActionFeedback();

    if (!locationForm.location_type_id) {
      setActionError('Selecciona un tipo de ubicación.');
      return;
    }

    setIsSubmittingLocation(true);
    try {
      const payload = {
        location_type_id: normalizeOptionalNumber(locationForm.location_type_id),
        name: locationForm.name,
        location_key: locationForm.location_key,
        parent_location_id: normalizeOptionalNumber(locationForm.parent_location_id),
        description: locationForm.description,
        status: locationForm.status
      };
      if (editingLocationId) {
        await updateLocation(editingLocationId, payload);
      } else {
        await createLocation(payload);
      }
      const updatedLocations = await listLocations();
      setLocations(Array.isArray(updatedLocations) ? updatedLocations : []);
      setIsCreateLocationOpen(false);
      setEditingLocationId(null);
      setLocationForm({
        location_type_id: '',
        name: '',
        location_key: '',
        parent_location_id: '',
        description: '',
        status: 'active'
      });
      setActionSuccess(editingLocationId ? 'Ubicación actualizada correctamente.' : 'Ubicación creada correctamente.');
    } catch (error) {
      if (applyAuthFallback(error)) return;
      setActionError(normalizeErrorMessage(error, 'No fue posible guardar la ubicación.'));
    } finally {
      setIsSubmittingLocation(false);
    }
  };

  const openLocationCreate = () => {
    if (!canCreateInventory) {
      return;
    }

    setEditingLocationId(null);
    setLocationForm({
      location_type_id: catalog.location_types[0]?.id ? String(catalog.location_types[0].id) : '',
      name: '',
      location_key: '',
      parent_location_id: '',
      description: '',
      status: 'active'
    });
    setIsCreateLocationOpen(true);
  };

  const openLocationEdit = (location) => {
    if (!canUpdateInventory) {
      return;
    }

    setEditingLocationId(Number(location.id));
    setLocationForm({
      location_type_id: String(location.location_type_id),
      name: location.name,
      location_key: String(location.code || '').split('-').slice(2).join('-'),
      parent_location_id: location.parent_location_id ? String(location.parent_location_id) : '',
      description: location.description || '',
      status: location.status || 'active'
    });
    setIsCreateLocationOpen(true);
  };

  const toggleLocationBranch = (locationId) => {
    setExpandedLocationIds((current) => {
      const next = new Set(current);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
  };

  const selectedAsset = useMemo(() => (
    assets.find((asset) => Number(asset.id) === Number(selectedAssetId)) || null
  ), [assets, selectedAssetId]);

  const detailAsset = selectedAssetId != null
    ? (assetDetail?.asset || selectedAsset)
    : null;
  const selectedAssetUnits = assetDetail?.units || [];
  const selectedAssetMovements = assetDetail?.movements || [];
  const availableAssetUnitsCount = selectedAssetUnits.filter((unit) => unit.status_key === 'available').length;
  const assignedAssetUnitsCount = selectedAssetUnits.filter((unit) => unit.status_key === 'assigned').length;
  const hasAvailableAssetUnits = selectedAssetUnits.some((unit) => unit.status_key === 'available');
  const hasAssignedAssetUnits = selectedAssetUnits.some((unit) => unit.status_key === 'assigned');
  const hasRepairingAssetUnits = selectedAssetUnits.some((unit) => unit.status_key === 'in_repair');
  const hasActionNotice = Boolean(actionError || actionSuccess);
  const recentSummaryMovements = selectedAssetMovements.slice(0, 3);
  const isAssetDetailPanelOpen = activeView === 'assets' && Boolean(detailAsset);
  const detailExistenceLabel = detailAsset
    ? (
      detailAsset.tracking_mode_key === 'stock'
        ? `${detailAsset.stock_quantity} unidades`
        : `${detailAsset.units_count} unidades`
    )
    : '0 unidades';
  const availableAssetUnitFieldOptions = useMemo(() => ([
    { key: '', label: 'Seleccionar' },
    ...selectedAssetUnits
      .filter((unit) => unit.status_key === 'available')
      .map((unit) => ({
        key: String(unit.id),
        label: `${unit.asset_tag} · ${unit.current_location_name || 'Sin ubicación'}`
      }))
  ]), [selectedAssetUnits]);

  const assignableAssetUnitFieldOptions = useMemo(() => ([
    { key: '', label: 'Seleccionar' },
    ...assignableUnits.map((unit) => ({
      key: String(unit.id),
      label: `${unit.asset_name || 'Activo'} · ${unit.asset_tag} · ${unit.current_location_name || 'Sin ubicación'}`
    }))
  ]), [assignableUnits]);

  const globalAssignedAssetUnitFieldOptions = useMemo(() => ([
    { key: '', label: 'Seleccionar' },
    ...assignments
      .filter((assignment) => assignment.status === 'active' && assignment.asset_unit?.id)
      .map((assignment) => ({
        key: String(assignment.asset_unit.id),
        label: `${assignment.asset_unit.asset_tag} · ${assignment.asset?.asset_name || 'Activo'}`
      }))
  ]), [assignments]);

  const selectedActiveAssignment = useMemo(() => (
    unitAssignments.find((assignment) => assignment.status === 'active') || null
  ), [unitAssignments]);

  const resolveAssignableUnit = (assetUnitId) => {
    const normalizedUnitId = normalizeOptionalNumber(assetUnitId);
    if (!normalizedUnitId) {
      return null;
    }

    return (
      selectedAssetUnits.find((unit) => Number(unit.id) === normalizedUnitId)
      || assignableUnits.find((unit) => Number(unit.id) === normalizedUnitId)
      || null
    );
  };

  const handleAssignmentUnitChange = (nextValue) => {
    const resolvedUnit = resolveAssignableUnit(nextValue);
    setAssignmentForm((current) => ({
      ...current,
      asset_unit_id: nextValue,
      location_id: resolvedUnit?.current_location_id ? String(resolvedUnit.current_location_id) : current.location_id
    }));
  };

  useEffect(() => {
    if (!isAssetDetailPanelOpen || !shouldAutoFocusAssetDetailRef.current) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      assetDetailCloseButtonRef.current?.focus();
      shouldAutoFocusAssetDetailRef.current = false;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isAssetDetailPanelOpen, selectedAssetId, activeDetailTab]);

  useEffect(() => {
    if (
      !isAssetDetailPanelOpen
      || isCreateAssetOpen
      || isEditAssetOpen
      || isCreateMovementOpen
      || isCreateLocationOpen
      || isCatalogModalOpen
      || isCreateUnitsOpen
      || isCreateAssignmentOpen
      || isCloseAssignmentOpen
      || isUnitStatusOpen
    ) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      closeAssetDetail();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAssetDetailPanelOpen,
    isCatalogModalOpen,
    isCloseAssignmentOpen,
    isCreateAssetOpen,
    isCreateAssignmentOpen,
    isCreateLocationOpen,
    isCreateMovementOpen,
    isCreateUnitsOpen,
    isEditAssetOpen,
    isUnitStatusOpen
  ]);

  useEffect(() => {
    if (!actionSuccess && !actionError) return undefined;
    const timeout = window.setTimeout(() => {
      setActionSuccess('');
      setActionError('');
    }, 4200);
    return () => window.clearTimeout(timeout);
  }, [actionSuccess, actionError]);

  return (
    <section className="workspace-page inventory-page" aria-label="Área de trabajo de inventario">
      <header className="workspace-page__header">
        <div className="workspace-page__heading">
          <h1 className="workspace-page__title">Inventario</h1>
        </div>
        <div className="workspace-page__header-actions">
          {canManageCatalog ? (
            <button
              type="button"
              className="workspace-action workspace-action--ghost"
              ref={catalogTriggerRef}
              onClick={openCatalogModal}
            >
              <Settings2 size={16} aria-hidden="true" />
              <span>Configurar catálogos</span>
            </button>
          ) : null}
          {canUpdateInventory ? (
            <button
              type="button"
              className="workspace-action workspace-action--ghost"
              ref={createMovementTriggerRef}
              onClick={() => {
                resetActionFeedback();
                setMovementForm((currentForm) => ({
                  ...currentForm,
                  lines: currentForm.lines.length > 0
                    ? currentForm.lines
                    : [{ ...defaultMovementLine, asset_id: selectedAssetId ? String(selectedAssetId) : '' }]
                }));
                setIsCreateMovementOpen(true);
              }}
            >
              <ArrowRightLeft size={16} aria-hidden="true" />
              <span>Registrar movimiento</span>
            </button>
          ) : null}
          {canCreateInventory ? (
            <button
              type="button"
              className="workspace-action workspace-action--primary"
              ref={createAssetTriggerRef}
              onClick={() => {
                resetActionFeedback();
                setIsCreateAssetOpen(true);
              }}
            >
              <PackagePlus size={16} aria-hidden="true" />
              <span>Nuevo activo</span>
            </button>
          ) : null}
        </div>
      </header>

      <section className="workspace-page__surface workspace-page__surface--operational">
        <div className="workspace-page__toolbar workspace-page__toolbar--operational">
          <SegmentedControl
            label="Vista operativa de inventario"
            options={inventoryViewOptions}
            activeKey={activeView}
            onActivate={handleViewChange}
            className="workspace-segmented workspace-page__view-segmented"
            buttonClassName="workspace-segmented__button"
            activeButtonClassName="workspace-segmented__button--active"
            idPrefix="inventory-view"
            panelIdByKey={(key) => `inventory-panel-${key}`}
          />
        </div>

        {hasActionNotice ? (
          <div className="workspace-page__notice-slot">
            {actionSuccess ? <InlineNotice tone="success">{actionSuccess}</InlineNotice> : null}
            {actionError ? <InlineNotice tone="error">{actionError}</InlineNotice> : null}
          </div>
        ) : null}

        {screenError ? (
          <EmptyState title={inventoryLoadErrorTitle} copy={screenError} id="inventory-state-error" role="region">
            <button type="button" className="workspace-action workspace-action--primary" onClick={() => void loadCoreData()}>
              Reintentar
            </button>
          </EmptyState>
        ) : null}

        {isLoadingScreen && !screenError ? (
          <section
            id={`inventory-panel-${activeView}`}
            role="tabpanel"
            aria-labelledby={`inventory-view-${activeView}`}
            className="workspace-panel"
          >
            <div className="workspace-panel__viewport workspace-panel__viewport--fixed">
              <OperationalPanel
                isLoading
                hasData={false}
                tone="neutral"
                loadingTitle={inventoryLoadingState.title}
                loadingCopy={inventoryLoadingState.copy}
                loadingRole="status"
                loadingAriaLive="polite"
                loadingAriaAtomic
                className="workspace-panel__viewport workspace-panel__viewport--flush"
                content={null}
                emptyTitle=""
                emptyCopy=""
              />
            </div>
          </section>
        ) : null}

        {!isLoadingScreen && !screenError ? (
          <>
            <section id="inventory-panel-assets" role="tabpanel" aria-labelledby="inventory-view-assets" hidden={activeView !== 'assets'} className="workspace-panel">
              <div className="workspace-page__control-row workspace-page__control-row--operational">
                <ToolbarSearchField
                  id="inventory-search"
                  name="inventory-search"
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Buscar por activo, código, tipo o marca..."
                  srLabel="Buscar activos"
                  className="workspace-search--operational"
                />
                <div className="workspace-page__filters workspace-page__filters--operational">
                  <FilterChipGroup
                    label="Filtro por estado"
                    options={assetStatusOptions}
                    activeKey={assetStatusFilter}
                    onSelect={setAssetStatusFilter}
                    className="workspace-chip-group workspace-chip-group--compact"
                    chipClassName="workspace-chip"
                    activeChipClassName="workspace-chip--active"
                  />
                  <FilterSelect
                    id="inventory-tracking-mode"
                    name="inventory_tracking_mode"
                    label="Modo"
                    showLabel={false}
                    value={trackingModeFilter}
                    options={trackingModeOptions}
                    onChange={setTrackingModeFilter}
                    className="filter-select filter-select--operational"
                  />
                </div>
              </div>

              <WorkspaceSplitLayout
                viewKey="list"
                detailOpen={isAssetDetailPanelOpen}
                className="inventory-layout"
                detailId={INVENTORY_ASSET_DETAIL_PANEL_ID}
                detailRole="complementary"
                detailAriaLabel="Panel contextual de detalle"
                detailAriaLabelledBy={INVENTORY_ASSET_DETAIL_TITLE_ID}
                main={(
                  <div className="workspace-panel__viewport workspace-panel__viewport--flush workspace-panel__viewport--fixed">
                    {filteredAssets.length === 0 ? (
                      <EmptyState title={inventoryAssetsNoResultsState.title} copy={inventoryAssetsNoResultsState.copy} id="inventory-assets-empty" role="region">
                        {canCreateInventory ? (
                          <button type="button" className="workspace-action workspace-action--primary" onClick={() => setIsCreateAssetOpen(true)}>
                            Nuevo activo
                          </button>
                        ) : null}
                      </EmptyState>
                    ) : (
                      <OperationalTable
                        className="inventory-assets-list"
                        ariaLabel="Listado de activos"
                        scrollClassName="data-table__scroll workspace-scroll-wrap--fill"
                        pagination={(
                          <PaginationBar
                            ariaLabel="Paginación de activos"
                            start={assetsPageStart + 1}
                            end={Math.min(assetsPageStart + assetsItemsPerPage, filteredAssets.length)}
                            total={filteredAssets.length}
                            pageSize={assetsItemsPerPage}
                            pageSizeOptions={INVENTORY_PAGE_SIZE_OPTIONS}
                            pageSizeId="inventory-assets-page-size"
                            pageSizeName="inventory_assets_page_size"
                            currentPage={resolvedAssetsPage}
                            totalPages={assetsTotalPages}
                            onPageSizeChange={(nextSize) => {
                              setAssetsItemsPerPage(nextSize);
                              setAssetsCurrentPage(1);
                            }}
                            onPrev={() => setAssetsCurrentPage((page) => Math.max(1, page - 1))}
                            onNext={() => setAssetsCurrentPage((page) => Math.min(assetsTotalPages, page + 1))}
                          />
                        )}
                      >
                        <table className="data-table__table inventory-table">
                          <thead>
                            <tr>
                              <th scope="col">Activo</th>
                              <th scope="col">Modo</th>
                              <th scope="col">Estado</th>
                              <th scope="col">Existencia</th>
                              <th scope="col">Última actualización</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedAssets.map((asset) => {
                              const isSelected = Number(selectedAssetId) === Number(asset.id);
                              const stockLabel = asset.tracking_mode_key === 'stock'
                                ? `${asset.stock_quantity} / mín ${asset.min_quantity}`
                                : `${asset.units_count} unidades`;
                              const assetIdentifier = asset.internal_code || `AST-${String(asset.id).padStart(6, '0')}`;

                              return (
                                <tr
                                  key={asset.id}
                                  className={isSelected
                                    ? 'data-table__row inventory-table__row data-table__row--active inventory-table__row--active'
                                    : 'data-table__row inventory-table__row'}
                                >
                                  <td className="data-table__cell">
                                    <button
                                      type="button"
                                      className="data-table__row-action"
                                      onClick={(event) => {
                                        openAssetDetail(asset.id, event.currentTarget, {
                                          shouldAutoFocus: event.detail === 0
                                        });
                                      }}
                                      aria-label={`Ver detalle de ${asset.asset_name}`}
                                      aria-controls={INVENTORY_ASSET_DETAIL_PANEL_ID}
                                      aria-expanded={isSelected}
                                    >
                                      <span className="data-table__item-id">{assetIdentifier}</span>
                                      <span className="data-table__item-title">{asset.asset_name}</span>
                                      <span className="data-table__item-meta">{asset.type_name} / {asset.category_name}</span>
                                    </button>
                                  </td>
                                  <td className="data-table__cell">{asset.tracking_mode_name}</td>
                                  <td className="data-table__cell">
                                    <span className={`inventory-status-chip inventory-status-chip--${toOperationalStatusTone(asset.operational_status_key)}`}>
                                      {asset.operational_status_name || toOperationalStatusLabel(asset.operational_status_key)}
                                    </span>
                                  </td>
                                  <td className="data-table__cell">{stockLabel}</td>
                                  <td className="data-table__cell">{formatDateTime(asset.updated_at)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </OperationalTable>
                    )}
                  </div>
                )}
                detail={detailAsset ? (
                  <div
                    className="ticket-detail ticket-detail--tone-primary inventory-asset-detail"
                    onKeyDownCapture={(event) => {
                      if (event.key !== 'Escape') {
                        return;
                      }

                      event.preventDefault();
                      event.stopPropagation();
                      closeAssetDetail();
                    }}
                  >
                    <header className="ticket-detail__header inventory-asset-detail__header">
                      <div className="ticket-detail__header-top">
                        <div className="ticket-detail__header-id inventory-asset-detail__header-id">
                          <span className="ticket-detail__ticket-id">
                            {detailAsset.internal_code || `AST-${String(detailAsset.id).padStart(6, '0')}`}
                          </span>
                          <span className={`inventory-status-chip inventory-status-chip--${toOperationalStatusTone(detailAsset.operational_status_key)}`}>
                            {detailAsset.operational_status_name || toOperationalStatusLabel(detailAsset.operational_status_key)}
                          </span>
                        </div>
                        <div className="ticket-detail__header-actions inventory-asset-detail__header-actions">
                          {isLoadingAssetDetail ? (
                            <span
                              className="inventory-asset-detail__loading"
                              role="status"
                              aria-live="polite"
                              aria-atomic="true"
                            >
                              Actualizando...
                            </span>
                          ) : null}
                          {canUpdateInventory ? (
                            <button
                              type="button"
                              className="action-inline"
                              onClick={openEditAssetModal}
                              aria-label={`Editar activo ${detailAsset.asset_name}`}
                            >
                              <PencilLine size={14} aria-hidden="true" />
                              <span>Editar activo</span>
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="ticket-detail__close"
                            ref={assetDetailCloseButtonRef}
                            onClick={() => closeAssetDetail()}
                            aria-label="Cerrar detalle de activo"
                          >
                            <X size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <h2
                        id={INVENTORY_ASSET_DETAIL_TITLE_ID}
                        className="ticket-detail__title inventory-asset-detail__title"
                      >
                        {detailAsset.asset_name}
                      </h2>
                      <p className="ticket-detail__summary inventory-asset-detail__summary-copy">
                        {detailAsset.type_name} / {detailAsset.category_name} / {detailAsset.tracking_mode_name}
                      </p>
                    </header>

                    <section className="ticket-detail__section ticket-detail__section--log inventory-asset-detail__log">
                      <DrawerTabs
                        label="Secciones de detalle del activo"
                        activeKey={activeDetailTab}
                        onChange={setActiveDetailTab}
                        className="ticket-detail__tabs inventory-asset-detail__tabs-rail"
                        tabs={detailTabOptions.map((tabOption) => ({
                          key: tabOption.key,
                          label: tabOption.label,
                          id: `inventory-detail-tab-${tabOption.key}`,
                          controls: `inventory-detail-panel-${tabOption.key}`,
                          count: tabOption.key === 'summary'
                            ? undefined
                            : tabOption.key === 'units'
                              ? selectedAssetUnits.length
                              : selectedAssetMovements.length
                        }))}
                      />

                      <div className="inventory-asset-detail__content">
                        <section
                          id="inventory-detail-panel-summary"
                          role="tabpanel"
                          aria-labelledby="inventory-detail-tab-summary"
                          hidden={activeDetailTab !== 'summary'}
                          className="ticket-detail__tab-panel inventory-asset-detail__panel inventory-asset-detail__summary"
                        >
                          <section className="ticket-detail__section inventory-asset-detail__section">
                            <div className="ticket-detail__section-headline inventory-asset-detail__section-headline">
                              <h3 className="ticket-detail__section-title inventory-asset-detail__section-title">Estado operativo</h3>
                            </div>
                            <dl className="ticket-detail__meta-grid inventory-asset-detail__meta-grid inventory-asset-detail__meta-grid--status">
                              <div className="ticket-detail__meta-item">
                                <dt className="ticket-detail__meta-label">Estado</dt>
                                <dd>
                                  <span className={`inventory-status-chip inventory-status-chip--${toOperationalStatusTone(detailAsset.operational_status_key)}`}>
                                    {detailAsset.operational_status_name || toOperationalStatusLabel(detailAsset.operational_status_key)}
                                  </span>
                                </dd>
                              </div>
                              <div className="ticket-detail__meta-item">
                                <dt className="ticket-detail__meta-label">Existencia actual</dt>
                                <dd>{detailExistenceLabel}</dd>
                              </div>
                              {detailAsset.tracking_mode_key === 'stock' ? (
                                <div className="ticket-detail__meta-item">
                                  <dt className="ticket-detail__meta-label">Stock mínimo</dt>
                                  <dd>{detailAsset.min_quantity}</dd>
                                </div>
                              ) : null}
                              <div className="ticket-detail__meta-item">
                                <dt className="ticket-detail__meta-label">Última actualización</dt>
                                <dd>{formatDateTime(detailAsset.updated_at)}</dd>
                              </div>
                            </dl>
                          </section>

                          {recentSummaryMovements.length > 0 ? (
                            <section className="ticket-detail__section inventory-asset-detail__section inventory-asset-detail__summary-activity" aria-label="Actividad reciente del activo">
                              <div className="ticket-detail__section-headline inventory-asset-detail__section-headline">
                                <h3 className="ticket-detail__section-title inventory-asset-detail__section-title">Actividad reciente</h3>
                                <span className="ticket-detail__comment-history-count inventory-asset-detail__activity-count" aria-hidden="true">
                                  {selectedAssetMovements.length}
                                </span>
                              </div>
                              <p className="ticket-detail__comment-history-caption">Más recientes primero</p>
                              <ul className="ticket-activity inventory-asset-detail__activity-list">
                                {recentSummaryMovements.map((movement) => (
                                  <li key={`summary-${movement.id}-${movement.movement_line_id}`} className="ticket-activity__item">
                                    <span className="ticket-activity__dot" aria-hidden="true" />
                                    <div>
                                      <p className="ticket-activity__title">{toMovementWhatHappened(movement)}</p>
                                      <p className="ticket-activity__meta">
                                        <span className="inventory-asset-detail__activity-impact">{toMovementImpact(movement)}</span>
                                        <span className="inventory-asset-detail__activity-when">{formatDateTime(movement.happened_at)}</span>
                                      </p>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </section>
                          ) : null}

                          <section className="ticket-detail__section inventory-asset-detail__section">
                            <div className="ticket-detail__section-headline inventory-asset-detail__section-headline">
                              <h3 className="ticket-detail__section-title inventory-asset-detail__section-title">Ficha técnica</h3>
                            </div>
                            {detailAsset.description ? (
                              <p className="inventory-asset-detail__section-copy">{detailAsset.description}</p>
                            ) : null}
                            <dl className="ticket-detail__meta-grid inventory-asset-detail__meta-grid">
                              <div className="ticket-detail__meta-item">
                                <dt className="ticket-detail__meta-label">Código interno</dt>
                                <dd>{detailAsset.internal_code || 'Sin código'}</dd>
                              </div>
                              <div className="ticket-detail__meta-item">
                                <dt className="ticket-detail__meta-label">Marca / Modelo</dt>
                                <dd>{[detailAsset.brand, detailAsset.model].filter(Boolean).join(' / ') || 'No registrado'}</dd>
                              </div>
                            </dl>
                          </section>
                        </section>

                        <section
                          id="inventory-detail-panel-units"
                          role="tabpanel"
                          aria-labelledby="inventory-detail-tab-units"
                          hidden={activeDetailTab !== 'units'}
                          className="ticket-detail__tab-panel inventory-asset-detail__panel"
                        >
                          {detailAsset.tracking_mode_key === 'unit' ? (
                            <div className="inventory-asset-detail__panel-header inventory-asset-detail__panel-header--units">
                              <h3 className="inventory-asset-detail__panel-title">Unidades registradas</h3>
                              <div className="inventory-asset-detail__toolbar">
                                {canCreateInventory ? (
                                  <button type="button" className="workspace-action workspace-action--primary" onClick={openCreateUnitsModal}>
                                    <Tags size={14} aria-hidden="true" />
                                    <span>Registrar unidades</span>
                                  </button>
                                ) : null}
                                {selectedAssetUnits.length > 0 && (hasAvailableAssetUnits || hasAssignedAssetUnits) ? (
                                  <div className="inventory-asset-detail__toolbar-secondary">
                                    {hasAvailableAssetUnits && canAssignInventory ? (
                                      <button
                                        type="button"
                                        className="inventory-asset-detail__toolbar-action"
                                        onClick={(event) => openCreateAssignmentModal(null, { triggerElement: event.currentTarget })}
                                      >
                                        <ShieldCheck size={14} aria-hidden="true" />
                                        <span>Asignar ({availableAssetUnitsCount})</span>
                                      </button>
                                    ) : null}
                                    {hasAssignedAssetUnits && canAssignInventory ? (
                                      <button
                                        type="button"
                                        className="inventory-asset-detail__toolbar-action"
                                        onClick={() => void openCloseAssignmentModal()}
                                      >
                                        <Undo2 size={14} aria-hidden="true" />
                                        <span>Cerrar resguardo ({assignedAssetUnitsCount})</span>
                                      </button>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                          {selectedAssetUnits.length === 0 ? (
                            <p className="inventory-asset-detail__empty-copy">Este activo no tiene unidades serializadas registradas.</p>
                          ) : (
                            <ul className="inventory-asset-detail__list">
                              {selectedAssetUnits.map((unit) => {
                                const canShowUnitSecondaryActions = canUpdateInventory
                                  && (unit.status_key === 'available' || unit.status_key === 'in_repair');

                                return (
                                <li key={unit.id} className="inventory-asset-detail__unit-item">
                                  <div className="inventory-asset-detail__unit-head">
                                    <div className="inventory-asset-detail__unit-identity">
                                      <strong>{unit.asset_tag}</strong>
                                      <span className={`inventory-status-chip inventory-status-chip--${toUnitStatusTone(unit.status_key)}`}>
                                        {unit.status_name}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="inventory-asset-detail__unit-meta">
                                    <span className="inventory-asset-detail__unit-location">{unit.current_location_name || 'Sin ubicación'}</span>
                                    {unit.active_assignment?.collaborator_name || unit.serial_number ? (
                                      <div className="inventory-asset-detail__unit-detail-row">
                                        {unit.active_assignment?.collaborator_name ? (
                                          <span className="inventory-asset-detail__unit-serial">
                                            Resguardo activo: {unit.active_assignment.collaborator_name}
                                          </span>
                                        ) : null}
                                        {unit.serial_number ? <span className="inventory-asset-detail__unit-serial">Serie: {unit.serial_number}</span> : null}
                                      </div>
                                    ) : null}
                                  </div>
                                  {canShowUnitSecondaryActions ? (
                                    <div className="inventory-asset-detail__unit-actions">
                                      {unit.status_key === 'available' ? (
                                        <>
                                          <button
                                            type="button"
                                            className="action-inline action-inline--secondary"
                                            onClick={() => openUnitStatusModal(unit, 'in_repair')}
                                            aria-label={`Enviar ${unit.asset_tag} a reparación`}
                                          >
                                            <Wrench size={14} aria-hidden="true" />
                                            <span>En reparación</span>
                                          </button>
                                          <button
                                            type="button"
                                            className="action-inline action-inline--secondary"
                                            onClick={() => openUnitStatusModal(unit, 'retired')}
                                            aria-label={`Dar de baja ${unit.asset_tag}`}
                                          >
                                            <Archive size={14} aria-hidden="true" />
                                            <span>Baja</span>
                                          </button>
                                        </>
                                      ) : null}
                                      {unit.status_key === 'in_repair' ? (
                                        <>
                                          <button
                                            type="button"
                                            className="action-inline action-inline--secondary"
                                            onClick={() => openUnitStatusModal(unit, 'available')}
                                            aria-label={`Marcar ${unit.asset_tag} como disponible`}
                                          >
                                            <Check size={14} aria-hidden="true" />
                                            <span>Marcar disponible</span>
                                          </button>
                                          <button
                                            type="button"
                                            className="action-inline action-inline--secondary"
                                            onClick={() => openUnitStatusModal(unit, 'retired')}
                                            aria-label={`Dar de baja ${unit.asset_tag}`}
                                          >
                                            <CircleOff size={14} aria-hidden="true" />
                                            <span>Baja</span>
                                          </button>
                                        </>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </li>
                                );
                              })}
                            </ul>
                          )}
                        </section>

                        <section
                          id="inventory-detail-panel-movements"
                          role="tabpanel"
                          aria-labelledby="inventory-detail-tab-movements"
                          hidden={activeDetailTab !== 'movements'}
                          className="ticket-detail__tab-panel inventory-asset-detail__panel"
                        >
                          {selectedAssetMovements.length === 0 ? (
                            <p className="inventory-asset-detail__empty-copy">Este activo aún no tiene movimientos registrados.</p>
                          ) : (
                            <>
                              <div className="ticket-detail__comment-history-headline" aria-hidden="true">
                                <span>Historial de actividad</span>
                                <span>{selectedAssetMovements.length}</span>
                              </div>
                              <p className="ticket-detail__comment-history-caption">Más recientes primero</p>
                              <ul className="ticket-activity inventory-asset-detail__activity-list" aria-label="Historial de movimientos del activo">
                                {selectedAssetMovements.map((movement) => (
                                  <li key={`${movement.id}-${movement.movement_line_id}`} className="ticket-activity__item">
                                    <span className="ticket-activity__dot" aria-hidden="true" />
                                    <div>
                                      <p className="ticket-activity__title">{toMovementWhatHappened(movement)}</p>
                                      <p className="ticket-activity__meta">
                                        <span className="inventory-asset-detail__activity-impact">{toMovementImpact(movement)}</span>
                                        <span className="inventory-asset-detail__activity-when">{formatDateTime(movement.happened_at)}</span>
                                      </p>
                                      {sanitizeMovementReason(movement.reason) ? (
                                        <p className="ticket-detail__comment-history-caption">
                                          {sanitizeMovementReason(movement.reason)}
                                        </p>
                                      ) : null}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </section>
                      </div>
                    </section>
                  </div>
                ) : null}
              />
            </section>

            <section id="inventory-panel-movements" role="tabpanel" aria-labelledby="inventory-view-movements" hidden={activeView !== 'movements'} className="workspace-panel">
              <div className="workspace-page__control-row workspace-page__control-row--operational">
                <ToolbarSearchField
                  id="inventory-movements-search"
                  name="inventory-movements-search"
                  value={movementsSearchTerm}
                  onChange={setMovementsSearchTerm}
                  placeholder="Buscar por activo, tipo, dirección o motivo..."
                  srLabel="Buscar movimientos"
                  className="workspace-search--operational"
                />
              </div>
              <div className="workspace-panel__viewport workspace-panel__viewport--flush workspace-panel__viewport--fixed">
                {filteredMovements.length === 0 ? (
                  <EmptyState title={inventoryMovementsNoRecordsState.title} copy={inventoryMovementsNoRecordsState.copy} id="inventory-movements-empty" role="region">
                    {canUpdateInventory ? (
                      <button type="button" className="workspace-action workspace-action--primary" onClick={() => setIsCreateMovementOpen(true)}>Registrar movimiento</button>
                    ) : null}
                  </EmptyState>
                ) : (
                  <OperationalTable
                    className="inventory-movements-list"
                    ariaLabel="Listado de movimientos de inventario"
                    scrollClassName="data-table__scroll workspace-scroll-wrap--fill"
                    pagination={(
                      <PaginationBar
                        ariaLabel="Paginación de movimientos"
                        start={movementsPageStart + 1}
                        end={Math.min(movementsPageStart + movementsItemsPerPage, filteredMovements.length)}
                        total={filteredMovements.length}
                        pageSize={movementsItemsPerPage}
                        pageSizeOptions={INVENTORY_PAGE_SIZE_OPTIONS}
                        pageSizeId="inventory-movements-page-size"
                        pageSizeName="inventory_movements_page_size"
                        currentPage={resolvedMovementsPage}
                        totalPages={movementsTotalPages}
                        onPageSizeChange={(nextSize) => {
                          setMovementsItemsPerPage(nextSize);
                          setMovementsCurrentPage(1);
                        }}
                        onPrev={() => setMovementsCurrentPage((page) => Math.max(1, page - 1))}
                        onNext={() => setMovementsCurrentPage((page) => Math.min(movementsTotalPages, page + 1))}
                      />
                    )}
                  >
                    <table className="data-table__table inventory-table inventory-table--movements">
                      <thead>
                        <tr>
                          <th scope="col">Fecha</th>
                          <th scope="col">Activo</th>
                          <th scope="col">Tipo</th>
                          <th scope="col">Dirección</th>
                          <th scope="col">Cantidad</th>
                          <th scope="col">Motivo</th>
                          <th scope="col">Operador</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedMovements.map((movement) => (
                          <tr key={`${movement.id}-${movement.movement_line_id}`} className="data-table__row inventory-table__row">
                            <td className="data-table__cell">{formatDateTime(movement.happened_at)}</td>
                            <td className="data-table__cell">{movement.asset_name || 'Sin activo'}</td>
                            <td className="data-table__cell">{movement.movement_type_name}</td>
                            <td className="data-table__cell">{toMovementDirectionLabel(movement.direction)}</td>
                            <td className="data-table__cell">{movement.quantity}</td>
                            <td className="data-table__cell">{movement.reason}</td>
                            <td className="data-table__cell">{movement.operator_name || 'Sistema'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </OperationalTable>
                )}
              </div>
            </section>

            <section id="inventory-panel-assignments" role="tabpanel" aria-labelledby="inventory-view-assignments" hidden={activeView !== 'assignments'} className="workspace-panel">
              <div className="workspace-page__control-row workspace-page__control-row--operational">
                <ToolbarSearchField
                  id="inventory-assignments-search"
                  name="inventory-assignments-search"
                  value={assignmentsSearchTerm}
                  onChange={setAssignmentsSearchTerm}
                  placeholder="Buscar por activo, unidad, colaborador o ubicación..."
                  srLabel="Buscar resguardos"
                  className="workspace-search--operational"
                />
                <div className="workspace-page__filters workspace-page__filters--operational">
                  <FilterChipGroup
                    label="Filtro por estado de resguardo"
                    options={assignmentStatusOptions}
                    activeKey={assignmentStatusFilter}
                    onSelect={setAssignmentStatusFilter}
                    className="workspace-chip-group workspace-chip-group--compact"
                    chipClassName="workspace-chip"
                    activeChipClassName="workspace-chip--active"
                  />
                  <FilterSelect
                    id="inventory-assignment-collaborator-filter"
                    name="inventory_assignment_collaborator_filter"
                    label="Colaborador"
                    showLabel={false}
                    value={assignmentCollaboratorFilter}
                    options={collaboratorFilterOptions}
                    onChange={setAssignmentCollaboratorFilter}
                    className="filter-select filter-select--operational"
                  />
                </div>
                <div className="workspace-page__actions">
                  {canAssignInventory ? (
                    <button
                      type="button"
                      className="workspace-action workspace-action--ghost"
                      ref={createAssignmentTriggerRef}
                      onClick={(event) => openCreateAssignmentModal(null, { useGlobal: true, triggerElement: event.currentTarget })}
                    >
                      <ShieldCheck size={16} aria-hidden="true" />
                      <span>Nuevo resguardo</span>
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="workspace-panel__viewport workspace-panel__viewport--flush workspace-panel__viewport--fixed">
                {filteredAssignments.length === 0 ? (
                  <EmptyState title={inventoryAssignmentsNoResultsState.title} copy={inventoryAssignmentsNoResultsState.copy} id="inventory-assignments-empty" role="region">
                    {canAssignInventory ? (
                      <button
                        type="button"
                        className="workspace-action workspace-action--primary"
                        onClick={(event) => openCreateAssignmentModal(null, { useGlobal: true, triggerElement: event.currentTarget })}
                      >
                        <ShieldCheck size={14} aria-hidden="true" />
                        <span>Nuevo resguardo</span>
                      </button>
                    ) : null}
                  </EmptyState>
                ) : (
                  <OperationalTable
                    className="inventory-assignments-list"
                    ariaLabel="Listado de resguardos"
                    scrollClassName="data-table__scroll workspace-scroll-wrap--fill"
                    pagination={(
                      <PaginationBar
                        ariaLabel="Paginación de resguardos"
                        start={assignmentsPageStart + 1}
                        end={Math.min(assignmentsPageStart + assignmentsItemsPerPage, filteredAssignments.length)}
                        total={filteredAssignments.length}
                        pageSize={assignmentsItemsPerPage}
                        pageSizeOptions={INVENTORY_PAGE_SIZE_OPTIONS}
                        pageSizeId="inventory-assignments-page-size"
                        pageSizeName="inventory_assignments_page_size"
                        currentPage={resolvedAssignmentsPage}
                        totalPages={assignmentsTotalPages}
                        onPageSizeChange={(nextSize) => {
                          setAssignmentsItemsPerPage(nextSize);
                          setAssignmentsCurrentPage(1);
                        }}
                        onPrev={() => setAssignmentsCurrentPage((page) => Math.max(1, page - 1))}
                        onNext={() => setAssignmentsCurrentPage((page) => Math.min(assignmentsTotalPages, page + 1))}
                      />
                    )}
                  >
                    <table className="data-table__table inventory-table inventory-table--assignments">
                      <thead>
                        <tr>
                          <th scope="col">Colaborador</th>
                          <th scope="col">Activo</th>
                          <th scope="col">Unidad</th>
                          <th scope="col">Ubicación</th>
                          <th scope="col">Estado</th>
                          <th scope="col">Asignado</th>
                          <th scope="col">Retorno</th>
                          <th scope="col">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAssignments.map((assignment) => (
                          <tr key={assignment.id} className="data-table__row inventory-table__row">
                            <td className="data-table__cell">
                              <span className="data-table__item-title">{assignment.collaborator?.full_name || 'Sin colaborador'}</span>
                              <span className="data-table__item-meta inventory-assignments__meta">{assignment.collaborator?.employee_id ? `ID ${assignment.collaborator.employee_id}` : 'Sin ID'}</span>
                            </td>
                            <td className="data-table__cell">
                              <span className="data-table__item-title">{assignment.asset?.asset_name || 'Sin activo'}</span>
                              <span className="data-table__item-meta inventory-assignments__meta">{assignment.asset?.internal_code || 'Sin código'}</span>
                            </td>
                            <td className="data-table__cell">
                              <span className="data-table__item-title">{assignment.asset_unit?.asset_tag || 'Sin unidad'}</span>
                              {assignment.asset_unit?.serial_number ? (
                                <span className="data-table__item-meta inventory-assignments__meta">{assignment.asset_unit.serial_number}</span>
                              ) : null}
                            </td>
                            <td className="data-table__cell">
                              <span className="inventory-assignments__supporting">{assignment.location?.name || 'Sin ubicación'}</span>
                            </td>
                            <td className="data-table__cell">
                              <span className={`inventory-status-chip inventory-status-chip--${assignment.status === 'active' ? 'accent' : 'neutral'}`}>
                                {assignment.status === 'active' ? 'Activo' : 'Cerrado'}
                              </span>
                            </td>
                            <td className="data-table__cell">
                              <span className="inventory-assignments__supporting">{formatDateTime(assignment.assigned_at)}</span>
                            </td>
                            <td className="data-table__cell">
                              <span className="inventory-assignments__supporting">{assignment.expected_return_at ? formatDateTime(assignment.expected_return_at) : 'Sin fecha'}</span>
                            </td>
                            <td className="data-table__cell">
                              <div className="inventory-table__actions inventory-table__actions--assignments">
                                {assignment.status === 'active' && canAssignInventory ? (
                                  <button
                                    type="button"
                                    className="action-inline action-inline--primary"
                                    onClick={() => void openCloseAssignmentModal(assignment.asset_unit?.id)}
                                    aria-label={`Cerrar resguardo de ${assignment.asset_unit?.asset_tag || 'la unidad'}`}
                                  >
                                    <Undo2 size={14} aria-hidden="true" />
                                    <span>Cerrar</span>
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className={`action-inline ${assignment.status === 'active' && canAssignInventory ? 'action-inline--secondary' : 'action-inline--primary'}`}
                                  onClick={(event) => openAssetFromAssignment(assignment, event.currentTarget)}
                                  aria-label={`Abrir activo ${assignment.asset?.asset_name || 'relacionado'}`}
                                >
                                  <span>Abrir activo</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </OperationalTable>
                )}
              </div>
            </section>

            <section id="inventory-panel-locations" role="tabpanel" aria-labelledby="inventory-view-locations" hidden={activeView !== 'locations'} className="workspace-panel">
              <div className="workspace-page__control-row workspace-page__control-row--operational">
                <ToolbarSearchField
                  id="inventory-locations-search"
                  name="inventory-locations-search"
                  value={locationsSearchTerm}
                  onChange={setLocationsSearchTerm}
                  placeholder="Buscar por nombre, código o tipo de ubicación..."
                  srLabel="Buscar ubicaciones"
                  className="workspace-search--operational"
                />
                <div className="workspace-page__filters workspace-page__filters--operational">
                  {canCreateInventory ? (
                    <button type="button" className="workspace-action workspace-action--ghost" ref={createLocationTriggerRef} onClick={openLocationCreate}>
                      <Building2 size={16} aria-hidden="true" />
                      <span>Nueva ubicación</span>
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="workspace-panel__viewport workspace-panel__viewport--flush workspace-panel__viewport--fixed">
                <OperationalPanel
                  hasData={filteredLocations.length > 0}
                  tone="neutral"
                  className="inventory-locations-panel"
                  ariaLabel="Listado de ubicaciones"
                  scrollClassName="data-table__scroll inventory-locations-workspace"
                  content={(
                    <table className="inventory-location-table">
                      <colgroup>
                        <col className="inventory-location-table__col inventory-location-table__col--location" />
                        <col className="inventory-location-table__col inventory-location-table__col--code" />
                        <col className="inventory-location-table__col inventory-location-table__col--type" />
                        <col className="inventory-location-table__col inventory-location-table__col--status" />
                        <col className="inventory-location-table__col inventory-location-table__col--actions" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th scope="col">Ubicación</th>
                          <th scope="col">Código</th>
                          <th scope="col">Tipo</th>
                          <th scope="col">Estado</th>
                          <th scope="col" className="inventory-location-table__actions-head">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleLocationRows.map((location) => {
                          const locationId = Number(location.id);
                          const isEditingLocation = Number(editingLocationId) === locationId;

                          return (
                            <tr
                              key={location.id}
                              className={`inventory-location-table__row${isEditingLocation ? ' inventory-location-table__row--active' : ''}`}
                            >
                              <th scope="row" className="inventory-location-table__cell inventory-location-table__cell--name">
                                <div
                                  className="inventory-location-table__identity"
                                  style={{ '--location-level': location.depth }}
                                >
                                  {location.hasChildren ? (
                                    <button
                                      type="button"
                                      className={`inventory-location-table__toggle${location.isExpanded ? ' inventory-location-table__toggle--expanded' : ''}`}
                                      onClick={() => toggleLocationBranch(locationId)}
                                      aria-label={`${location.isExpanded ? 'Colapsar' : 'Expandir'} ${location.name}`}
                                      aria-expanded={location.isExpanded}
                                    >
                                      <ChevronRight size={14} aria-hidden="true" />
                                    </button>
                                  ) : (
                                    <span className="inventory-location-table__toggle-placeholder" aria-hidden="true" />
                                  )}
                                  <div className="inventory-location-table__title-group">
                                    <span className="inventory-location-table__name data-table__item-title">{location.name}</span>
                                    {location.description ? (
                                      <span className="inventory-location-table__summary data-table__item-meta">{location.description}</span>
                                    ) : null}
                                  </div>
                                </div>
                              </th>
                              <td className="inventory-location-table__cell inventory-location-table__cell--code">
                                <span className="inventory-location-table__code">{location.code || 'Sin código'}</span>
                              </td>
                              <td className="inventory-location-table__cell inventory-location-table__cell--type">
                                <span className="inventory-location-table__type">{location.location_type_name}</span>
                              </td>
                              <td className="inventory-location-table__cell inventory-location-table__cell--status">
                                <span className={`inventory-status-chip inventory-status-chip--${toStatusTone(location.status)}`}>
                                  {toStatusLabel(location.status)}
                                </span>
                              </td>
                              <td className="inventory-location-table__cell inventory-location-table__cell--actions">
                                {canUpdateInventory ? (
                                  <button
                                    type="button"
                                    className="action-inline"
                                    onClick={() => openLocationEdit(location)}
                                    aria-label={`Editar ubicación ${location.name}`}
                                  >
                                    <Settings2 size={14} aria-hidden="true" />
                                    <span>Editar</span>
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                  emptyTitle={inventoryLocationsNoResultsState.title}
                  emptyCopy={inventoryLocationsNoResultsState.copy}
                  emptyId="inventory-locations-empty"
                  emptyRole="region"
                  emptyActions={canCreateInventory ? (
                    <button type="button" className="workspace-action workspace-action--primary" onClick={openLocationCreate}>Nueva ubicación</button>
                  ) : null}
                />
              </div>
            </section>
          </>
        ) : null}
      </section>

      <ModalDialog
        open={isCreateAssetOpen}
        title="Nuevo activo"
        onClose={() => setIsCreateAssetOpen(false)}
        returnFocusRef={createAssetTriggerRef}
        initialFocusRef={createAssetTypeSelectRef}
        size="wide"
      >
        <form className="modal-dialog__form" onSubmit={handleCreateAsset}>
          <div className="modal-dialog__grid">
            <div className="modal-dialog__field">
              <span id="inventory-asset-type-label">Tipo de activo</span>
              <FilterSelect
                ref={createAssetTypeSelectRef}
                id="inventory-asset-type"
                name="inventory_asset_type_id"
                label="Tipo de activo"
                labelId="inventory-asset-type-label"
                variant="field"
                value={assetForm.asset_type_id}
                options={assetTypeFieldOptions}
                onChange={(nextTypeId) => {
                  setAssetForm((current) => ({
                    ...current,
                    asset_type_id: nextTypeId
                  }));
                }}
              />
            </div>
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="inventory-asset-name">
              <span>Nombre del activo</span>
              <input id="inventory-asset-name" name="inventory_asset_name" type="text" value={assetForm.asset_name} onChange={(event) => setAssetForm((current) => ({ ...current, asset_name: event.target.value }))} required />
            </label>
            <label className="modal-dialog__field" htmlFor="inventory-asset-brand">
              <span>Marca</span>
              <input id="inventory-asset-brand" name="inventory_asset_brand" type="text" value={assetForm.brand} onChange={(event) => setAssetForm((current) => ({ ...current, brand: event.target.value }))} />
            </label>
            <label className="modal-dialog__field" htmlFor="inventory-asset-model">
              <span>Modelo</span>
              <input id="inventory-asset-model" name="inventory_asset_model" type="text" value={assetForm.model} onChange={(event) => setAssetForm((current) => ({ ...current, model: event.target.value }))} />
            </label>
            {selectedAssetTypeForForm ? (
              <div className="modal-dialog__field">
                <span>Modo de seguimiento</span>
                <div className="inventory-form__read-only">
                  {selectedAssetTypeForForm.default_tracking_mode_name || selectedAssetTypeForForm.default_tracking_mode_key || 'Sin definir'}
                </div>
              </div>
            ) : null}
            {shouldShowAssetMinQuantity ? (
              <label className="modal-dialog__field" htmlFor="inventory-asset-min-quantity">
                <span>Stock mínimo</span>
                <input id="inventory-asset-min-quantity" name="inventory_asset_min_quantity" type="number" min="0" step="0.01" value={assetForm.min_quantity} onChange={(event) => setAssetForm((current) => ({ ...current, min_quantity: event.target.value }))} />
              </label>
            ) : null}
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="inventory-asset-description">
              <span>Descripción</span>
              <textarea id="inventory-asset-description" name="inventory_asset_description" rows="3" value={assetForm.description} onChange={(event) => setAssetForm((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="inventory-asset-reason">
              <span>Nota de alta (opcional)</span>
              <input id="inventory-asset-reason" name="inventory_asset_reason" type="text" value={assetForm.reason} onChange={(event) => setAssetForm((current) => ({ ...current, reason: event.target.value }))} />
            </label>
          </div>
          <footer className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={() => setIsCreateAssetOpen(false)}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmittingAsset}>{isSubmittingAsset ? 'Guardando...' : 'Crear activo'}</button>
          </footer>
        </form>
      </ModalDialog>

      <ModalDialog
        open={isCreateMovementOpen}
        title="Registrar movimiento"
        onClose={() => setIsCreateMovementOpen(false)}
        returnFocusRef={createMovementTriggerRef}
        initialFocusRef={movementReasonTemplateFirstRef}
        size="wide"
      >
        <form className="modal-dialog__form" onSubmit={handleCreateMovement}>
          <div className="inventory-modal__reason-templates" role="toolbar" aria-label="Plantillas de motivo frecuente">
            {quickReasonTemplates.map((template, index) => (
              <button
                key={template}
                ref={(node) => {
                  movementReasonChipRefs.current[index] = node;
                  if (index === 0) {
                    movementReasonTemplateFirstRef.current = node;
                  }
                }}
                type="button"
                className="inventory-modal__reason-chip"
                tabIndex={movementReasonFocusIndex === index ? 0 : -1}
                onFocus={() => setMovementReasonFocusIndex(index)}
                onKeyDown={(event) => handleMovementReasonKeyDown(event, index)}
                onClick={() => setMovementForm((current) => ({ ...current, reason: template }))}
              >
                {template}
              </button>
            ))}
          </div>
          <div className="modal-dialog__grid">
            <div className="modal-dialog__field">
              <FieldLabel
                id="inventory-movement-type-label"
                label="Tipo de movimiento"
                body="Define si el movimiento suma, descuenta, traslada o corrige existencias dentro del inventario."
              />
              <FilterSelect
                ref={createMovementTypeSelectRef}
                id="inventory-movement-type"
                name="inventory_movement_type_key"
                label="Tipo de movimiento"
                labelId="inventory-movement-type-label"
                variant="field"
                value={movementForm.movement_type_key}
                options={movementTypeFieldOptions}
                onChange={(nextValue) => setMovementForm((current) => ({ ...current, movement_type_key: nextValue }))}
              />
            </div>
            <label className="modal-dialog__field" htmlFor="inventory-movement-happened-at">
              <span>Fecha y hora</span>
              <input id="inventory-movement-happened-at" name="inventory_movement_happened_at" type="datetime-local" value={movementForm.happened_at} onChange={(event) => setMovementForm((current) => ({ ...current, happened_at: event.target.value }))} />
            </label>
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="inventory-movement-reason">
              <span>Motivo</span>
              <input id="inventory-movement-reason" name="inventory_movement_reason" type="text" value={movementForm.reason} onChange={(event) => setMovementForm((current) => ({ ...current, reason: event.target.value }))} required />
            </label>
          </div>

          <section className="inventory-modal__lines" aria-label="Partidas de movimiento">
            <header>
              <h3>Partidas</h3>
              <button
                type="button"
                className="workspace-action workspace-action--ghost"
                onClick={() => setMovementForm((current) => ({
                  ...current,
                  lines: [...current.lines, { ...defaultMovementLine, asset_id: selectedAssetId ? String(selectedAssetId) : '' }]
                }))}
              >
                <Plus size={14} aria-hidden="true" />
                <span>Agregar línea</span>
              </button>
            </header>
            <div className="inventory-modal__lines-grid">
              {movementForm.lines.map((line, index) => (
                <article key={`line-${index}`} className="inventory-modal__line-card">
                  <header>
                    <strong>Partida {index + 1}</strong>
                    {movementForm.lines.length > 1 ? (
                      <button
                        type="button"
                        className="inventory-modal__line-remove"
                        onClick={() => setMovementForm((current) => ({
                          ...current,
                          lines: current.lines.filter((_, lineIndex) => lineIndex !== index)
                        }))}
                        aria-label={`Eliminar partida ${index + 1}`}
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    ) : null}
                  </header>
                  <div className="inventory-modal__line-fields">
                    <div className="modal-dialog__field">
                      <span id={`inventory-movement-line-${index}-asset-label`}>Activo</span>
                      <FilterSelect
                        id={`inventory-movement-line-${index}-asset`}
                        name={`inventory_movement_lines_${index}_asset_id`}
                        label="Activo"
                        labelId={`inventory-movement-line-${index}-asset-label`}
                        variant="field"
                        value={line.asset_id}
                        options={assetFieldOptions}
                        onChange={(nextValue) => setMovementForm((current) => ({
                          ...current,
                          lines: current.lines.map((currentLine, lineIndex) => (
                            lineIndex === index ? { ...currentLine, asset_id: nextValue } : currentLine
                          ))
                        }))}
                      />
                    </div>
                    <label className="modal-dialog__field" htmlFor={`inventory-movement-line-${index}-quantity`}>
                      <span>Cantidad</span>
                      <input
                        id={`inventory-movement-line-${index}-quantity`}
                        name={`inventory_movement_lines_${index}_quantity`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={line.quantity}
                        onChange={(event) => setMovementForm((current) => ({
                          ...current,
                          lines: current.lines.map((currentLine, lineIndex) => (
                            lineIndex === index ? { ...currentLine, quantity: event.target.value } : currentLine
                          ))
                        }))}
                        required
                      />
                    </label>
                    <div className="modal-dialog__field">
                      <span id={`inventory-movement-line-${index}-from-location-label`}>Ubicación de origen</span>
                      <FilterSelect
                        id={`inventory-movement-line-${index}-from-location`}
                        name={`inventory_movement_lines_${index}_from_location_id`}
                        label="Ubicación de origen"
                        labelId={`inventory-movement-line-${index}-from-location-label`}
                        variant="field"
                        value={line.from_location_id}
                        options={fromLocationFieldOptions}
                        onChange={(nextValue) => setMovementForm((current) => ({
                          ...current,
                          lines: current.lines.map((currentLine, lineIndex) => (
                            lineIndex === index ? { ...currentLine, from_location_id: nextValue } : currentLine
                          ))
                        }))}
                      />
                    </div>
                    <div className="modal-dialog__field">
                      <span id={`inventory-movement-line-${index}-to-location-label`}>Ubicación de destino</span>
                      <FilterSelect
                        id={`inventory-movement-line-${index}-to-location`}
                        name={`inventory_movement_lines_${index}_to_location_id`}
                        label="Ubicación de destino"
                        labelId={`inventory-movement-line-${index}-to-location-label`}
                        variant="field"
                        value={line.to_location_id}
                        options={toLocationFieldOptions}
                        onChange={(nextValue) => setMovementForm((current) => ({
                          ...current,
                          lines: current.lines.map((currentLine, lineIndex) => (
                            lineIndex === index ? { ...currentLine, to_location_id: nextValue } : currentLine
                          ))
                        }))}
                      />
                    </div>
                    <label className="modal-dialog__field modal-dialog__field--full" htmlFor={`inventory-movement-line-${index}-notes`}>
                      <span>Notas</span>
                      <input
                        id={`inventory-movement-line-${index}-notes`}
                        name={`inventory_movement_lines_${index}_notes`}
                        type="text"
                        value={line.notes}
                        onChange={(event) => setMovementForm((current) => ({
                          ...current,
                          lines: current.lines.map((currentLine, lineIndex) => (
                            lineIndex === index ? { ...currentLine, notes: event.target.value } : currentLine
                          ))
                        }))}
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <footer className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={() => setIsCreateMovementOpen(false)}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmittingMovement}>{isSubmittingMovement ? 'Guardando...' : 'Registrar movimiento'}</button>
          </footer>
        </form>
      </ModalDialog>

      <ModalDialog
        open={isEditAssetOpen}
        title="Editar activo"
        onClose={() => setIsEditAssetOpen(false)}
        returnFocusRef={assetDetailCloseButtonRef}
        initialFocusRef={editAssetNameRef}
        size="wide"
      >
        <form className="modal-dialog__form" onSubmit={handleUpdateAsset}>
          <div className="modal-dialog__grid">
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="inventory-asset-edit-name">
              <span>Nombre del activo</span>
              <input
                ref={editAssetNameRef}
                id="inventory-asset-edit-name"
                name="inventory_asset_edit_name"
                type="text"
                value={assetEditForm.asset_name}
                onChange={(event) => setAssetEditForm((current) => ({ ...current, asset_name: event.target.value }))}
                required
              />
            </label>
            <label className="modal-dialog__field" htmlFor="inventory-asset-edit-brand">
              <span>Marca</span>
              <input
                id="inventory-asset-edit-brand"
                name="inventory_asset_edit_brand"
                type="text"
                value={assetEditForm.brand}
                onChange={(event) => setAssetEditForm((current) => ({ ...current, brand: event.target.value }))}
              />
            </label>
            <label className="modal-dialog__field" htmlFor="inventory-asset-edit-model">
              <span>Modelo</span>
              <input
                id="inventory-asset-edit-model"
                name="inventory_asset_edit_model"
                type="text"
                value={assetEditForm.model}
                onChange={(event) => setAssetEditForm((current) => ({ ...current, model: event.target.value }))}
              />
            </label>
            {detailAsset?.tracking_mode_key === 'stock' ? (
              <label className="modal-dialog__field" htmlFor="inventory-asset-edit-min-quantity">
                <span>Stock mínimo</span>
                <input
                  id="inventory-asset-edit-min-quantity"
                  name="inventory_asset_edit_min_quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={assetEditForm.min_quantity}
                  onChange={(event) => setAssetEditForm((current) => ({ ...current, min_quantity: event.target.value }))}
                />
              </label>
            ) : null}
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="inventory-asset-edit-description">
              <span>Descripción</span>
              <textarea
                id="inventory-asset-edit-description"
                name="inventory_asset_edit_description"
                rows="3"
                value={assetEditForm.description}
                onChange={(event) => setAssetEditForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="inventory-asset-edit-reason">
              <span>Motivo del cambio</span>
              <input
                id="inventory-asset-edit-reason"
                name="inventory_asset_edit_reason"
                type="text"
                value={assetEditForm.reason}
                onChange={(event) => setAssetEditForm((current) => ({ ...current, reason: event.target.value }))}
                required
              />
            </label>
          </div>
          <footer className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={() => setIsEditAssetOpen(false)}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmittingAssetEdit}>
              {isSubmittingAssetEdit ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </footer>
        </form>
      </ModalDialog>

      <ModalDialog
        open={isCatalogModalOpen}
        title="Configurar catálogos"
        onClose={() => {
          setIsCatalogModalOpen(false);
          setCatalogAssetTypeQuery('');
          setCatalogLocationTypeQuery('');
          setEditingAssetTypeId(null);
          setEditingLocationTypeId(null);
        }}
        returnFocusRef={catalogTriggerRef}
        initialFocusRef={activeCatalogTab === 'location_types' ? catalogLocationTabRef : catalogAssetTabRef}
        size="wide"
      >
        <div className="modal-dialog__form">
          <DrawerTabs
            label="Secciones de configuración"
            activeKey={activeCatalogTab}
            onChange={handleCatalogTabChange}
            className="ticket-detail__tabs inventory-catalog__tabs"
            tabs={catalogTabOptions.map((tabOption) => ({
              key: tabOption.key,
              label: tabOption.label,
              id: `inventory-catalog-tab-${tabOption.key}`,
              controls: `inventory-catalog-panel-${tabOption.key}`,
              ref: tabOption.key === 'location_types' ? catalogLocationTabRef : catalogAssetTabRef
            }))}
          />

          <section
            id="inventory-catalog-panel-asset_types"
            role="tabpanel"
            aria-labelledby="inventory-catalog-tab-asset_types"
            hidden={activeCatalogTab !== 'asset_types'}
            className="inventory-catalog"
          >
            <div className="inventory-catalog__stack">
              <section
                id="inventory-catalog-asset-editor"
                className="inventory-catalog__editor"
                aria-labelledby="inventory-catalog-asset-editor-title"
              >
                <div className="inventory-catalog__section-header inventory-catalog__section-header--editor">
                  <div className="inventory-catalog__section-copy">
                    <h3 id="inventory-catalog-asset-editor-title">
                      {editingAssetTypeId ? catalogTabCopy.asset_types.editorEditTitle : catalogTabCopy.asset_types.editorCreateTitle}
                    </h3>
                    {catalogTabCopy.asset_types.editorDescription ? <p>{catalogTabCopy.asset_types.editorDescription}</p> : null}
                  </div>
                  <div className="inventory-catalog__section-actions">
                    {editingAssetTypeId ? (
                      <button type="button" className="workspace-action workspace-action--ghost" onClick={resetAssetTypeEditor}>
                        Crear nuevo tipo
                      </button>
                    ) : null}
                  </div>
                </div>

                <form className="inventory-catalog__form" onSubmit={handleSaveAssetType}>
                  <div className="inventory-catalog__row inventory-catalog__row--identity">
                    <label className="modal-dialog__field" htmlFor="inventory-catalog-asset-type-name">
                      <span>Nombre</span>
                      <input ref={catalogAssetTypeNameRef} id="inventory-catalog-asset-type-name" name="inventory_catalog_asset_type_name" type="text" value={assetTypeForm.name} onChange={(event) => setAssetTypeForm((current) => ({ ...current, name: event.target.value }))} required />
                    </label>
                    <div className="modal-dialog__field">
                      <FieldLabel
                        label="Código corto"
                        htmlFor="inventory-catalog-asset-type-prefix"
                        body="Usa de 2 a 12 caracteres en mayúsculas, sin espacios."
                        example="LAP"
                        preview={assetTypeCodePreview}
                      />
                      <input
                        id="inventory-catalog-asset-type-prefix"
                        name="inventory_catalog_asset_type_prefix"
                        type="text"
                        value={assetTypeForm.code_prefix}
                        onChange={(event) => setAssetTypeForm((current) => ({ ...current, code_prefix: event.target.value.toUpperCase() }))}
                        placeholder="Ej. LAP"
                        maxLength={12}
                        required
                      />
                    </div>
                  </div>
                  <div className="inventory-catalog__row inventory-catalog__row--behavior">
                    <div className="modal-dialog__field">
                      <span id="inventory-catalog-asset-type-category-label">Categoría</span>
                      <FilterSelect
                        id="inventory-catalog-asset-type-category"
                        name="inventory_catalog_asset_type_category_id"
                        label="Categoría"
                        labelId="inventory-catalog-asset-type-category-label"
                        variant="field"
                        value={assetTypeForm.asset_category_id}
                        options={categoryFieldOptions}
                        onChange={(nextValue) => setAssetTypeForm((current) => ({ ...current, asset_category_id: nextValue }))}
                      />
                    </div>
                    <div className="modal-dialog__field">
                      <span id="inventory-catalog-asset-type-tracking-label">Modo de seguimiento por defecto</span>
                      <FilterSelect
                        id="inventory-catalog-asset-type-tracking"
                        name="inventory_catalog_asset_type_tracking_mode_id"
                        label="Modo de seguimiento por defecto"
                        labelId="inventory-catalog-asset-type-tracking-label"
                        variant="field"
                        value={assetTypeForm.default_tracking_mode_id}
                        options={trackingModeCatalogFieldOptions}
                        onChange={(nextValue) => setAssetTypeForm((current) => ({ ...current, default_tracking_mode_id: nextValue }))}
                      />
                    </div>
                  </div>
                  <label className="modal-dialog__field modal-dialog__field--full" htmlFor="inventory-catalog-asset-type-description">
                    <span>Descripción</span>
                    <textarea id="inventory-catalog-asset-type-description" name="inventory_catalog_asset_type_description" rows="3" value={assetTypeForm.description} onChange={(event) => setAssetTypeForm((current) => ({ ...current, description: event.target.value }))} />
                  </label>
                  <div className="modal-dialog__field modal-dialog__field--full inventory-catalog__actions">
                    <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmittingCatalogAssetType}>
                      {isSubmittingCatalogAssetType ? 'Guardando...' : (editingAssetTypeId ? 'Guardar cambios' : 'Crear tipo de activo')}
                    </button>
                    {editingAssetTypeId ? (
                      <button type="button" className="workspace-action workspace-action--ghost" onClick={resetAssetTypeEditor}>
                        Cancelar edición
                      </button>
                    ) : null}
                  </div>
                </form>
              </section>

              <section
                className="inventory-catalog__existing"
                aria-labelledby="inventory-catalog-asset-existing-title"
                aria-describedby="inventory-catalog-asset-existing-help"
              >
                <div className="inventory-catalog__existing-header">
                  <div className="inventory-catalog__section-copy">
                    <div className="inventory-catalog__existing-heading">
                      <h3 id="inventory-catalog-asset-existing-title">{catalogTabCopy.asset_types.recordsTitle}</h3>
                      <span
                        id="inventory-catalog-asset-existing-count"
                        className="inventory-catalog__existing-count"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {filteredCatalogAssetTypes.length === catalogAssetTypes.length ? `${catalogAssetTypes.length} tipos` : `${filteredCatalogAssetTypes.length} de ${catalogAssetTypes.length}`}
                      </span>
                    </div>
                    <p className="inventory-catalog__existing-note">Selecciona un tipo para cargarlo en el editor.</p>
                    <p id="inventory-catalog-asset-existing-help" className="sr-only">
                      Usa Editar para cargar un tipo en el formulario superior. Cuando un registro esté cargado, verás la marca Cargado en el editor. Desactivar cambia su disponibilidad sin borrarlo.
                    </p>
                  </div>
                  <div className="inventory-catalog__existing-toolbar">
                    <label className="sr-only" htmlFor="inventory-catalog-asset-type-search">
                      Buscar tipos de activo existentes
                    </label>
                    <input
                      id="inventory-catalog-asset-type-search"
                      className="inventory-catalog__existing-search"
                      type="search"
                      name="inventory_catalog_asset_type_search"
                      value={catalogAssetTypeQuery}
                      onChange={(event) => setCatalogAssetTypeQuery(event.target.value)}
                      placeholder="Buscar por nombre o código"
                      aria-describedby="inventory-catalog-asset-existing-count inventory-catalog-asset-existing-help"
                    />
                  </div>
                </div>

                <ul
                  className="inventory-catalog__existing-list"
                  role="list"
                  aria-describedby="inventory-catalog-asset-existing-help inventory-catalog-asset-existing-count"
                >
                  {filteredCatalogAssetTypes.length ? filteredCatalogAssetTypes.map((assetType) => {
                    const isEditing = editingAssetTypeId === Number(assetType.id);
                    const metaId = `inventory-catalog-asset-type-meta-${assetType.id}`;
                    const statusId = `inventory-catalog-asset-type-status-${assetType.id}`;

                    return (
                      <li
                        key={assetType.id}
                        className={`inventory-catalog__existing-row${isEditing ? ' inventory-catalog__existing-row--active' : ''}`}
                      >
                        <button
                          type="button"
                          className="inventory-catalog__existing-select"
                          onClick={() => openAssetTypeEdit(assetType)}
                          aria-label={isEditing ? `Volver al editor del tipo de activo ${assetType.name}` : `Cargar tipo de activo ${assetType.name} en el editor`}
                          aria-controls="inventory-catalog-asset-editor"
                          aria-describedby={isEditing ? `${metaId} ${statusId}` : metaId}
                        >
                          <span className="inventory-catalog__existing-info">
                            {isEditing ? <span id={statusId} className="inventory-catalog__existing-flag">Cargado en el editor</span> : null}
                            <span className="inventory-catalog__existing-name">{assetType.name}</span>
                            <span id={metaId} className="inventory-catalog__existing-meta">
                              <span>{assetType.code_prefix}</span>
                              <span>{assetType.category_name}</span>
                              <span>{assetType.default_tracking_mode_name || assetType.default_tracking_mode_key}</span>
                            </span>
                          </span>
                          <span className="inventory-catalog__existing-edit" aria-hidden="true">
                            <span>{isEditing ? 'Volver al editor' : 'Editar'}</span>
                            <ChevronRight size={16} strokeWidth={1.9} />
                          </span>
                        </button>
                        <div className="inventory-catalog__existing-actions">
                          <button
                            type="button"
                            className="workspace-action workspace-action--ghost inventory-catalog__existing-state"
                            onClick={() => void handleToggleAssetTypeActive(assetType)}
                            aria-label={`${assetType.is_active ? 'Desactivar' : 'Reactivar'} ${assetType.name}`}
                          >
                            {assetType.is_active ? 'Desactivar' : 'Reactivar'}
                          </button>
                        </div>
                      </li>
                    );
                  }) : (
                    <li className="inventory-catalog__existing-empty">No hay tipos que coincidan con la búsqueda.</li>
                  )}
                </ul>
              </section>
            </div>
          </section>

          <section
            id="inventory-catalog-panel-location_types"
            role="tabpanel"
            aria-labelledby="inventory-catalog-tab-location_types"
            hidden={activeCatalogTab !== 'location_types'}
            className="inventory-catalog"
          >
            <div className="inventory-catalog__stack">
              <section
                id="inventory-catalog-location-editor"
                className="inventory-catalog__editor"
                aria-labelledby="inventory-catalog-location-editor-title"
              >
                <div className="inventory-catalog__section-header inventory-catalog__section-header--editor">
                  <div className="inventory-catalog__section-copy">
                    <h3 id="inventory-catalog-location-editor-title">
                      {editingLocationTypeId ? catalogTabCopy.location_types.editorEditTitle : catalogTabCopy.location_types.editorCreateTitle}
                    </h3>
                    {catalogTabCopy.location_types.editorDescription ? <p>{catalogTabCopy.location_types.editorDescription}</p> : null}
                  </div>
                  <div className="inventory-catalog__section-actions">
                    {editingLocationTypeId ? (
                      <button type="button" className="workspace-action workspace-action--ghost" onClick={resetLocationTypeEditor}>
                        Crear nuevo tipo
                      </button>
                    ) : null}
                  </div>
                </div>

                <form className="inventory-catalog__form" onSubmit={handleSaveLocationType}>
                  <div className="inventory-catalog__row inventory-catalog__row--identity">
                    <label className="modal-dialog__field" htmlFor="inventory-catalog-location-type-name">
                      <span>Nombre</span>
                      <input ref={catalogLocationTypeNameRef} id="inventory-catalog-location-type-name" name="inventory_catalog_location_type_name" type="text" value={locationTypeForm.name} onChange={(event) => setLocationTypeForm((current) => ({ ...current, name: event.target.value }))} required />
                    </label>
                    <div className="modal-dialog__field">
                      <FieldLabel
                        label="Código corto"
                        htmlFor="inventory-catalog-location-type-prefix"
                        body="Usa de 2 a 12 caracteres en mayúsculas, sin espacios."
                        example="ALM"
                        preview={locationTypeCodePreview}
                      />
                      <input
                        id="inventory-catalog-location-type-prefix"
                        name="inventory_catalog_location_type_prefix"
                        type="text"
                        value={locationTypeForm.code_prefix}
                        onChange={(event) => setLocationTypeForm((current) => ({ ...current, code_prefix: event.target.value.toUpperCase() }))}
                        placeholder="Ej. ALM"
                        maxLength={12}
                        required
                      />
                    </div>
                  </div>
                  <label className="modal-dialog__field modal-dialog__field--full" htmlFor="inventory-catalog-location-type-description">
                    <span>Descripción</span>
                    <textarea id="inventory-catalog-location-type-description" name="inventory_catalog_location_type_description" rows="3" value={locationTypeForm.description} onChange={(event) => setLocationTypeForm((current) => ({ ...current, description: event.target.value }))} />
                  </label>
                  <div className="modal-dialog__field modal-dialog__field--full inventory-catalog__actions">
                    <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmittingCatalogLocationType}>
                      {isSubmittingCatalogLocationType ? 'Guardando...' : (editingLocationTypeId ? 'Guardar cambios' : 'Crear tipo de ubicación')}
                    </button>
                    {editingLocationTypeId ? (
                      <button type="button" className="workspace-action workspace-action--ghost" onClick={resetLocationTypeEditor}>
                        Cancelar edición
                      </button>
                    ) : null}
                  </div>
                </form>
              </section>

              <section
                className="inventory-catalog__existing"
                aria-labelledby="inventory-catalog-location-existing-title"
                aria-describedby="inventory-catalog-location-existing-help"
              >
                <div className="inventory-catalog__existing-header">
                  <div className="inventory-catalog__section-copy">
                    <div className="inventory-catalog__existing-heading">
                      <h3 id="inventory-catalog-location-existing-title">{catalogTabCopy.location_types.recordsTitle}</h3>
                      <span
                        id="inventory-catalog-location-existing-count"
                        className="inventory-catalog__existing-count"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {filteredCatalogLocationTypes.length === catalogLocationTypes.length ? `${catalogLocationTypes.length} tipos` : `${filteredCatalogLocationTypes.length} de ${catalogLocationTypes.length}`}
                      </span>
                    </div>
                    <p className="inventory-catalog__existing-note">Selecciona un tipo para cargarlo en el editor.</p>
                    <p id="inventory-catalog-location-existing-help" className="sr-only">
                      Usa Editar para cargar un tipo en el formulario superior. Cuando un registro esté cargado, verás la marca Cargado en el editor. Desactivar cambia su disponibilidad sin borrarlo.
                    </p>
                  </div>
                  <div className="inventory-catalog__existing-toolbar">
                    <label className="sr-only" htmlFor="inventory-catalog-location-type-search">
                      Buscar tipos de ubicación existentes
                    </label>
                    <input
                      id="inventory-catalog-location-type-search"
                      className="inventory-catalog__existing-search"
                      type="search"
                      name="inventory_catalog_location_type_search"
                      value={catalogLocationTypeQuery}
                      onChange={(event) => setCatalogLocationTypeQuery(event.target.value)}
                      placeholder="Buscar por nombre o código"
                      aria-describedby="inventory-catalog-location-existing-count inventory-catalog-location-existing-help"
                    />
                  </div>
                </div>

                <ul
                  className="inventory-catalog__existing-list"
                  role="list"
                  aria-describedby="inventory-catalog-location-existing-help inventory-catalog-location-existing-count"
                >
                  {filteredCatalogLocationTypes.length ? filteredCatalogLocationTypes.map((locationType) => {
                    const isEditing = editingLocationTypeId === Number(locationType.id);
                    const metaId = `inventory-catalog-location-type-meta-${locationType.id}`;
                    const statusId = `inventory-catalog-location-type-status-${locationType.id}`;

                    return (
                      <li
                        key={locationType.id}
                        className={`inventory-catalog__existing-row${isEditing ? ' inventory-catalog__existing-row--active' : ''}`}
                      >
                        <button
                          type="button"
                          className="inventory-catalog__existing-select"
                          onClick={() => openLocationTypeEdit(locationType)}
                          aria-label={isEditing ? `Volver al editor del tipo de ubicación ${locationType.name}` : `Cargar tipo de ubicación ${locationType.name} en el editor`}
                          aria-controls="inventory-catalog-location-editor"
                          aria-describedby={isEditing ? `${metaId} ${statusId}` : metaId}
                        >
                          <span className="inventory-catalog__existing-info">
                            {isEditing ? <span id={statusId} className="inventory-catalog__existing-flag">Cargado en el editor</span> : null}
                            <span className="inventory-catalog__existing-name">{locationType.name}</span>
                            <span id={metaId} className="inventory-catalog__existing-meta">
                              <span>{locationType.code_prefix}</span>
                              {locationType.description ? <span>{locationType.description}</span> : null}
                            </span>
                          </span>
                          <span className="inventory-catalog__existing-edit" aria-hidden="true">
                            <span>{isEditing ? 'Volver al editor' : 'Editar'}</span>
                            <ChevronRight size={16} strokeWidth={1.9} />
                          </span>
                        </button>
                        <div className="inventory-catalog__existing-actions">
                          <button
                            type="button"
                            className="workspace-action workspace-action--ghost inventory-catalog__existing-state"
                            onClick={() => void handleToggleLocationTypeActive(locationType)}
                            aria-label={`${locationType.is_active ? 'Desactivar' : 'Reactivar'} ${locationType.name}`}
                          >
                            {locationType.is_active ? 'Desactivar' : 'Reactivar'}
                          </button>
                        </div>
                      </li>
                    );
                  }) : (
                    <li className="inventory-catalog__existing-empty">No hay tipos que coincidan con la búsqueda.</li>
                  )}
                </ul>
              </section>
            </div>
          </section>
        </div>
      </ModalDialog>

      <ModalDialog
        open={isCreateLocationOpen}
        title={editingLocationId ? 'Editar ubicación' : 'Nueva ubicación'}
        onClose={() => {
          setIsCreateLocationOpen(false);
          setEditingLocationId(null);
        }}
        returnFocusRef={createLocationTriggerRef}
        initialFocusRef={createLocationTypeSelectRef}
        size="wide"
      >
        <form className="modal-dialog__form" onSubmit={handleSaveLocation}>
          <div className="modal-dialog__grid">
            <div className="modal-dialog__field">
              <span id="inventory-location-type-label">Tipo de ubicación</span>
              <FilterSelect
                ref={createLocationTypeSelectRef}
                id="inventory-location-type"
                name="inventory_location_type_id"
                label="Tipo de ubicación"
                labelId="inventory-location-type-label"
                variant="field"
                value={locationForm.location_type_id}
                options={locationTypeFieldOptions}
                onChange={(nextValue) => setLocationForm((current) => ({ ...current, location_type_id: nextValue }))}
              />
            </div>
            {editingLocationId ? (
              <div className="modal-dialog__field">
                <span id="inventory-location-status-label">Estado</span>
                <FilterSelect
                  id="inventory-location-status"
                  name="inventory_location_status"
                  label="Estado"
                  labelId="inventory-location-status-label"
                  variant="field"
                  value={locationForm.status}
                  options={locationStatusFieldOptions}
                  onChange={(nextValue) => setLocationForm((current) => ({ ...current, status: nextValue }))}
                />
              </div>
            ) : null}
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="inventory-location-name">
              <span>Nombre</span>
              <input id="inventory-location-name" name="inventory_location_name" type="text" value={locationForm.name} onChange={(event) => setLocationForm((current) => ({ ...current, name: event.target.value }))} required />
            </label>
            <div className="modal-dialog__field">
              <FieldLabel
                label="Clave"
                htmlFor="inventory-location-key"
                body="Es el segmento final del código de la ubicación y ayuda a distinguir áreas o puntos físicos."
                example="PRINCIPAL"
                preview={locationKeyCodePreview}
              />
              <input
                id="inventory-location-key"
                name="inventory_location_key"
                type="text"
                value={locationForm.location_key}
                onChange={(event) => setLocationForm((current) => ({ ...current, location_key: event.target.value }))}
                placeholder="Ej. PRINCIPAL"
                required
              />
            </div>
            <div className="modal-dialog__field">
              <span id="inventory-location-parent-label">Ubicación padre</span>
              <FilterSelect
                id="inventory-location-parent"
                name="inventory_location_parent_id"
                label="Ubicación padre"
                labelId="inventory-location-parent-label"
                variant="field"
                value={locationForm.parent_location_id}
                options={parentLocationFieldOptions}
                onChange={(nextValue) => setLocationForm((current) => ({ ...current, parent_location_id: nextValue }))}
              />
            </div>
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="inventory-location-description">
              <span>Descripción</span>
              <textarea id="inventory-location-description" name="inventory_location_description" rows="3" value={locationForm.description} onChange={(event) => setLocationForm((current) => ({ ...current, description: event.target.value }))} />
            </label>
          </div>
          <footer className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={() => {
              setIsCreateLocationOpen(false);
              setEditingLocationId(null);
            }}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmittingLocation}>
              {isSubmittingLocation ? 'Guardando...' : (editingLocationId ? 'Guardar cambios' : 'Registrar ubicación')}
            </button>
          </footer>
        </form>
      </ModalDialog>

      <ModalDialog
        open={isCreateUnitsOpen}
        title="Registrar unidades"
        onClose={() => setIsCreateUnitsOpen(false)}
        returnFocusRef={assetDetailCloseButtonRef}
        initialFocusRef={createUnitLocationSelectRef}
        size="wide"
      >
        <form className="modal-dialog__form" onSubmit={handleCreateUnits}>
          <section className="inventory-modal__lines" aria-label="Partidas de unidades serializadas">
            <header>
              <h3>Unidades</h3>
              <button
                type="button"
                className="workspace-action workspace-action--ghost"
                onClick={() => setUnitLines((current) => ([
                  ...current,
                  {
                    ...defaultUnitLine,
                    location_id: locations[0]?.id ? String(locations[0].id) : ''
                  }
                ]))}
              >
                <Plus size={14} aria-hidden="true" />
                <span>Agregar unidad</span>
              </button>
            </header>
            <div className="inventory-modal__lines-grid">
              {unitLines.map((line, index) => (
                <article key={`unit-line-${index}`} className="inventory-modal__line-card">
                  <header>
                    <strong>Unidad {index + 1}</strong>
                    {unitLines.length > 1 ? (
                      <button
                        type="button"
                        className="inventory-modal__line-remove"
                        onClick={() => setUnitLines((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                        aria-label={`Eliminar unidad ${index + 1}`}
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    ) : null}
                  </header>
                  <div className="inventory-modal__line-fields">
                    <label className="modal-dialog__field" htmlFor={`inventory-unit-${index}-serial`}>
                      <span>Serie de fabricante</span>
                      <input id={`inventory-unit-${index}-serial`} name={`inventory_unit_${index}_serial`} type="text" value={line.serial_number} onChange={(event) => setUnitLines((current) => current.map((currentLine, currentIndex) => currentIndex === index ? { ...currentLine, serial_number: event.target.value } : currentLine))} />
                    </label>
                    <div className="modal-dialog__field">
                      <span id={`inventory-unit-${index}-location-label`}>Ubicación inicial</span>
                      <FilterSelect
                        ref={index === 0 ? createUnitLocationSelectRef : undefined}
                        id={`inventory-unit-${index}-location`}
                        name={`inventory_unit_${index}_location_id`}
                        label="Ubicación inicial"
                        labelId={`inventory-unit-${index}-location-label`}
                        variant="field"
                        value={line.location_id}
                        options={locationFieldOptions.filter((option) => option.key)}
                        onChange={(nextValue) => setUnitLines((current) => current.map((currentLine, currentIndex) => currentIndex === index ? { ...currentLine, location_id: nextValue } : currentLine))}
                      />
                    </div>
                    <div className="modal-dialog__field">
                      <span id={`inventory-unit-${index}-status-label`}>Estado inicial</span>
                      <FilterSelect
                        id={`inventory-unit-${index}-status`}
                        name={`inventory_unit_${index}_status_key`}
                        label="Estado inicial"
                        labelId={`inventory-unit-${index}-status-label`}
                        variant="field"
                        value={line.status_key}
                        options={unitStatusFieldOptions}
                        onChange={(nextValue) => setUnitLines((current) => current.map((currentLine, currentIndex) => currentIndex === index ? { ...currentLine, status_key: nextValue } : currentLine))}
                      />
                    </div>
                    <label className="modal-dialog__field modal-dialog__field--full" htmlFor={`inventory-unit-${index}-notes`}>
                      <span>Notas</span>
                      <input id={`inventory-unit-${index}-notes`} name={`inventory_unit_${index}_notes`} type="text" value={line.notes} onChange={(event) => setUnitLines((current) => current.map((currentLine, currentIndex) => currentIndex === index ? { ...currentLine, notes: event.target.value } : currentLine))} />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <footer className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={() => setIsCreateUnitsOpen(false)}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmittingUnits}>
              {isSubmittingUnits ? 'Guardando...' : 'Registrar unidades'}
            </button>
          </footer>
        </form>
      </ModalDialog>

      <ModalDialog
        open={isCreateAssignmentOpen}
        title={isGlobalAssignmentFlow ? 'Nuevo resguardo' : 'Asignar activo'}
        onClose={() => {
          setIsCreateAssignmentOpen(false);
          setIsGlobalAssignmentFlow(false);
        }}
        returnFocusRef={createAssignmentTriggerRef}
        initialFocusRef={createAssignmentUnitSelectRef}
        size="wide"
      >
        <form className="modal-dialog__form" onSubmit={handleCreateAssignment}>
          <div className="modal-dialog__grid">
            <div className="modal-dialog__field">
              <span id="inventory-assignment-unit-label">Unidad serializada</span>
              <FilterSelect
                ref={createAssignmentUnitSelectRef}
                id="inventory-assignment-unit"
                name="inventory_assignment_asset_unit_id"
                label="Unidad serializada"
                labelId="inventory-assignment-unit-label"
                variant="field"
                value={assignmentForm.asset_unit_id}
                options={isGlobalAssignmentFlow ? assignableAssetUnitFieldOptions : availableAssetUnitFieldOptions}
                onChange={handleAssignmentUnitChange}
              />
            </div>
            <div className="modal-dialog__field">
              <span id="inventory-assignment-collaborator-label">Colaborador</span>
              <FilterSelect
                id="inventory-assignment-collaborator"
                name="inventory_assignment_collaborator_id"
                label="Colaborador"
                labelId="inventory-assignment-collaborator-label"
                variant="field"
                value={assignmentForm.collaborator_id}
                options={collaboratorFieldOptions}
                onChange={(nextValue) => setAssignmentForm((current) => ({ ...current, collaborator_id: nextValue }))}
              />
            </div>
            <div className="modal-dialog__field">
              <span id="inventory-assignment-location-label">Ubicación de entrega</span>
              <FilterSelect
                id="inventory-assignment-location"
                name="inventory_assignment_location_id"
                label="Ubicación de entrega"
                labelId="inventory-assignment-location-label"
                variant="field"
                value={assignmentForm.location_id}
                options={locationFieldOptions.filter((option) => option.key)}
                onChange={(nextValue) => setAssignmentForm((current) => ({ ...current, location_id: nextValue }))}
              />
            </div>
            <label className="modal-dialog__field" htmlFor="inventory-assignment-at">
              <span>Fecha y hora</span>
              <input id="inventory-assignment-at" name="inventory_assignment_assigned_at" type="datetime-local" value={assignmentForm.assigned_at} onChange={(event) => setAssignmentForm((current) => ({ ...current, assigned_at: event.target.value }))} />
            </label>
            <div className="modal-dialog__field">
              <FieldLabel
                label="Retorno esperado"
                htmlFor="inventory-assignment-expected-return"
                body="Úsalo cuando el resguardo sea temporal para dejar una fecha estimada de regreso y facilitar el seguimiento."
              />
              <input id="inventory-assignment-expected-return" name="inventory_assignment_expected_return_at" type="datetime-local" value={assignmentForm.expected_return_at} onChange={(event) => setAssignmentForm((current) => ({ ...current, expected_return_at: event.target.value }))} />
            </div>
            <div className="modal-dialog__field">
              <FieldLabel
                label="Condición de entrega"
                htmlFor="inventory-assignment-delivery-condition"
                body="Describe el estado físico, accesorios o detalles relevantes con los que se entrega la unidad."
              />
              <input id="inventory-assignment-delivery-condition" name="inventory_assignment_delivery_condition" type="text" value={assignmentForm.delivery_condition} onChange={(event) => setAssignmentForm((current) => ({ ...current, delivery_condition: event.target.value }))} />
            </div>
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="inventory-assignment-notes">
              <span>Notas</span>
              <textarea id="inventory-assignment-notes" name="inventory_assignment_notes" rows="3" value={assignmentForm.notes} onChange={(event) => setAssignmentForm((current) => ({ ...current, notes: event.target.value }))} />
            </label>
          </div>
          <footer className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={() => setIsCreateAssignmentOpen(false)}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmittingAssignment}>
              {isSubmittingAssignment ? 'Guardando...' : 'Crear resguardo'}
            </button>
          </footer>
        </form>
      </ModalDialog>

      <ModalDialog
        open={isCloseAssignmentOpen}
        title="Cerrar resguardo"
        onClose={() => setIsCloseAssignmentOpen(false)}
        returnFocusRef={assetDetailCloseButtonRef}
        initialFocusRef={closeAssignmentUnitSelectRef}
        size="wide"
      >
        <form className="modal-dialog__form" onSubmit={handleCloseAssignment}>
          <div className="modal-dialog__grid">
            <div className="modal-dialog__field">
              <span id="inventory-assignment-close-unit-label">Unidad serializada</span>
              <FilterSelect
                ref={closeAssignmentUnitSelectRef}
                id="inventory-assignment-close-unit"
                name="inventory_assignment_close_asset_unit_id"
                label="Unidad serializada"
                labelId="inventory-assignment-close-unit-label"
                variant="field"
                value={assignmentCloseForm.asset_unit_id}
                options={globalAssignedAssetUnitFieldOptions}
                onChange={(nextValue) => setAssignmentCloseForm((current) => ({ ...current, asset_unit_id: nextValue }))}
              />
            </div>
            <div className="modal-dialog__field">
              <span id="inventory-assignment-close-location-label">Ubicación de retorno</span>
              <FilterSelect
                id="inventory-assignment-close-location"
                name="inventory_assignment_close_location_id"
                label="Ubicación de retorno"
                labelId="inventory-assignment-close-location-label"
                variant="field"
                value={assignmentCloseForm.location_id}
                options={locationFieldOptions.filter((option) => option.key)}
                onChange={(nextValue) => setAssignmentCloseForm((current) => ({ ...current, location_id: nextValue }))}
              />
            </div>
            <label className="modal-dialog__field" htmlFor="inventory-assignment-close-returned-at">
              <span>Fecha y hora</span>
              <input id="inventory-assignment-close-returned-at" name="inventory_assignment_close_returned_at" type="datetime-local" value={assignmentCloseForm.returned_at} onChange={(event) => setAssignmentCloseForm((current) => ({ ...current, returned_at: event.target.value }))} />
            </label>
            <div className="modal-dialog__field">
              <FieldLabel
                label="Condición de devolución"
                htmlFor="inventory-assignment-close-return-condition"
                body="Registra cómo vuelve la unidad para dejar constancia del estado físico al cerrar el resguardo."
              />
              <input id="inventory-assignment-close-return-condition" name="inventory_assignment_close_return_condition" type="text" value={assignmentCloseForm.return_condition} onChange={(event) => setAssignmentCloseForm((current) => ({ ...current, return_condition: event.target.value }))} />
            </div>
            {selectedActiveAssignment ? (
              <div className="modal-dialog__field modal-dialog__field--full inventory-form__note">
                Resguardo activo: {selectedActiveAssignment.collaborator?.full_name || 'Sin colaborador'} · entregado {formatDateTime(selectedActiveAssignment.assigned_at)}
              </div>
            ) : null}
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="inventory-assignment-close-notes">
              <span>Notas</span>
              <textarea id="inventory-assignment-close-notes" name="inventory_assignment_close_notes" rows="3" value={assignmentCloseForm.notes} onChange={(event) => setAssignmentCloseForm((current) => ({ ...current, notes: event.target.value }))} />
            </label>
          </div>
          <footer className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={() => setIsCloseAssignmentOpen(false)}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmittingAssignmentClose}>
              {isSubmittingAssignmentClose ? 'Guardando...' : 'Cerrar resguardo'}
            </button>
          </footer>
        </form>
      </ModalDialog>

      <ModalDialog
        open={isUnitStatusOpen}
        title="Actualizar estado de unidad"
        onClose={() => {
          setIsUnitStatusOpen(false);
          setUnitStatusForm(defaultUnitStatusForm);
        }}
        returnFocusRef={assetDetailCloseButtonRef}
        initialFocusRef={unitStatusForm.status_key === 'available' ? unitStatusLocationSelectRef : unitStatusReasonRef}
        size="wide"
      >
        <form className="modal-dialog__form" onSubmit={handleUpdateUnitStatus}>
          <div className="modal-dialog__grid">
            <div className="modal-dialog__field">
              <span id="inventory-unit-status-target-label">Nuevo estado</span>
              <div className="inventory-form__read-only" aria-labelledby="inventory-unit-status-target-label">
                {toOperationalStatusLabel(unitStatusForm.status_key)}
              </div>
            </div>
            <div className="modal-dialog__field">
              <span id="inventory-unit-status-unit-label">Unidad</span>
              <div className="inventory-form__read-only" aria-labelledby="inventory-unit-status-unit-label">
                {selectedAssetUnits.find((unit) => String(unit.id) === String(unitStatusForm.asset_unit_id))?.asset_tag || 'Sin unidad'}
              </div>
            </div>
            {unitStatusForm.status_key === 'available' ? (
              <div className="modal-dialog__field">
                <span id="inventory-unit-status-location-label">Ubicación</span>
                <FilterSelect
                  ref={unitStatusLocationSelectRef}
                  id="inventory-unit-status-location"
                  name="inventory_unit_status_location_id"
                  label="Ubicación"
                  labelId="inventory-unit-status-location-label"
                  variant="field"
                  value={unitStatusForm.location_id}
                  options={locationFieldOptions.filter((option) => option.key)}
                  onChange={(nextValue) => setUnitStatusForm((current) => ({ ...current, location_id: nextValue }))}
                />
              </div>
            ) : null}
            <label className="modal-dialog__field" htmlFor="inventory-unit-status-happened-at">
              <span>Fecha y hora</span>
              <input
                id="inventory-unit-status-happened-at"
                name="inventory_unit_status_happened_at"
                type="datetime-local"
                value={unitStatusForm.happened_at}
                onChange={(event) => setUnitStatusForm((current) => ({ ...current, happened_at: event.target.value }))}
              />
            </label>
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="inventory-unit-status-reason">
              <span>Motivo</span>
              <input
                ref={unitStatusReasonRef}
                id="inventory-unit-status-reason"
                name="inventory_unit_status_reason"
                type="text"
                value={unitStatusForm.reason}
                onChange={(event) => setUnitStatusForm((current) => ({ ...current, reason: event.target.value }))}
                required
              />
            </label>
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="inventory-unit-status-notes">
              <span>Notas</span>
              <textarea
                id="inventory-unit-status-notes"
                name="inventory_unit_status_notes"
                rows="3"
                value={unitStatusForm.notes}
                onChange={(event) => setUnitStatusForm((current) => ({ ...current, notes: event.target.value }))}
              />
            </label>
          </div>
          <footer className="modal-dialog__actions">
            <button
              type="button"
              className="workspace-action workspace-action--ghost"
              onClick={() => {
                setIsUnitStatusOpen(false);
                setUnitStatusForm(defaultUnitStatusForm);
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmittingUnitStatus}>
              {isSubmittingUnitStatus ? 'Guardando...' : 'Aplicar cambio'}
            </button>
          </footer>
        </form>
      </ModalDialog>

    </section>
  );
};

export default InventoryPage;
