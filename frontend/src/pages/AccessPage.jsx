import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bath,
  Building2,
  CircleOff,
  Factory,
  History,
  IdCard,
  Plus,
  ShieldCheck,
  X,
  Undo2,
  UserCog,
  UserPlus,
  UserMinus,
  Wrench
} from 'lucide-react';

import { EmptyState } from '../components/primitives/EmptyState.jsx';
import { DrawerTabs } from '../components/primitives/DrawerTabs.jsx';
import { FilterChipGroup } from '../components/primitives/FilterChipGroup.jsx';
import { FilterSelect } from '../components/primitives/FilterSelect.jsx';
import { InlineNotice } from '../components/primitives/InlineNotice.jsx';
import { ModalDialog } from '../components/primitives/ModalDialog.jsx';
import { OperationalTablePanel } from '../components/primitives/OperationalTablePanel.jsx';
import { PaginationBar } from '../components/primitives/PaginationBar.jsx';
import { SegmentedControl } from '../components/primitives/SegmentedControl.jsx';
import { ToolbarSearchField } from '../components/primitives/ToolbarSearchField.jsx';
import { WorkspaceNoticeRail } from '../components/primitives/WorkspaceNoticeRail.jsx';
import { WorkspaceSplitLayout } from '../components/primitives/WorkspaceSplitLayout.jsx';
import { useAuth } from '../hooks/useAuth.js';
import {
  createAccessEnrollment,
  createAccessMedia,
  grantCollaboratorAccess,
  getAccessCatalog,
  isAccessAuthError,
  listAccessEnrollments,
  listAccessEvents,
  listAccessMedia,
  listAccessMediaAssignments,
  markAccessMediaAssignmentNotReturned,
  offboardCollaboratorAccess,
  returnAccessMediaAssignment,
  updateAccessEnrollmentStatus
} from '../services/accessService.js';
import { createCollaborator, isCollaboratorAuthError, listCollaborators } from '../services/collaboratorService.js';
import { isAuthError as isInventoryAuthError, listInventoryAssetUnits, listLocations } from '../services/inventoryService.js';
import { hasPermission } from '../utils/accessControl.js';
import { stripSeedMarkerCopy } from '../utils/detailCopy.js';
import {
  createWorkspaceErrorTitle,
  createWorkspaceLoadingState,
  createWorkspaceNoRecordsState
} from '../utils/workspaceStateCopy.js';

const accessViewOptions = [
  { key: 'enrollments', label: 'Colaboradores', icon: UserCog },
  { key: 'media', label: 'Medios', icon: IdCard },
  { key: 'history', label: 'Historial', icon: History }
];

const visibleAccessSystemKeys = ['production', 'offices', 'bathroom'];

const validAccessViewKeys = new Set(accessViewOptions.map((option) => option.key));
const resolveAccessView = (value) => {
  const normalized = String(value || '').trim();
  if (normalized === 'assignments') {
    return 'enrollments';
  }

  return validAccessViewKeys.has(normalized) ? normalized : 'enrollments';
};

const assignmentStatusOptions = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'returned', label: 'Devueltos' },
  { key: 'not_returned', label: 'No devueltos' }
];

const enrollmentStatusOptions = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'suspended', label: 'Suspendidos' },
  { key: 'deactivated', label: 'Desactivados' }
];

const ACCESS_PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_ACCESS_PAGE_SIZE = ACCESS_PAGE_SIZE_OPTIONS[1];
const ACCESS_DETAIL_ID = 'access-detail-panel';
const ACCESS_DETAIL_TITLE_ID = 'access-detail-title';

const accessLoadingState = createWorkspaceLoadingState('accesos');
const accessLoadErrorTitle = createWorkspaceErrorTitle('los accesos');
const accessAssignmentsNoRecordsState = createWorkspaceNoRecordsState(
  'asignaciones',
  'Da acceso al primer colaborador para comenzar a controlar la entrega operativa de medios y altas.'
);
const accessMediaNoRecordsState = createWorkspaceNoRecordsState(
  'medios',
  'Los RFID se registran automáticamente cuando se asignan desde Dar acceso.'
);
const accessEnrollmentsNoRecordsState = createWorkspaceNoRecordsState(
  'colaboradores con acceso',
  'Usa Dar acceso para habilitar el primer acceso operativo.'
);
const accessEventsNoRecordsState = createWorkspaceNoRecordsState(
  'eventos',
  'Los eventos de accesos aparecerán aquí conforme registres medios, asignaciones, devoluciones y bajas.'
);

const defaultCatalog = {
  systems: [],
  medium_types: [],
  media_statuses: [],
  assignment_statuses: [],
  enrollment_statuses: [],
  employee_id_availability: {
    min_employee_id: 1,
    max_employee_id: 20000,
    next_available_id: null,
    used_count: 0,
    available_count: 20000,
    preview_ranges: [],
    has_more_ranges: false
  }
};

const defaultCreateMediaForm = {
  medium_type_key: 'chip',
  asset_unit_id: '',
  tag_code: '',
  notes: ''
};

const defaultEnrollmentForm = {
  collaborator_id: '',
  access_system_id: '',
  media_assignment_id: '',
  status_key: 'active',
  activated_at: '',
  notes: ''
};

const defaultCreateCollaboratorForm = {
  employee_id: '',
  first_name: '',
  last_name: '',
  area_name: ''
};

const defaultGrantAccessForm = {
  collaborator_id: '',
  collaborator_create: { ...defaultCreateCollaboratorForm },
  deactivate_enrollment_ids: [],
  asset_unit_id: '',
  requires_rfid_override: false,
  systems: [],
  assigned_at: '',
  notes: ''
};

const defaultReturnForm = {
  location_id: '',
  returned_at: '',
  notes: ''
};

const defaultNotReturnedForm = {
  resolved_at: '',
  notes: ''
};

const defaultEnrollmentStatusForm = {
  status_key: '',
  media_assignment_id: '',
  activated_at: '',
  deactivated_at: '',
  notes: ''
};

const defaultOffboardForm = {
  media_resolution: 'returned',
  location_id: '',
  offboarded_at: '',
  notes: ''
};

const normalizeErrorMessage = (error, fallback) => (
  String(error?.message || '').trim() || fallback
);

const normalizeFieldValue = (value) => String(value || '').trim();

const toPositiveNumberOrNull = (value) => {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    return null;
  }

  return normalized;
};

const formatListConjunction = (values) => {
  const items = Array.isArray(values)
    ? values.map((value) => String(value || '').trim()).filter(Boolean)
    : [];

  if (items.length === 0) {
    return '';
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} y ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
};

const buildFieldErrorId = (fieldId) => `${fieldId}-error`;

const toDateTimeLocalValue = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - (offset * 60 * 1000));
  return adjusted.toISOString().slice(0, 16);
};

const formatDateTime = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(parsed);
};

const formatDateOnly = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium'
  }).format(parsed);
};

const clampPage = (page, totalPages) => {
  if (!Number.isInteger(page) || page <= 0) {
    return 1;
  }

  if (totalPages <= 0) {
    return 1;
  }

  return Math.min(page, totalPages);
};

const paginateRows = (rows, currentPage, pageSize) => {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const resolvedPage = clampPage(currentPage, totalPages);
  const start = (resolvedPage - 1) * pageSize;

  return {
    page: resolvedPage,
    totalPages,
    start,
    rows: rows.slice(start, start + pageSize)
  };
};

const compareByNewest = (left, right, key) => {
  const leftTime = new Date(left?.[key] || 0).getTime() || 0;
  const rightTime = new Date(right?.[key] || 0).getTime() || 0;
  return rightTime - leftTime;
};

const getAccessSystemSortOrder = (systemKey) => {
  switch (systemKey) {
    case 'production':
      return 0;
    case 'bathroom':
      return 1;
    case 'offices':
      return 2;
    default:
      return 9;
  }
};

const getEnrollmentStatusSortOrder = (statusKey) => {
  switch (statusKey) {
    case 'active':
      return 0;
    case 'pending':
      return 1;
    case 'suspended':
      return 2;
    default:
      return 3;
  }
};

const getAssignmentStatusSortOrder = (statusKey) => {
  switch (statusKey) {
    case 'active':
      return 0;
    case 'returned':
      return 1;
    case 'not_returned':
      return 2;
    default:
      return 3;
  }
};

const getEnrollmentTimelineTime = (enrollment) => {
  const rawValue = (
    enrollment?.deactivated_at
    || enrollment?.activated_at
    || enrollment?.updated_at
    || enrollment?.created_at
    || 0
  );
  return new Date(rawValue).getTime() || 0;
};

const getAssignmentTimelineTime = (assignment) => {
  const rawValue = (
    assignment?.resolved_at
    || assignment?.returned_at
    || assignment?.assigned_at
    || assignment?.updated_at
    || assignment?.created_at
    || 0
  );
  return new Date(rawValue).getTime() || 0;
};

const compareAccessEnrollments = (left, right) => {
  const statusOrder = getEnrollmentStatusSortOrder(left?.status_key) - getEnrollmentStatusSortOrder(right?.status_key);
  if (statusOrder !== 0) {
    return statusOrder;
  }

  const systemOrder = getAccessSystemSortOrder(left?.access_system?.system_key) - getAccessSystemSortOrder(right?.access_system?.system_key);
  if (systemOrder !== 0) {
    return systemOrder;
  }

  return getEnrollmentTimelineTime(right) - getEnrollmentTimelineTime(left);
};

const compareAccessAssignments = (left, right) => {
  const statusOrder = getAssignmentStatusSortOrder(left?.status_key) - getAssignmentStatusSortOrder(right?.status_key);
  if (statusOrder !== 0) {
    return statusOrder;
  }

  return getAssignmentTimelineTime(right) - getAssignmentTimelineTime(left);
};

const getMediumStatusToneClass = (statusKey) => {
  switch (statusKey) {
    case 'available':
      return 'inventory-status-chip inventory-status-chip--success';
    case 'assigned':
      return 'inventory-status-chip inventory-status-chip--accent';
    case 'not_returned':
    case 'blocked':
      return 'inventory-status-chip inventory-status-chip--warning';
    default:
      return 'inventory-status-chip inventory-status-chip--neutral';
  }
};

const getAssignmentStatusToneClass = (statusKey) => {
  switch (statusKey) {
    case 'active':
      return 'inventory-status-chip inventory-status-chip--accent';
    case 'returned':
      return 'inventory-status-chip inventory-status-chip--success';
    case 'not_returned':
      return 'inventory-status-chip inventory-status-chip--warning';
    default:
      return 'inventory-status-chip inventory-status-chip--neutral';
  }
};

const getEnrollmentStatusToneClass = (statusKey) => {
  switch (statusKey) {
    case 'active':
      return 'inventory-status-chip inventory-status-chip--success';
    case 'pending':
      return 'inventory-status-chip inventory-status-chip--accent';
    case 'suspended':
      return 'inventory-status-chip inventory-status-chip--warning';
    default:
      return 'inventory-status-chip inventory-status-chip--neutral';
  }
};

const toEventLabel = (eventType) => {
  const labelMap = {
    access_granted: 'Acceso otorgado',
    media_created: 'Medio registrado',
    media_assigned: 'Medio asignado',
    media_returned: 'Medio devuelto',
    media_marked_not_returned: 'Medio no devuelto',
    enrollment_created: 'Alta creada',
    enrollment_pending: 'Alta pendiente',
    enrollment_activated: 'Alta activada',
    enrollment_suspended: 'Alta suspendida',
    enrollment_deactivated: 'Alta desactivada',
    collaborator_offboarded: 'Baja procesada'
  };

  return labelMap[eventType] || 'Evento registrado';
};

const matchesSearch = (searchTerm, values) => {
  const normalizedSearch = String(searchTerm || '').trim().toLowerCase();
  if (!normalizedSearch) {
    return true;
  }

  return values
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(normalizedSearch);
};

const toCollaboratorLabel = (collaborator) => {
  if (!collaborator) {
    return 'Sin colaborador';
  }

  const employeeId = collaborator.employee_id ? `ID ${collaborator.employee_id}` : 'Sin ID';
  return `${collaborator.full_name || 'Sin nombre'} · ${employeeId}`;
};

const toMediaLabel = (media) => {
  if (!media) {
    return 'Sin medio';
  }

  return `${media.tag_code || 'Sin tag'} · ${media.asset_unit?.asset_tag || media.asset_tag || 'Sin unidad'}`;
};

const toAccessSupportNote = (note) => {
  const cleanedNote = stripSeedMarkerCopy(note);
  return cleanedNote || null;
};

const toAccessEventNote = (note) => {
  const cleanedNote = stripSeedMarkerCopy(note);
  if (!cleanedNote) {
    return null;
  }

  if (/^event\b/i.test(cleanedNote)) {
    return null;
  }

  return cleanedNote;
};

const AccessPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { authUser, clearSession } = useAuth();

  const [catalog, setCatalog] = useState(defaultCatalog);
  const [media, setMedia] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [events, setEvents] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [locations, setLocations] = useState([]);
  const [availableInventoryUnits, setAvailableInventoryUnits] = useState([]);
  const [screenLoading, setScreenLoading] = useState(true);
  const [screenError, setScreenError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState('all');
  const [assignmentPageSize, setAssignmentPageSize] = useState(DEFAULT_ACCESS_PAGE_SIZE);
  const [assignmentCurrentPage, setAssignmentCurrentPage] = useState(1);

  const [mediaSearchTerm, setMediaSearchTerm] = useState('');
  const [mediaStatusFilter, setMediaStatusFilter] = useState('all');
  const [mediumTypeFilter, setMediumTypeFilter] = useState('all');
  const [mediaPageSize, setMediaPageSize] = useState(DEFAULT_ACCESS_PAGE_SIZE);
  const [mediaCurrentPage, setMediaCurrentPage] = useState(1);

  const [enrollmentSearchTerm, setEnrollmentSearchTerm] = useState('');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState('all');
  const [enrollmentSystemFilter, setEnrollmentSystemFilter] = useState('all');
  const [enrollmentPageSize, setEnrollmentPageSize] = useState(DEFAULT_ACCESS_PAGE_SIZE);
  const [enrollmentCurrentPage, setEnrollmentCurrentPage] = useState(1);

  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [eventPageSize, setEventPageSize] = useState(DEFAULT_ACCESS_PAGE_SIZE);
  const [eventCurrentPage, setEventCurrentPage] = useState(1);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [selectedMediaId, setSelectedMediaId] = useState(null);
  const [selectedEnrollmentCollaboratorId, setSelectedEnrollmentCollaboratorId] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [activeAccessDetailTab, setActiveAccessDetailTab] = useState('summary');

  const [isCreateMediaOpen, setIsCreateMediaOpen] = useState(false);
  const [isGrantAccessOpen, setIsGrantAccessOpen] = useState(false);
  const [isCreateEnrollmentOpen, setIsCreateEnrollmentOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isNotReturnedModalOpen, setIsNotReturnedModalOpen] = useState(false);
  const [isEnrollmentStatusOpen, setIsEnrollmentStatusOpen] = useState(false);
  const [isOffboardOpen, setIsOffboardOpen] = useState(false);
  const [isEnrollmentCollaboratorInlineOpen, setIsEnrollmentCollaboratorInlineOpen] = useState(false);
  const [isGrantExistingCollaborator, setIsGrantExistingCollaborator] = useState(true);
  const [isEnrollmentNotesOpen, setIsEnrollmentNotesOpen] = useState(false);
  const [isGrantNotesOpen, setIsGrantNotesOpen] = useState(false);
  const [isOffboardNotesOpen, setIsOffboardNotesOpen] = useState(false);
  const [createMediaOrigin, setCreateMediaOrigin] = useState('manual');
  const [grantLockedCollaboratorId, setGrantLockedCollaboratorId] = useState(null);

  const [createMediaForm, setCreateMediaForm] = useState(defaultCreateMediaForm);
  const [grantAccessForm, setGrantAccessForm] = useState(defaultGrantAccessForm);
  const [createEnrollmentForm, setCreateEnrollmentForm] = useState(defaultEnrollmentForm);
  const [createCollaboratorForm, setCreateCollaboratorForm] = useState(defaultCreateCollaboratorForm);
  const [returnForm, setReturnForm] = useState(defaultReturnForm);
  const [notReturnedForm, setNotReturnedForm] = useState(defaultNotReturnedForm);
  const [enrollmentStatusForm, setEnrollmentStatusForm] = useState(defaultEnrollmentStatusForm);
  const [offboardForm, setOffboardForm] = useState(defaultOffboardForm);

  const [modalError, setModalError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAssignmentAction, setActiveAssignmentAction] = useState(null);
  const [activeEnrollmentAction, setActiveEnrollmentAction] = useState(null);
  const [activeOffboardTarget, setActiveOffboardTarget] = useState(null);
  const [collaboratorCreationTarget, setCollaboratorCreationTarget] = useState(null);

  const grantAccessTriggerRef = useRef(null);
  const createMediaTriggerRef = useRef(null);
  const createEnrollmentTriggerRef = useRef(null);
  const grantAccessReturnFocusRef = useRef(null);
  const createMediaReturnFocusRef = useRef(null);
  const createEnrollmentReturnFocusRef = useRef(null);
  const accessDetailCloseButtonRef = useRef(null);
  const accessDetailTriggerRef = useRef(null);
  const shouldAutoFocusAccessDetailRef = useRef(false);
  const accessDetailKeyboardIntentRef = useRef(false);

  const activeView = resolveAccessView(searchParams.get('view'));
  const canCreateAccess = hasPermission(authUser, 'access.create');
  const canAssignAccess = hasPermission(authUser, 'access.assign');
  const canGrantAccess = canCreateAccess && canAssignAccess;
  const canUpdateAccess = hasPermission(authUser, 'access.update');
  const canCreateCollaborators = hasPermission(authUser, 'collaborators.create');
  const hasActionNotice = Boolean(actionError || actionSuccess);
  const workspaceNotices = useMemo(() => {
    const notices = [];

    if (actionSuccess) {
      notices.push({
        key: 'access-success',
        tone: 'success',
        message: actionSuccess
      });
    }

    if (actionError) {
      notices.push({
        key: 'access-error',
        tone: 'error',
        message: actionError
      });
    }

    return notices;
  }, [actionError, actionSuccess]);

  const getFieldError = useCallback((fieldId) => formErrors[fieldId] || '', [formErrors]);
  const getFieldDescribedBy = useCallback((fieldId, extraId = '') => {
    const describedBy = [
      extraId,
      formErrors[fieldId] ? buildFieldErrorId(fieldId) : ''
    ].filter(Boolean).join(' ');

    return describedBy || undefined;
  }, [formErrors]);
  const renderFieldError = useCallback((fieldId) => {
    const message = formErrors[fieldId];
    if (!message) {
      return null;
    }

    return (
      <p id={buildFieldErrorId(fieldId)} className="modal-dialog__field-help modal-dialog__field-help--error" role="alert">
        {message}
      </p>
    );
  }, [formErrors]);
  const renderFieldSupport = useCallback((fieldId = '') => {
    if (fieldId) {
      const message = formErrors[fieldId];
      if (message) {
        return (
          <p id={buildFieldErrorId(fieldId)} className="modal-dialog__field-help modal-dialog__field-help--error" role="alert">
            {message}
          </p>
        );
      }
    }

    return <span className="modal-dialog__field-help modal-dialog__field-help--slot" aria-hidden="true">&nbsp;</span>;
  }, [formErrors]);
  const renderModalNoticeSlot = useCallback((reserve = false) => (
    <div className={`modal-dialog__notice-slot${reserve ? ' modal-dialog__notice-slot--reserved' : ''}`}>
      {modalError ? <InlineNotice tone="error" className="modal-dialog__notice">{modalError}</InlineNotice> : null}
    </div>
  ), [modalError]);
  const focusFirstInvalidField = useCallback((errors) => {
    const firstFieldId = Object.keys(errors)[0];
    if (!firstFieldId) {
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById(firstFieldId)?.focus?.();
    });
  }, []);
  const applyValidationErrors = useCallback((errors) => {
    setModalError('');
    setFormErrors(errors);
    focusFirstInvalidField(errors);
  }, [focusFirstInvalidField]);

  const resetFeedback = useCallback(() => {
    setActionError('');
    setActionSuccess('');
    setModalError('');
    setFormErrors({});
  }, []);

  const loadAvailableUnits = useCallback(async () => {
    setIsLoadingUnits(true);

    try {
      const units = await listInventoryAssetUnits({ status: 'available', assetTypeKey: 'rfid_tag' });
      setAvailableInventoryUnits(units.filter((unit) => unit.asset_type_key === 'rfid_tag'));
    } finally {
      setIsLoadingUnits(false);
    }
  }, []);

  const loadCoreData = useCallback(async () => {
    setScreenLoading(true);
    setScreenError('');

    try {
      const [catalogData, mediaRows, assignmentRows, enrollmentRows, eventRows, collaboratorRows, locationRows] = await Promise.all([
        getAccessCatalog(),
        listAccessMedia(),
        listAccessMediaAssignments({ limit: 240 }),
        listAccessEnrollments({ limit: 240 }),
        listAccessEvents({ limit: 240 }),
        listCollaborators({ status: 'active' }),
        listLocations()
      ]);

      setCatalog(catalogData);
      setMedia([...mediaRows].sort((left, right) => compareByNewest(left, right, 'updated_at')));
      setAssignments([...assignmentRows].sort((left, right) => compareByNewest(left, right, 'assigned_at')));
      setEnrollments([...enrollmentRows].sort((left, right) => compareByNewest(left, right, 'updated_at')));
      setEvents([...eventRows].sort((left, right) => compareByNewest(left, right, 'happened_at')));
      setCollaborators(collaboratorRows);
      setLocations(locationRows);
    } catch (error) {
      if (isAccessAuthError(error) || isCollaboratorAuthError(error) || isInventoryAuthError(error)) {
        clearSession();
        return;
      }

      setScreenError(normalizeErrorMessage(error, `${accessLoadErrorTitle}.`));
    } finally {
      setScreenLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    void loadCoreData();
  }, [loadCoreData]);

  useEffect(() => {
    if (!actionError && !actionSuccess) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setActionError('');
      setActionSuccess('');
    }, 4200);

    return () => window.clearTimeout(timeout);
  }, [actionError, actionSuccess]);

  useEffect(() => {
    setAssignmentCurrentPage(1);
  }, [assignmentSearchTerm, assignmentStatusFilter]);

  useEffect(() => {
    setMediaCurrentPage(1);
  }, [mediaSearchTerm, mediaStatusFilter, mediumTypeFilter]);

  useEffect(() => {
    setEnrollmentCurrentPage(1);
  }, [enrollmentSearchTerm, enrollmentStatusFilter, enrollmentSystemFilter]);

  useEffect(() => {
    setEventCurrentPage(1);
  }, [eventSearchTerm]);

  useEffect(() => {
    const requestedView = String(searchParams.get('view') || '').trim();
    if (requestedView === activeView) {
      return;
    }

    setSearchParams({ view: activeView }, { replace: true });
  }, [activeView, searchParams, setSearchParams]);

  useEffect(() => {
    setSelectedAssignmentId(null);
    setSelectedMediaId(null);
    setSelectedEnrollmentCollaboratorId(null);
    setSelectedEventId(null);
    setActiveAccessDetailTab('summary');
    shouldAutoFocusAccessDetailRef.current = false;
  }, [activeView]);

  const collaboratorOptions = useMemo(() => ([
    { key: '', label: 'Selecciona un colaborador' },
    ...collaborators.map((collaborator) => ({
      key: String(collaborator.id),
      label: toCollaboratorLabel(collaborator)
    }))
  ]), [collaborators]);

  const employeeIdAvailability = catalog.employee_id_availability || defaultCatalog.employee_id_availability;
  const suggestedEmployeeId = employeeIdAvailability.next_available_id ? String(employeeIdAvailability.next_available_id) : '';
  const employeeIdPrimaryRangeLabel = useMemo(() => {
    const ranges = Array.isArray(employeeIdAvailability.preview_ranges) ? employeeIdAvailability.preview_ranges : [];
    if (ranges.length === 0) {
      return '';
    }

    const primaryRange = ranges[0];
    return Number(primaryRange.start) === Number(primaryRange.end)
      ? String(primaryRange.start)
      : `${primaryRange.start}-${primaryRange.end}`;
  }, [employeeIdAvailability]);
  const employeeIdHasMorePreviewRanges = useMemo(() => {
    const ranges = Array.isArray(employeeIdAvailability.preview_ranges) ? employeeIdAvailability.preview_ranges : [];
    return ranges.length > 1 || Boolean(employeeIdAvailability.has_more_ranges);
  }, [employeeIdAvailability]);
  const employeeIdAvailabilityLabel = useMemo(() => {
    if (!employeeIdPrimaryRangeLabel) {
      return 'Sin IDs disponibles en el rango operativo.';
    }

    return employeeIdHasMorePreviewRanges
      ? `Rango abierto: ${employeeIdPrimaryRangeLabel} y más`
      : `Rango abierto: ${employeeIdPrimaryRangeLabel}`;
  }, [employeeIdPrimaryRangeLabel, employeeIdHasMorePreviewRanges]);

  const systemFilterOptions = useMemo(() => ([
    { key: 'all', label: 'Todos los sistemas' },
    ...catalog.systems
      .filter((system) => visibleAccessSystemKeys.includes(system.system_key))
      .map((system) => ({
      key: String(system.id),
      label: system.name
      }))
  ]), [catalog.systems]);

  const mediumTypeFilterOptions = useMemo(() => ([
    { key: 'all', label: 'Todos los medios' },
    ...catalog.medium_types.map((mediumType) => ({
      key: mediumType.type_key,
      label: mediumType.name
    }))
  ]), [catalog.medium_types]);

  const mediaStatusFilterOptions = useMemo(() => ([
    { key: 'all', label: 'Todos los estados' },
    ...catalog.media_statuses.map((status) => ({
      key: status.status_key,
      label: status.name
    }))
  ]), [catalog.media_statuses]);

  const grantSystemOptions = useMemo(() => {
    const systemMap = new Map(catalog.systems.map((system) => [system.system_key, system]));
    const systemVisualMap = {
      production: { icon: Factory, helper: 'Checador + RFID' },
      offices: { icon: Building2, helper: 'No requiere RFID' },
      bathroom: { icon: Bath, helper: 'Baño + RFID' }
    };

    return visibleAccessSystemKeys
      .map((systemKey) => systemMap.get(systemKey))
      .filter(Boolean)
      .map((system) => ({
        key: system.system_key,
        label: system.name,
        description: system.description || null,
        icon: systemVisualMap[system.system_key]?.icon || ShieldCheck,
        helper: systemVisualMap[system.system_key]?.helper || ''
      }));
  }, [catalog.systems]);

  const enrollmentSystemOptions = useMemo(() => ([
    { key: '', label: 'Selecciona un sistema' },
    ...catalog.systems
      .filter((system) => visibleAccessSystemKeys.includes(system.system_key))
      .map((system) => ({
      key: String(system.id),
      label: system.name
      }))
  ]), [catalog.systems]);

  const locationOptions = useMemo(() => ([
    { key: '', label: 'Selecciona una ubicación' },
    ...locations.map((location) => ({
      key: String(location.id),
      label: `${location.name}${location.code ? ` · ${location.code}` : ''}`
    }))
  ]), [locations]);

  const mediaByAssetUnitId = useMemo(() => new Map(
    media.map((item) => [Number(item.asset_unit_id), item])
  ), [media]);

  const inventoryUnitById = useMemo(() => new Map(
    availableInventoryUnits.map((unit) => [Number(unit.id), unit])
  ), [availableInventoryUnits]);

  const registerableUnitOptions = useMemo(() => ([
    { key: '', label: isLoadingUnits ? 'Cargando unidades disponibles...' : 'Selecciona una unidad RFID' },
    ...availableInventoryUnits
      .filter((unit) => !mediaByAssetUnitId.has(Number(unit.id)))
      .map((unit) => ({
        key: String(unit.id),
        label: `${unit.asset_tag} · ${unit.asset_name || 'RFID'}${unit.serial_number ? ` · ${unit.serial_number}` : ''}`
      }))
  ]), [availableInventoryUnits, isLoadingUnits, mediaByAssetUnitId]);

  const grantInventoryUnitOptions = useMemo(() => ([
    { key: '', label: isLoadingUnits ? 'Cargando RFID disponibles...' : 'Selecciona una unidad RFID' },
    ...availableInventoryUnits.map((unit) => {
      const linkedMedia = mediaByAssetUnitId.get(Number(unit.id));
      const primaryLabel = linkedMedia?.tag_code || unit.asset_tag;

      return {
        key: String(unit.id),
        label: linkedMedia?.tag_code && linkedMedia.tag_code !== unit.asset_tag
          ? `${primaryLabel} · ${unit.asset_name || 'RFID'} · ${unit.asset_tag}`
          : `${primaryLabel} · ${unit.asset_name || 'RFID'}`
      };
    })
  ]), [availableInventoryUnits, isLoadingUnits, mediaByAssetUnitId]);

  const activeAssignmentOptionsByCollaborator = useMemo(() => {
    const collaboratorId = Number(createEnrollmentForm.collaborator_id || 0);
    const filteredAssignments = collaboratorId > 0
      ? assignments.filter((assignment) => (
        assignment.status_key === 'active' && Number(assignment.collaborator?.id) === collaboratorId
      ))
      : [];

    return [
      { key: '', label: collaboratorId > 0 ? 'Sin RFID ligado' : 'Selecciona colaborador primero' },
      ...filteredAssignments.map((assignment) => ({
        key: String(assignment.id),
        label: assignment.media?.tag_code || 'Sin tag'
      }))
    ];
  }, [assignments, createEnrollmentForm.collaborator_id]);

  const selectedGrantCollaborator = useMemo(() => (
    collaborators.find((collaborator) => Number(collaborator.id) === Number(grantAccessForm.collaborator_id || 0)) || null
  ), [collaborators, grantAccessForm.collaborator_id]);

  const activeAssignmentsForGrantCollaborator = useMemo(() => {
    const collaboratorId = Number(grantAccessForm.collaborator_id || 0);
    return collaboratorId > 0
      ? assignments.filter((assignment) => (
        assignment.status_key === 'active' && Number(assignment.collaborator?.id) === collaboratorId
      ))
      : [];
  }, [assignments, grantAccessForm.collaborator_id]);

  const activeEnrollmentsForGrantCollaborator = useMemo(() => {
    const collaboratorId = Number(grantAccessForm.collaborator_id || 0);
    return collaboratorId > 0
      ? enrollments.filter((enrollment) => (
        Number(enrollment.collaborator?.id) === collaboratorId && enrollment.status_key !== 'deactivated'
      ))
      : [];
  }, [enrollments, grantAccessForm.collaborator_id]);

  const activeSystemEnrollmentsForGrantCollaborator = useMemo(() => (
    activeEnrollmentsForGrantCollaborator.filter((enrollment) => enrollment.status_key === 'active')
  ), [activeEnrollmentsForGrantCollaborator]);

  const activeSystemKeysForGrantCollaborator = useMemo(() => (
    Array.from(new Set(
      activeSystemEnrollmentsForGrantCollaborator
        .map((enrollment) => enrollment.access_system?.system_key || '')
        .filter(Boolean)
    ))
  ), [activeSystemEnrollmentsForGrantCollaborator]);

  const activeSystemLabelsForGrantCollaborator = useMemo(() => (
    Array.from(new Set(
      activeSystemEnrollmentsForGrantCollaborator
        .map((enrollment) => enrollment.access_system?.name || '')
        .filter(Boolean)
    ))
  ), [activeSystemEnrollmentsForGrantCollaborator]);

  const grantSelectedSystemLabels = useMemo(() => (
    grantSystemOptions
      .filter((system) => grantAccessForm.systems.includes(system.key))
      .map((system) => system.label)
  ), [grantSystemOptions, grantAccessForm.systems]);

  const grantHasFieldAccessSelection = useMemo(() => (
    grantAccessForm.systems.includes('production') || grantAccessForm.systems.includes('bathroom')
  ), [grantAccessForm.systems]);

  const grantAutoCloseOptions = useMemo(() => {
    if (!isGrantExistingCollaborator || !grantHasFieldAccessSelection) {
      return [];
    }

    return activeSystemEnrollmentsForGrantCollaborator.filter((enrollment) => (
      enrollment.access_system?.system_key === 'offices'
    ));
  }, [activeSystemEnrollmentsForGrantCollaborator, grantHasFieldAccessSelection, isGrantExistingCollaborator]);

  const grantHasReusableActiveAssignment = useMemo(() => (
    isGrantExistingCollaborator && activeAssignmentsForGrantCollaborator.length > 0
  ), [activeAssignmentsForGrantCollaborator.length, isGrantExistingCollaborator]);

  const grantActiveSystemsText = useMemo(() => (
    formatListConjunction(activeSystemLabelsForGrantCollaborator)
  ), [activeSystemLabelsForGrantCollaborator]);

  const grantSelectedSystemsText = useMemo(() => (
    formatListConjunction(grantSelectedSystemLabels)
  ), [grantSelectedSystemLabels]);

  const grantAutoCloseSystemsText = useMemo(() => (
    formatListConjunction(
      grantAutoCloseOptions.map((enrollment) => enrollment.access_system?.name || 'Sin sistema')
    )
  ), [grantAutoCloseOptions]);

  const isGrantCollaboratorLocked = Boolean(grantLockedCollaboratorId);
  const isGrantMigrationFlow = isGrantCollaboratorLocked && grantAutoCloseOptions.length > 0;

  const grantReusableMediaLabel = useMemo(() => (
    activeAssignmentsForGrantCollaborator[0]?.media ? toMediaLabel(activeAssignmentsForGrantCollaborator[0].media) : ''
  ), [activeAssignmentsForGrantCollaborator]);

  const assignmentOptionsForEnrollmentStatus = useMemo(() => {
    const collaboratorId = Number(activeEnrollmentAction?.collaborator?.id || 0);
    const filteredAssignments = collaboratorId > 0
      ? assignments.filter((assignment) => (
        assignment.status_key === 'active' && Number(assignment.collaborator?.id) === collaboratorId
      ))
      : assignments.filter((assignment) => assignment.status_key === 'active');

    return [
      { key: '', label: 'Sin RFID ligado' },
      ...filteredAssignments.map((assignment) => ({
        key: String(assignment.id),
        label: assignment.media?.tag_code || 'Sin tag'
      }))
    ];
  }, [activeEnrollmentAction, assignments]);

  const grantHasOfficeOnlySelection = useMemo(() => (
    grantAccessForm.systems.includes('offices')
    && !grantAccessForm.systems.includes('production')
    && !grantAccessForm.systems.includes('bathroom')
  ), [grantAccessForm.systems]);

  const grantRequiresRfid = useMemo(() => (
    grantAccessForm.systems.includes('production')
    || grantAccessForm.systems.includes('bathroom')
    || Boolean(grantAccessForm.requires_rfid_override)
  ), [grantAccessForm.requires_rfid_override, grantAccessForm.systems]);

  const selectedEnrollmentSystem = useMemo(() => (
    catalog.systems.find((system) => Number(system.id) === Number(createEnrollmentForm.access_system_id || 0)) || null
  ), [catalog.systems, createEnrollmentForm.access_system_id]);

  const enrollmentRequiresRfid = useMemo(() => (
    selectedEnrollmentSystem?.system_key === 'production' || selectedEnrollmentSystem?.system_key === 'bathroom'
  ), [selectedEnrollmentSystem]);

  useEffect(() => {
    if (!isGrantExistingCollaborator || !grantAccessForm.systems.length || !activeSystemKeysForGrantCollaborator.length) {
      return;
    }

    setGrantAccessForm((current) => {
      const nextSystems = current.systems.filter((systemKey) => !activeSystemKeysForGrantCollaborator.includes(systemKey));
      if (nextSystems.length === current.systems.length) {
        return current;
      }

      const nextHasOfficeOnlySelection = (
        nextSystems.includes('offices')
        && !nextSystems.includes('production')
        && !nextSystems.includes('bathroom')
      );
      const nextRequiresRfidOverride = nextHasOfficeOnlySelection ? current.requires_rfid_override : false;
      const nextRequiresRfid = (
        nextSystems.includes('production')
        || nextSystems.includes('bathroom')
        || Boolean(nextRequiresRfidOverride)
      );

      return {
        ...current,
        systems: nextSystems,
        requires_rfid_override: nextRequiresRfidOverride,
        asset_unit_id: nextRequiresRfid ? current.asset_unit_id : ''
      };
    });
  }, [activeSystemKeysForGrantCollaborator, grantAccessForm.systems, isGrantExistingCollaborator]);

  useEffect(() => {
    const nextIds = grantAutoCloseOptions.map((enrollment) => Number(enrollment.id));
    setGrantAccessForm((current) => {
      const currentIds = current.deactivate_enrollment_ids.map((enrollmentId) => Number(enrollmentId));
      const didChange = (
        nextIds.length !== currentIds.length
        || nextIds.some((enrollmentId, index) => enrollmentId !== currentIds[index])
      );

      return didChange ? { ...current, deactivate_enrollment_ids: nextIds } : current;
    });
  }, [grantAutoCloseOptions]);

  const hasGrantMediaOptions = grantInventoryUnitOptions.length > 1;

  const filteredAssignments = useMemo(() => assignments.filter((assignment) => {
    if (assignmentStatusFilter !== 'all' && assignment.status_key !== assignmentStatusFilter) {
      return false;
    }

    return matchesSearch(assignmentSearchTerm, [
      assignment.collaborator?.full_name,
      assignment.collaborator?.employee_id,
      assignment.media?.tag_code,
      assignment.media?.asset_tag,
      assignment.assignment_note,
      assignment.closure_note
    ]);
  }), [assignments, assignmentSearchTerm, assignmentStatusFilter]);

  const filteredMedia = useMemo(() => media.filter((item) => {
    if (mediaStatusFilter !== 'all' && item.status_key !== mediaStatusFilter) {
      return false;
    }

    if (mediumTypeFilter !== 'all' && item.medium_type_key !== mediumTypeFilter) {
      return false;
    }

    return matchesSearch(mediaSearchTerm, [
      item.tag_code,
      item.medium_type_name,
      item.asset_unit?.asset_tag,
      item.asset_unit?.serial_number,
      item.notes,
      item.active_assignment?.collaborator?.full_name
    ]);
  }), [media, mediaSearchTerm, mediaStatusFilter, mediumTypeFilter]);

  const enrollmentCollaboratorRows = useMemo(() => {
    const assignmentsByCollaboratorId = new Map();
    assignments.forEach((assignment) => {
      const collaboratorId = Number(assignment.collaborator?.id || 0);
      if (collaboratorId <= 0) {
        return;
      }

      if (!assignmentsByCollaboratorId.has(collaboratorId)) {
        assignmentsByCollaboratorId.set(collaboratorId, []);
      }

      assignmentsByCollaboratorId.get(collaboratorId).push(assignment);
    });

    const rowsByCollaboratorId = new Map();
    enrollments.forEach((enrollment) => {
      const collaboratorId = Number(enrollment.collaborator?.id || 0);
      if (collaboratorId <= 0) {
        return;
      }

      if (!rowsByCollaboratorId.has(collaboratorId)) {
        rowsByCollaboratorId.set(collaboratorId, {
          collaborator: enrollment.collaborator || null,
          enrollments: []
        });
      }

      const currentRow = rowsByCollaboratorId.get(collaboratorId);
      if (currentRow.collaborator == null && enrollment.collaborator) {
        currentRow.collaborator = enrollment.collaborator;
      }
      currentRow.enrollments.push(enrollment);
    });

    return Array.from(rowsByCollaboratorId.entries())
      .map(([collaboratorId, row]) => {
        const collaborator = row.collaborator
          || collaborators.find((entry) => Number(entry.id) === Number(collaboratorId))
          || null;
        const sortedEnrollments = [...row.enrollments].sort(compareAccessEnrollments);
        const activeEnrollments = sortedEnrollments.filter((enrollment) => enrollment.status_key === 'active');
        const openEnrollments = sortedEnrollments.filter((enrollment) => enrollment.status_key !== 'deactivated');
        const currentEnrollments = activeEnrollments.length > 0 ? activeEnrollments : openEnrollments;
        const primaryEnrollment = currentEnrollments[0] || sortedEnrollments[0] || null;
        const collaboratorAssignments = [
          ...(assignmentsByCollaboratorId.get(Number(collaboratorId)) || [])
        ].sort(compareAccessAssignments);
        const primaryAssignment = collaboratorAssignments[0] || null;
        const primaryMedia = (
          primaryAssignment?.media
          || primaryEnrollment?.media
          || primaryEnrollment?.media_assignment?.media
          || null
        );
        const visibleSystemEnrollments = currentEnrollments.length > 0
          ? currentEnrollments
          : (primaryEnrollment ? [primaryEnrollment] : []);
        const systemLabels = Array.from(new Set(
          visibleSystemEnrollments
            .map((enrollment) => enrollment.access_system?.name || '')
            .filter(Boolean)
        ));
        const systemIds = Array.from(new Set(
          visibleSystemEnrollments
            .map((enrollment) => String(enrollment.access_system?.id || ''))
            .filter(Boolean)
        ));
        const latestActivityTime = sortedEnrollments.reduce(
          (latest, enrollment) => Math.max(latest, getEnrollmentTimelineTime(enrollment)),
          0
        );

        let statusNote = 'Sin alta vigente';
        if (activeEnrollments.length > 1) {
          statusNote = `${activeEnrollments.length} sistemas activos`;
        } else if (activeEnrollments.length === 1) {
          statusNote = '1 sistema activo';
        } else if (openEnrollments.length > 1) {
          statusNote = `${openEnrollments.length} altas en seguimiento`;
        } else if (openEnrollments.length === 1) {
          statusNote = '1 alta en seguimiento';
        } else if (sortedEnrollments.length > 1) {
          statusNote = `${sortedEnrollments.length} altas registradas`;
        } else if (sortedEnrollments.length === 1) {
          statusNote = '1 alta registrada';
        }

        return {
          collaborator,
          collaborator_id: Number(collaboratorId),
          enrollments: sortedEnrollments,
          assignments: collaboratorAssignments,
          assignment: primaryAssignment,
          enrollment: primaryEnrollment,
          media: primaryMedia,
          currentEnrollments,
          currentSystemIds: systemIds,
          currentSystemsText: formatListConjunction(systemLabels),
          latestActivityTime,
          latestActivityLabel: latestActivityTime > 0 ? formatDateTime(latestActivityTime) : 'Sin fecha',
          status_key: primaryEnrollment?.status_key || 'deactivated',
          status_name: primaryEnrollment?.status_name || 'Desactivado',
          status_note: statusNote
        };
      })
      .sort((left, right) => {
        if (right.latestActivityTime !== left.latestActivityTime) {
          return right.latestActivityTime - left.latestActivityTime;
        }

        return String(left.collaborator?.full_name || '').localeCompare(String(right.collaborator?.full_name || ''), 'es-MX');
      });
  }, [assignments, collaborators, enrollments]);

  const filteredEnrollmentRows = useMemo(() => enrollmentCollaboratorRows.filter((row) => {
    if (enrollmentStatusFilter !== 'all' && row.status_key !== enrollmentStatusFilter) {
      return false;
    }

    if (enrollmentSystemFilter !== 'all' && !row.currentSystemIds.includes(enrollmentSystemFilter)) {
      return false;
    }

    return matchesSearch(enrollmentSearchTerm, [
      row.collaborator?.full_name,
      row.collaborator?.employee_id,
      row.collaborator?.area_name,
      row.currentSystemsText,
      row.media?.tag_code,
      row.media?.asset_unit?.asset_tag,
      ...row.enrollments.map((enrollment) => enrollment.notes)
    ]);
  }), [enrollmentCollaboratorRows, enrollmentSearchTerm, enrollmentStatusFilter, enrollmentSystemFilter]);

  const filteredEvents = useMemo(() => events.filter((eventRow) => matchesSearch(eventSearchTerm, [
    toEventLabel(eventRow.event_type),
    eventRow.collaborator_name,
    eventRow.employee_id,
    eventRow.access_system_name,
    eventRow.tag_code,
    eventRow.notes,
    eventRow.operator_name
  ])), [events, eventSearchTerm]);

  const assignmentPage = useMemo(
    () => paginateRows(filteredAssignments, assignmentCurrentPage, assignmentPageSize),
    [filteredAssignments, assignmentCurrentPage, assignmentPageSize]
  );
  const mediaPage = useMemo(
    () => paginateRows(filteredMedia, mediaCurrentPage, mediaPageSize),
    [filteredMedia, mediaCurrentPage, mediaPageSize]
  );
  const enrollmentPage = useMemo(
    () => paginateRows(filteredEnrollmentRows, enrollmentCurrentPage, enrollmentPageSize),
    [filteredEnrollmentRows, enrollmentCurrentPage, enrollmentPageSize]
  );
  const eventPage = useMemo(
    () => paginateRows(filteredEvents, eventCurrentPage, eventPageSize),
    [filteredEvents, eventCurrentPage, eventPageSize]
  );

  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => Number(assignment.id) === Number(selectedAssignmentId)) || null,
    [assignments, selectedAssignmentId]
  );
  const selectedMedia = useMemo(
    () => media.find((item) => Number(item.id) === Number(selectedMediaId)) || null,
    [media, selectedMediaId]
  );
  const selectedEnrollmentRow = useMemo(
    () => enrollmentCollaboratorRows.find((row) => Number(row.collaborator_id) === Number(selectedEnrollmentCollaboratorId)) || null,
    [enrollmentCollaboratorRows, selectedEnrollmentCollaboratorId]
  );
  const selectedEvent = useMemo(
    () => events.find((eventRow) => Number(eventRow.id) === Number(selectedEventId)) || null,
    [events, selectedEventId]
  );

  const detailContext = useMemo(() => {
    if (activeView === 'assignments' && selectedAssignment) {
      const collaboratorId = Number(selectedAssignment.collaborator?.id || 0);
      const accessMediaId = Number(selectedAssignment.access_media_id || selectedAssignment.media?.id || 0);

      return {
        type: 'assignment',
        title: selectedAssignment.collaborator?.full_name || 'Asignación activa',
        subtitle: `${selectedAssignment.media?.tag_code || 'Sin tag'} · ${selectedAssignment.status_name}`,
        collaborator: selectedAssignment.collaborator || null,
        media: media.find((item) => Number(item.id) === accessMediaId) || null,
        assignment: selectedAssignment,
        enrollment: null,
        event: null,
        events: events.filter((eventRow) => (
          Number(eventRow.collaborator_id || 0) === collaboratorId || Number(eventRow.access_media_id || 0) === accessMediaId
        )).slice(0, 12),
        enrollments: enrollments.filter((enrollment) => Number(enrollment.collaborator?.id || 0) === collaboratorId),
        assignments: assignments.filter((assignment) => Number(assignment.collaborator?.id || 0) === collaboratorId)
      };
    }

    if (activeView === 'media' && selectedMedia) {
      const collaboratorId = Number(selectedMedia.active_assignment?.collaborator?.id || 0);

      return {
        type: 'media',
        title: selectedMedia.tag_code,
        subtitle: `${selectedMedia.medium_type_name} · ${selectedMedia.status_name}`,
        collaborator: selectedMedia.active_assignment?.collaborator || null,
        media: selectedMedia,
        assignment: assignments.find((assignment) => Number(assignment.access_media_id) === Number(selectedMedia.id) && assignment.status_key === 'active') || null,
        enrollment: null,
        event: null,
        events: events.filter((eventRow) => Number(eventRow.access_media_id || 0) === Number(selectedMedia.id)).slice(0, 12),
        enrollments: collaboratorId > 0
          ? enrollments.filter((enrollment) => Number(enrollment.collaborator?.id || 0) === collaboratorId)
          : [],
        assignments: assignments.filter((assignment) => Number(assignment.access_media_id) === Number(selectedMedia.id))
      };
    }

    if (activeView === 'enrollments' && selectedEnrollmentRow) {
      const collaboratorId = Number(selectedEnrollmentRow.collaborator_id || 0);
      return {
        type: 'enrollment',
        title: selectedEnrollmentRow.collaborator?.full_name || 'Colaborador sin nombre',
        subtitle: selectedEnrollmentRow.currentSystemsText
          ? `${selectedEnrollmentRow.currentSystemsText} · ${selectedEnrollmentRow.status_name}`
          : selectedEnrollmentRow.status_name,
        collaborator: selectedEnrollmentRow.collaborator || null,
        media: selectedEnrollmentRow.media || null,
        assignment: selectedEnrollmentRow.assignment || null,
        enrollment: selectedEnrollmentRow.enrollment || null,
        currentEnrollments: selectedEnrollmentRow.currentEnrollments,
        event: null,
        events: events.filter((eventRow) => Number(eventRow.collaborator_id || 0) === collaboratorId).slice(0, 12),
        enrollments: selectedEnrollmentRow.enrollments,
        assignments: selectedEnrollmentRow.assignments
      };
    }

    if (activeView === 'history' && selectedEvent) {
      const collaboratorId = Number(selectedEvent.collaborator_id || 0);
      const accessMediaId = Number(selectedEvent.access_media_id || 0);

      return {
        type: 'event',
        title: toEventLabel(selectedEvent.event_type),
        subtitle: selectedEvent.collaborator_name || selectedEvent.tag_code || selectedEvent.access_system_name || 'Evento operativo',
        collaborator: collaboratorId > 0
          ? collaborators.find((collaborator) => Number(collaborator.id) === collaboratorId) || {
            id: collaboratorId,
            employee_id: selectedEvent.employee_id || null,
            full_name: selectedEvent.collaborator_name || 'Sin colaborador'
          }
          : null,
        media: accessMediaId > 0 ? media.find((item) => Number(item.id) === accessMediaId) || null : null,
        assignment: null,
        enrollment: null,
        event: selectedEvent,
        events: events.filter((eventRow) => (
          Number(eventRow.collaborator_id || 0) === collaboratorId || Number(eventRow.access_media_id || 0) === accessMediaId
        )).slice(0, 12),
        enrollments: collaboratorId > 0 ? enrollments.filter((enrollment) => Number(enrollment.collaborator?.id || 0) === collaboratorId) : [],
        assignments: collaboratorId > 0 ? assignments.filter((assignment) => Number(assignment.collaborator?.id || 0) === collaboratorId) : []
      };
    }

    return null;
  }, [activeView, assignments, collaborators, events, media, selectedAssignment, selectedEnrollmentRow, selectedEvent, selectedMedia]);

  const detailOpen = Boolean(detailContext);

  const clearAccessDetailSelection = useCallback(() => {
    setSelectedAssignmentId(null);
    setSelectedMediaId(null);
    setSelectedEnrollmentCollaboratorId(null);
    setSelectedEventId(null);
  }, []);

  const openAccessDetail = useCallback((type, entityId, triggerElement, options = {}) => {
    const { shouldAutoFocus = false } = options;
    const resolvedShouldAutoFocus = Boolean(shouldAutoFocus || accessDetailKeyboardIntentRef.current);

    if (typeof HTMLElement !== 'undefined' && triggerElement instanceof HTMLElement) {
      accessDetailTriggerRef.current = triggerElement;
    }

    shouldAutoFocusAccessDetailRef.current = resolvedShouldAutoFocus;
    accessDetailKeyboardIntentRef.current = false;
    setActiveAccessDetailTab('summary');
    clearAccessDetailSelection();

    if (type === 'assignment') {
      setSelectedAssignmentId(Number(entityId));
      return;
    }

    if (type === 'media') {
      setSelectedMediaId(Number(entityId));
      return;
    }

    if (type === 'enrollment') {
      setSelectedEnrollmentCollaboratorId(Number(entityId));
      return;
    }

    if (type === 'event') {
      setSelectedEventId(Number(entityId));
    }
  }, [clearAccessDetailSelection]);

  const closeAccessDetail = useCallback((shouldRestoreFocus = true) => {
    clearAccessDetailSelection();
    setActiveAccessDetailTab('summary');
    shouldAutoFocusAccessDetailRef.current = false;
    accessDetailKeyboardIntentRef.current = false;

    if (shouldRestoreFocus) {
      window.requestAnimationFrame(() => {
        accessDetailTriggerRef.current?.focus();
      });
    }
  }, [clearAccessDetailSelection]);

  useEffect(() => {
    if (!detailOpen || !shouldAutoFocusAccessDetailRef.current) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      accessDetailCloseButtonRef.current?.focus();
      shouldAutoFocusAccessDetailRef.current = false;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [detailOpen]);

  useEffect(() => {
    if (
      !detailOpen
      || isCreateMediaOpen
      || isGrantAccessOpen
      || isCreateEnrollmentOpen
      || isReturnModalOpen
      || isNotReturnedModalOpen
      || isEnrollmentStatusOpen
      || isOffboardOpen
    ) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      closeAccessDetail();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    closeAccessDetail,
    detailOpen,
    isCreateEnrollmentOpen,
    isCreateMediaOpen,
    isEnrollmentStatusOpen,
    isGrantAccessOpen,
    isNotReturnedModalOpen,
    isOffboardOpen,
    isReturnModalOpen
  ]);

  const handleViewChange = (viewKey) => {
    setSearchParams({ view: viewKey }, { replace: true });
  };

  const closeAllModals = () => {
    setIsCreateMediaOpen(false);
    setIsGrantAccessOpen(false);
    setIsCreateEnrollmentOpen(false);
    setIsReturnModalOpen(false);
    setIsNotReturnedModalOpen(false);
    setIsEnrollmentStatusOpen(false);
    setIsOffboardOpen(false);
    setIsEnrollmentCollaboratorInlineOpen(false);
    setIsGrantExistingCollaborator(collaborators.length > 0);
    setGrantLockedCollaboratorId(null);
    setIsEnrollmentNotesOpen(false);
    setIsGrantNotesOpen(false);
    setCreateMediaOrigin('manual');
    setModalError('');
    setFormErrors({});
    setIsSubmitting(false);
    setActiveAssignmentAction(null);
    setActiveEnrollmentAction(null);
    setActiveOffboardTarget(null);
    setCollaboratorCreationTarget(null);
  };

  const closeCreateMediaModal = () => {
    setIsCreateMediaOpen(false);
    setCreateMediaOrigin('manual');
    setModalError('');
    setFormErrors({});
    setIsSubmitting(false);
  };

  const openCreateMediaModal = async (triggerElement = null, origin = 'manual') => {
    resetFeedback();
    setModalError('');
    setFormErrors({});
    createMediaReturnFocusRef.current = triggerElement || createMediaTriggerRef.current || grantAccessTriggerRef.current;
    setCreateMediaOrigin(origin);
    setCreateMediaForm(defaultCreateMediaForm);
    setIsCreateMediaOpen(true);
    await loadAvailableUnits();
  };

  const openGrantAccessModal = async ({
    assetUnitId = null,
    collaboratorId = null,
    lockCollaborator = false,
    systems = [],
    deactivateEnrollmentIds = [],
    triggerElement = null
  } = {}) => {
    resetFeedback();
    setModalError('');
    setFormErrors({});
    const normalizedCollaboratorId = collaboratorId ? String(collaboratorId) : '';
    const shouldUseExistingCollaborator = lockCollaborator
      || Boolean(normalizedCollaboratorId)
      || collaborators.length > 0;
    const normalizedSystems = Array.isArray(systems) ? Array.from(new Set(systems.filter(Boolean))) : [];
    const normalizedDeactivateEnrollmentIds = Array.isArray(deactivateEnrollmentIds)
      ? Array.from(new Set(
        deactivateEnrollmentIds
          .map((enrollmentId) => Number(enrollmentId))
          .filter((enrollmentId) => Number.isInteger(enrollmentId) && enrollmentId > 0)
      ))
      : [];
    grantAccessReturnFocusRef.current = triggerElement || grantAccessTriggerRef.current;
    setGrantLockedCollaboratorId(lockCollaborator && normalizedCollaboratorId ? Number(normalizedCollaboratorId) : null);
    setGrantAccessForm({
      ...defaultGrantAccessForm,
      collaborator_id: normalizedCollaboratorId,
      collaborator_create: {
        ...defaultCreateCollaboratorForm,
        employee_id: shouldUseExistingCollaborator ? '' : suggestedEmployeeId
      },
      deactivate_enrollment_ids: normalizedDeactivateEnrollmentIds,
      asset_unit_id: assetUnitId ? String(assetUnitId) : '',
      requires_rfid_override: Boolean(assetUnitId),
      systems: normalizedSystems,
      assigned_at: toDateTimeLocalValue()
    });
    setIsGrantExistingCollaborator(shouldUseExistingCollaborator);
    setIsGrantNotesOpen(false);
    setIsGrantAccessOpen(true);
    await loadAvailableUnits();
  };

  const toggleGrantCollaboratorMode = () => {
    if (grantLockedCollaboratorId) {
      return;
    }

    resetFeedback();
    setModalError('');
    setFormErrors({});
    const nextIsExisting = !isGrantExistingCollaborator;
    setIsGrantExistingCollaborator(nextIsExisting);
    setGrantAccessForm((current) => ({
      ...current,
      collaborator_id: '',
      deactivate_enrollment_ids: [],
      collaborator_create: {
        ...defaultCreateCollaboratorForm,
        employee_id: nextIsExisting ? '' : suggestedEmployeeId
      }
    }));
  };

  const openCreateEnrollmentModal = (context = null, triggerElement = null) => {
    resetFeedback();
    setModalError('');
    setFormErrors({});
    createEnrollmentReturnFocusRef.current = triggerElement || createEnrollmentTriggerRef.current || grantAccessTriggerRef.current;
    setCreateEnrollmentForm({
      ...defaultEnrollmentForm,
      collaborator_id: context?.collaborator?.id ? String(context.collaborator.id) : '',
      media_assignment_id: context?.assignment?.id ? String(context.assignment.id) : '',
      activated_at: toDateTimeLocalValue()
    });
    setCreateCollaboratorForm({
      ...defaultCreateCollaboratorForm,
      employee_id: suggestedEmployeeId
    });
    setIsEnrollmentCollaboratorInlineOpen(false);
    setIsEnrollmentNotesOpen(false);
    setCollaboratorCreationTarget(null);
    setIsCreateEnrollmentOpen(true);
  };

  const toggleEnrollmentCollaboratorInline = () => {
    resetFeedback();
    setModalError('');
    setFormErrors({});
    const nextOpen = !isEnrollmentCollaboratorInlineOpen;
    setIsEnrollmentCollaboratorInlineOpen(nextOpen);
    setCollaboratorCreationTarget(nextOpen ? 'enrollment-inline' : null);
    setCreateCollaboratorForm({
      ...defaultCreateCollaboratorForm,
      employee_id: suggestedEmployeeId
    });
  };

  const handleEnrollmentCollaboratorInlineKeyDown = (event) => {
    if (event.key !== 'Enter' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    event.preventDefault();
    void submitCreateCollaborator();
  };

  const toggleGrantSystem = (systemKey) => {
    setGrantAccessForm((current) => {
      const currentSystems = Array.isArray(current.systems) ? current.systems : [];
      const exists = currentSystems.includes(systemKey);
      let nextSystems = currentSystems;

      if (systemKey === 'production') {
        nextSystems = exists
          ? currentSystems.filter((entry) => entry !== 'production')
          : Array.from(new Set([...currentSystems, 'production', 'bathroom']));
      } else {
        nextSystems = exists
          ? currentSystems.filter((entry) => entry !== systemKey)
          : [...currentSystems, systemKey];
      }

      const nextHasOfficeOnlySelection = (
        nextSystems.includes('offices')
        && !nextSystems.includes('production')
        && !nextSystems.includes('bathroom')
      );
      const nextRequiresRfidOverride = nextHasOfficeOnlySelection ? current.requires_rfid_override : false;
      const nextRequiresRfid = (
        nextSystems.includes('production')
        || nextSystems.includes('bathroom')
        || Boolean(nextRequiresRfidOverride)
      );

      return {
        ...current,
        systems: nextSystems,
        requires_rfid_override: nextRequiresRfidOverride,
        asset_unit_id: nextRequiresRfid ? current.asset_unit_id : ''
      };
    });
  };

  const openReturnModal = (assignment) => {
    resetFeedback();
    setActiveAssignmentAction(assignment);
    setReturnForm({
      ...defaultReturnForm,
      returned_at: toDateTimeLocalValue()
    });
    setIsReturnModalOpen(true);
  };

  const openNotReturnedModal = (assignment) => {
    resetFeedback();
    setActiveAssignmentAction(assignment);
    setNotReturnedForm({
      ...defaultNotReturnedForm,
      resolved_at: toDateTimeLocalValue()
    });
    setIsNotReturnedModalOpen(true);
  };

  const openEnrollmentStatusModal = (enrollment) => {
    resetFeedback();
    setActiveEnrollmentAction(enrollment);
    setEnrollmentStatusForm({
      ...defaultEnrollmentStatusForm,
      status_key: '',
      media_assignment_id: enrollment.media_assignment_id ? String(enrollment.media_assignment_id) : '',
      activated_at: toDateTimeLocalValue(),
      deactivated_at: toDateTimeLocalValue()
    });
    setIsEnrollmentStatusOpen(true);
  };

  const openOffboardModal = (context) => {
    resetFeedback();
    if (!context?.collaborator?.id) {
      return;
    }

    const hasActiveAssignments = context.assignments?.some((assignment) => assignment.status_key === 'active');
    setActiveOffboardTarget(context);
    setOffboardForm({
      ...defaultOffboardForm,
      media_resolution: hasActiveAssignments ? 'returned' : '',
      offboarded_at: toDateTimeLocalValue(),
      notes: 'Baja operativa del colaborador en Accesos.'
    });
    setIsOffboardNotesOpen(false);
    setIsOffboardOpen(true);
  };

  const validateCreateMediaForm = () => {
    const errors = {};

    if (!normalizeFieldValue(createMediaForm.medium_type_key)) {
      errors['access-create-media-type'] = 'Selecciona un tipo de medio.';
    }

    if (!toPositiveNumberOrNull(createMediaForm.asset_unit_id)) {
      errors['access-create-media-unit'] = 'Selecciona una unidad RFID disponible.';
    }

    if (!normalizeFieldValue(createMediaForm.tag_code)) {
      errors['access-create-media-tag'] = 'Captura el tag o código.';
    }

    return errors;
  };

  const validateCollaboratorFields = (formState, fieldPrefix) => {
    const errors = {};

    if (!normalizeFieldValue(formState.employee_id)) {
      errors[`${fieldPrefix}-employee-id`] = 'Captura el ID operativo.';
    } else if (!toPositiveNumberOrNull(formState.employee_id)) {
      errors[`${fieldPrefix}-employee-id`] = 'El ID operativo debe ser un número entero mayor a cero.';
    } else if (employeeIdAvailability.min_employee_id && toPositiveNumberOrNull(formState.employee_id) < employeeIdAvailability.min_employee_id) {
      errors[`${fieldPrefix}-employee-id`] = `El ID operativo debe ser ${employeeIdAvailability.min_employee_id} o mayor.`;
    } else if (employeeIdAvailability.max_employee_id && toPositiveNumberOrNull(formState.employee_id) > employeeIdAvailability.max_employee_id) {
      errors[`${fieldPrefix}-employee-id`] = `El ID operativo no puede exceder ${employeeIdAvailability.max_employee_id}.`;
    }

    if (!normalizeFieldValue(formState.first_name)) {
      errors[`${fieldPrefix}-first-name`] = 'Captura el nombre.';
    }

    if (!normalizeFieldValue(formState.last_name)) {
      errors[`${fieldPrefix}-last-name`] = 'Captura los apellidos.';
    }

    return errors;
  };

  const validateCreateCollaboratorForm = () => validateCollaboratorFields(
    createCollaboratorForm,
    'access-create-collaborator'
  );

  const validateGrantAccessForm = () => {
    const errors = {};

    if (isGrantExistingCollaborator) {
      if (!toPositiveNumberOrNull(grantAccessForm.collaborator_id)) {
        errors['access-grant-collaborator'] = 'Selecciona un colaborador.';
      }
    } else {
      Object.assign(errors, validateCollaboratorFields(
        grantAccessForm.collaborator_create,
        'access-grant-collaborator'
      ));
    }

    if (grantRequiresRfid && !grantHasReusableActiveAssignment && !toPositiveNumberOrNull(grantAccessForm.asset_unit_id)) {
      errors['access-grant-media'] = 'Selecciona un RFID disponible.';
    }

    if (!normalizeFieldValue(grantAccessForm.assigned_at)) {
      errors['access-grant-assigned-at'] = 'Indica la fecha de entrega del acceso.';
    }

    if (!Array.isArray(grantAccessForm.systems) || grantAccessForm.systems.length === 0) {
      errors['access-grant-systems'] = 'Selecciona al menos un sistema a habilitar.';
    }

    return errors;
  };

  const validateCreateEnrollmentForm = () => {
    const errors = {};

    if (!toPositiveNumberOrNull(createEnrollmentForm.collaborator_id)) {
      errors['access-create-enrollment-collaborator'] = 'Selecciona un colaborador.';
    }

    if (!toPositiveNumberOrNull(createEnrollmentForm.access_system_id)) {
      errors['access-create-enrollment-system'] = 'Selecciona un sistema.';
    }

    if (createEnrollmentForm.status_key === 'active' && !normalizeFieldValue(createEnrollmentForm.activated_at)) {
      errors['access-create-enrollment-activated-at'] = 'Indica la activación.';
    }

    if (enrollmentRequiresRfid && !toPositiveNumberOrNull(createEnrollmentForm.media_assignment_id)) {
      errors['access-create-enrollment-assignment'] = 'Selecciona un RFID activo.';
    }

    return errors;
  };

  const validateReturnForm = () => {
    const errors = {};

    if (!toPositiveNumberOrNull(returnForm.location_id)) {
      errors['access-return-location'] = 'Selecciona la ubicacion donde regresa el medio.';
    }

    if (!normalizeFieldValue(returnForm.returned_at)) {
      errors['access-return-returned-at'] = 'Indica la fecha de devolucion.';
    }

    return errors;
  };

  const validateNotReturnedForm = () => {
    const errors = {};

    if (!normalizeFieldValue(notReturnedForm.resolved_at)) {
      errors['access-not-returned-resolved-at'] = 'Indica la fecha de cierre.';
    }

    return errors;
  };

  const validateEnrollmentStatusForm = () => {
    const errors = {};

    if (!activeEnrollmentAction) {
      errors['access-enrollment-next-status'] = 'No se encontro el alta que intentas actualizar.';
      return errors;
    }

    if (!normalizeFieldValue(enrollmentStatusForm.status_key)) {
      errors['access-enrollment-next-status'] = 'Selecciona el nuevo estado.';
    }

    if (enrollmentStatusForm.status_key === 'active' && !normalizeFieldValue(enrollmentStatusForm.activated_at)) {
      errors['access-enrollment-activated-at'] = 'Indica la fecha de activacion.';
    }

    if (enrollmentStatusForm.status_key === 'deactivated' && !normalizeFieldValue(enrollmentStatusForm.deactivated_at)) {
      errors['access-enrollment-deactivated-at'] = 'Indica la fecha de baja.';
    }

    return errors;
  };

  const validateOffboardForm = () => {
    const errors = {};
    const hasActiveAssignments = activeOffboardTarget?.assignments?.some((assignment) => assignment.status_key === 'active');

    if (!normalizeFieldValue(offboardForm.offboarded_at)) {
      errors['access-offboarded-at'] = 'Indica la fecha de baja.';
    }

    if (hasActiveAssignments && !normalizeFieldValue(offboardForm.media_resolution)) {
      errors['access-offboard-resolution'] = 'Indica si el medio fue devuelto o no devuelto.';
    }

    if (hasActiveAssignments && offboardForm.media_resolution === 'returned' && !toPositiveNumberOrNull(offboardForm.location_id)) {
      errors['access-offboard-location'] = 'Selecciona la ubicacion donde se reintegrara el medio.';
    }

    return errors;
  };

  const runMutation = async (operation, successMessage) => {
    setIsSubmitting(true);
    setModalError('');
    resetFeedback();

    try {
      await operation();
      await loadCoreData();
      closeAllModals();
      setActionSuccess(successMessage);
    } catch (error) {
      if (isAccessAuthError(error) || isCollaboratorAuthError(error) || isInventoryAuthError(error)) {
        clearSession();
        return;
      }

      setModalError(normalizeErrorMessage(error, 'No fue posible completar la acción solicitada.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMediaSubmit = async (event) => {
    event.preventDefault();
    const errors = validateCreateMediaForm();
    if (Object.keys(errors).length > 0) {
      applyValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setModalError('');
    resetFeedback();

    try {
      const createdMedia = await createAccessMedia({
        medium_type_key: createMediaForm.medium_type_key,
        asset_unit_id: toPositiveNumberOrNull(createMediaForm.asset_unit_id),
        tag_code: normalizeFieldValue(createMediaForm.tag_code),
        notes: normalizeFieldValue(createMediaForm.notes) || undefined
      });

      await loadCoreData();

      if (createMediaOrigin === 'grant') {
        setGrantAccessForm((current) => ({
          ...current,
          asset_unit_id: createdMedia.asset_unit_id ? String(createdMedia.asset_unit_id) : current.asset_unit_id,
          requires_rfid_override: true
        }));
        closeCreateMediaModal();
      } else {
        closeAllModals();
      }

      setActionSuccess('RFID registrado en Accesos.');
    } catch (error) {
      if (isAccessAuthError(error) || isCollaboratorAuthError(error) || isInventoryAuthError(error)) {
        clearSession();
        return;
      }

      setModalError(normalizeErrorMessage(error, 'No fue posible registrar el RFID.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCreateCollaborator = async () => {
    const errors = validateCreateCollaboratorForm();
    if (Object.keys(errors).length > 0) {
      applyValidationErrors(errors);
      return false;
    }

    setIsSubmitting(true);
    setModalError('');

    try {
      const createdCollaborator = await createCollaborator({
        employee_id: toPositiveNumberOrNull(createCollaboratorForm.employee_id),
        first_name: normalizeFieldValue(createCollaboratorForm.first_name),
        last_name: normalizeFieldValue(createCollaboratorForm.last_name),
        area_name: normalizeFieldValue(createCollaboratorForm.area_name) || undefined,
        status: 'active'
      });

      const collaboratorRows = await listCollaborators({ status: 'active' });
      setCollaborators(collaboratorRows);

      if (collaboratorCreationTarget === 'enrollment-inline') {
        setCreateEnrollmentForm((current) => ({
          ...current,
          collaborator_id: String(createdCollaborator.id),
          media_assignment_id: ''
        }));
        setIsEnrollmentCollaboratorInlineOpen(false);
        setCreateCollaboratorForm(defaultCreateCollaboratorForm);
        setCollaboratorCreationTarget(null);
        setFormErrors({});
        setModalError('');
      }

      setActionSuccess('Colaborador registrado correctamente.');
      return true;
    } catch (error) {
      if (isAccessAuthError(error) || isCollaboratorAuthError(error) || isInventoryAuthError(error)) {
        clearSession();
        return false;
      }

      setModalError(normalizeErrorMessage(error, 'No fue posible registrar el colaborador.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrantAccessSubmit = async (event) => {
    event.preventDefault();
    const errors = validateGrantAccessForm();
    if (Object.keys(errors).length > 0) {
      applyValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setModalError('');
    resetFeedback();

    try {
      const response = await grantCollaboratorAccess({
        collaborator_id: isGrantExistingCollaborator ? toPositiveNumberOrNull(grantAccessForm.collaborator_id) : undefined,
        collaborator_create: isGrantExistingCollaborator ? undefined : {
          employee_id: toPositiveNumberOrNull(grantAccessForm.collaborator_create.employee_id),
          first_name: normalizeFieldValue(grantAccessForm.collaborator_create.first_name),
          last_name: normalizeFieldValue(grantAccessForm.collaborator_create.last_name),
          area_name: normalizeFieldValue(grantAccessForm.collaborator_create.area_name) || undefined
        },
        deactivate_enrollment_ids: grantAccessForm.deactivate_enrollment_ids,
        asset_unit_id: grantRequiresRfid && !grantHasReusableActiveAssignment
          ? toPositiveNumberOrNull(grantAccessForm.asset_unit_id)
          : undefined,
        requires_rfid_override: grantHasOfficeOnlySelection ? Boolean(grantAccessForm.requires_rfid_override) : undefined,
        systems: grantAccessForm.systems,
        assigned_at: normalizeFieldValue(grantAccessForm.assigned_at) || undefined,
        notes: normalizeFieldValue(grantAccessForm.notes) || undefined
      });

      const createdEnrollments = Array.isArray(response?.enrollments) ? response.enrollments : [];
      const preferredEnrollment = grantAccessForm.systems
        .map((systemKey) => createdEnrollments.find((enrollment) => enrollment.access_system?.system_key === systemKey))
        .find(Boolean) || createdEnrollments[0] || null;
      const resolvedCollaboratorId = (
        toPositiveNumberOrNull(response?.collaborator?.id)
        || toPositiveNumberOrNull(preferredEnrollment?.collaborator?.id)
        || toPositiveNumberOrNull(grantAccessForm.collaborator_id)
      );

      await loadCoreData();
      closeAllModals();
      if (resolvedCollaboratorId) {
        openAccessDetail('enrollment', resolvedCollaboratorId, grantAccessTriggerRef.current);
      }
      setActionSuccess('Acceso otorgado correctamente.');
    } catch (error) {
      if (isAccessAuthError(error) || isCollaboratorAuthError(error) || isInventoryAuthError(error)) {
        clearSession();
        return;
      }

      setModalError(normalizeErrorMessage(error, 'No fue posible otorgar el acceso solicitado.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateEnrollmentSubmit = async (event) => {
    event.preventDefault();
    const errors = validateCreateEnrollmentForm();
    if (Object.keys(errors).length > 0) {
      applyValidationErrors(errors);
      return;
    }

    await runMutation(() => createAccessEnrollment({
      collaborator_id: toPositiveNumberOrNull(createEnrollmentForm.collaborator_id),
      access_system_id: toPositiveNumberOrNull(createEnrollmentForm.access_system_id),
      media_assignment_id: toPositiveNumberOrNull(createEnrollmentForm.media_assignment_id) || undefined,
      status_key: createEnrollmentForm.status_key,
      activated_at: normalizeFieldValue(createEnrollmentForm.activated_at) || undefined,
      notes: normalizeFieldValue(createEnrollmentForm.notes) || undefined
    }), 'Alta registrada correctamente.');
  };

  const handleReturnSubmit = async (event) => {
    event.preventDefault();
    if (!activeAssignmentAction) {
      return;
    }
    const errors = validateReturnForm();
    if (Object.keys(errors).length > 0) {
      applyValidationErrors(errors);
      return;
    }

    await runMutation(() => returnAccessMediaAssignment(activeAssignmentAction.id, {
      location_id: toPositiveNumberOrNull(returnForm.location_id),
      returned_at: normalizeFieldValue(returnForm.returned_at) || undefined,
      notes: normalizeFieldValue(returnForm.notes) || undefined
    }), 'El medio fue devuelto y reintegrado correctamente.');
  };

  const handleNotReturnedSubmit = async (event) => {
    event.preventDefault();
    if (!activeAssignmentAction) {
      return;
    }
    const errors = validateNotReturnedForm();
    if (Object.keys(errors).length > 0) {
      applyValidationErrors(errors);
      return;
    }

    await runMutation(() => markAccessMediaAssignmentNotReturned(activeAssignmentAction.id, {
      resolved_at: normalizeFieldValue(notReturnedForm.resolved_at) || undefined,
      notes: normalizeFieldValue(notReturnedForm.notes) || undefined
    }), 'El medio quedó marcado como no devuelto.');
  };

  const handleEnrollmentStatusSubmit = async (event) => {
    event.preventDefault();
    if (!activeEnrollmentAction) {
      return;
    }
    const errors = validateEnrollmentStatusForm();
    if (Object.keys(errors).length > 0) {
      applyValidationErrors(errors);
      return;
    }

    await runMutation(() => updateAccessEnrollmentStatus(activeEnrollmentAction.id, {
      status_key: enrollmentStatusForm.status_key,
      media_assignment_id: toPositiveNumberOrNull(enrollmentStatusForm.media_assignment_id) || undefined,
      activated_at: enrollmentStatusForm.status_key === 'active' ? (normalizeFieldValue(enrollmentStatusForm.activated_at) || undefined) : undefined,
      deactivated_at: enrollmentStatusForm.status_key === 'deactivated' ? (normalizeFieldValue(enrollmentStatusForm.deactivated_at) || undefined) : undefined,
      notes: normalizeFieldValue(enrollmentStatusForm.notes) || undefined
    }), 'Estado del alta actualizado correctamente.');
  };

  const handleOffboardSubmit = async (event) => {
    event.preventDefault();
    if (!activeOffboardTarget?.collaborator?.id) {
      return;
    }
    const errors = validateOffboardForm();
    if (Object.keys(errors).length > 0) {
      applyValidationErrors(errors);
      return;
    }

    const hasActiveAssignments = activeOffboardTarget.assignments?.some((assignment) => assignment.status_key === 'active');

    await runMutation(() => offboardCollaboratorAccess(activeOffboardTarget.collaborator.id, {
      media_resolution: hasActiveAssignments ? offboardForm.media_resolution : undefined,
      location_id: hasActiveAssignments && offboardForm.media_resolution === 'returned' && offboardForm.location_id
        ? toPositiveNumberOrNull(offboardForm.location_id)
        : undefined,
      offboarded_at: normalizeFieldValue(offboardForm.offboarded_at) || undefined,
      notes: normalizeFieldValue(offboardForm.notes) || undefined
    }), 'El acceso se cerró correctamente.');
  };

  const headerActions = (
    <>
      {canGrantAccess ? (
        <button
          type="button"
          className="workspace-action workspace-action--primary"
          ref={grantAccessTriggerRef}
          onClick={(event) => openGrantAccessModal({ triggerElement: event.currentTarget })}
        >
          <ShieldCheck size={16} aria-hidden="true" />
          <span>Dar acceso</span>
        </button>
      ) : null}
    </>
  );

  const renderAssignmentTable = () => (
    <table className="data-table__table inventory-table inventory-table--assignments">
      <thead>
        <tr>
          <th scope="col">Colaborador</th>
          <th scope="col">Medio</th>
          <th scope="col">Estado</th>
          <th scope="col">Asignado</th>
          <th scope="col">Retorno</th>
          <th scope="col">Acción</th>
        </tr>
      </thead>
      <tbody>
        {assignmentPage.rows.map((assignment) => {
          const isActiveRow = Number(selectedAssignmentId) === Number(assignment.id);

          return (
            <tr
              key={assignment.id}
              className={`data-table__row inventory-table__row${isActiveRow ? ' data-table__row--active' : ''}`}
            >
              <td className="data-table__cell">
                <button
                  type="button"
                  className="data-table__row-action"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      accessDetailKeyboardIntentRef.current = true;
                    }
                  }}
                  onClick={(event) => openAccessDetail('assignment', assignment.id, event.currentTarget, {
                    shouldAutoFocus: event.detail === 0
                  })}
                  aria-label={`Ver detalle de la asignación de ${assignment.collaborator?.full_name || 'colaborador sin nombre'}`}
                  aria-controls={ACCESS_DETAIL_ID}
                  aria-expanded={activeView === 'assignments' && isActiveRow}
                >
                  <span className="data-table__item-title">{assignment.collaborator?.full_name || 'Sin colaborador'}</span>
                  <span className="data-table__item-meta access-table__meta">{assignment.collaborator?.employee_id ? `ID ${assignment.collaborator.employee_id}` : 'Sin ID'}</span>
                </button>
              </td>
              <td className="data-table__cell">
                <span className="data-table__item-title">{assignment.media?.tag_code || 'Sin tag'}</span>
                <span className="data-table__item-meta access-table__meta">{assignment.media?.asset_tag || 'Sin unidad física'}</span>
              </td>
              <td className="data-table__cell">
                <span className={getAssignmentStatusToneClass(assignment.status_key)}>{assignment.status_name}</span>
              </td>
              <td className="data-table__cell">
                <span className="access-table__supporting">{formatDateTime(assignment.assigned_at)}</span>
              </td>
              <td className="data-table__cell">
                <span className="access-table__supporting">{assignment.expected_return_at ? formatDateOnly(assignment.expected_return_at) : 'Sin fecha'}</span>
              </td>
              <td className="data-table__cell">
                <div className="inventory-table__actions access-table__actions">
                  {assignment.status_key === 'active' && canAssignAccess ? (
                    <button type="button" className="action-inline action-inline--primary" onClick={(event) => {
                      event.stopPropagation();
                      openReturnModal(assignment);
                    }}>
                      <Undo2 size={14} aria-hidden="true" />
                      <span>Devolver</span>
                    </button>
                  ) : null}
                  {assignment.status_key === 'active' && canAssignAccess ? (
                    <button type="button" className="action-inline action-inline--secondary" onClick={(event) => {
                      event.stopPropagation();
                      openNotReturnedModal(assignment);
                    }}>
                      <CircleOff size={14} aria-hidden="true" />
                      <span>No devuelto</span>
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderMediaTable = () => (
    <table className="data-table__table inventory-table inventory-table--assignments">
      <thead>
        <tr>
          <th scope="col">Tag</th>
          <th scope="col">Tipo</th>
          <th scope="col">Unidad</th>
          <th scope="col">Estado</th>
          <th scope="col">Asignación activa</th>
          <th scope="col">Acción</th>
        </tr>
      </thead>
      <tbody>
        {mediaPage.rows.map((item) => {
          const isActiveRow = Number(selectedMediaId) === Number(item.id);

          return (
            <tr
              key={item.id}
              className={`data-table__row inventory-table__row${isActiveRow ? ' data-table__row--active' : ''}`}
            >
              <td className="data-table__cell">
                <button
                  type="button"
                  className="data-table__row-action"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      accessDetailKeyboardIntentRef.current = true;
                    }
                  }}
                  onClick={(event) => openAccessDetail('media', item.id, event.currentTarget, {
                    shouldAutoFocus: event.detail === 0
                  })}
                  aria-label={`Ver detalle del RFID ${item.tag_code}`}
                  aria-controls={ACCESS_DETAIL_ID}
                  aria-expanded={activeView === 'media' && isActiveRow}
                >
                  <span className="data-table__item-title">{item.tag_code}</span>
                  <span className="data-table__item-meta access-table__meta">{toAccessSupportNote(item.notes) || 'Sin observaciones'}</span>
                </button>
              </td>
              <td className="data-table__cell">{item.medium_type_name}</td>
              <td className="data-table__cell">
                <span className="data-table__item-title">{item.asset_unit?.asset_tag || 'Sin unidad'}</span>
                <span className="data-table__item-meta access-table__meta">{item.asset_unit?.serial_number || 'Sin serie'}</span>
              </td>
              <td className="data-table__cell">
                <span className={getMediumStatusToneClass(item.status_key)}>{item.status_name}</span>
              </td>
              <td className="data-table__cell">
                <span className="access-table__supporting">{item.active_assignment?.collaborator?.full_name || 'Disponible'}</span>
              </td>
              <td className="data-table__cell">
                <div className="inventory-table__actions access-table__actions">
                  {item.status_key === 'available' && canGrantAccess ? (
                    <button type="button" className="action-inline action-inline--primary" onClick={(event) => {
                      event.stopPropagation();
                      openGrantAccessModal({
                        assetUnitId: item.asset_unit?.id || item.asset_unit_id,
                        triggerElement: event.currentTarget
                      });
                    }}>
                      <ShieldCheck size={14} aria-hidden="true" />
                      <span>Dar acceso</span>
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderEnrollmentTable = () => (
    <table className="data-table__table inventory-table inventory-table--assignments">
      <thead>
        <tr>
          <th scope="col">Colaborador</th>
          <th scope="col">Sistemas vigentes</th>
          <th scope="col">RFID</th>
          <th scope="col">Estado operativo</th>
          <th scope="col">Último movimiento</th>
        </tr>
      </thead>
      <tbody>
        {enrollmentPage.rows.map((row) => {
          const isActiveRow = Number(selectedEnrollmentCollaboratorId) === Number(row.collaborator_id);
          const collaboratorName = row.collaborator?.full_name || 'Sin colaborador';
          const collaboratorMeta = [
            row.collaborator?.employee_id ? `ID ${row.collaborator.employee_id}` : 'Sin ID',
            row.collaborator?.area_name || ''
          ].filter(Boolean).join(' · ');
          const systemsText = row.currentSystemsText || row.enrollment?.access_system?.name || 'Sin sistema vigente';
          const enrollmentCountLabel = row.enrollments.length === 1
            ? '1 alta registrada'
            : `${row.enrollments.length} altas registradas`;
          const mediaTitle = row.media?.tag_code || 'Sin RFID ligado';
          const mediaMeta = row.media?.asset_unit?.asset_tag || row.media?.asset_tag || 'Sin unidad física vinculada';

          return (
            <tr
              key={row.collaborator_id}
              className={`data-table__row inventory-table__row${isActiveRow ? ' data-table__row--active' : ''}`}
            >
              <td className="data-table__cell">
                <button
                  type="button"
                  className="data-table__row-action"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      accessDetailKeyboardIntentRef.current = true;
                    }
                  }}
                  onClick={(event) => openAccessDetail('enrollment', row.collaborator_id, event.currentTarget, {
                    shouldAutoFocus: event.detail === 0
                  })}
                  aria-label={`Ver detalle de accesos de ${collaboratorName}`}
                  aria-controls={ACCESS_DETAIL_ID}
                  aria-expanded={activeView === 'enrollments' && isActiveRow}
                >
                  <span className="data-table__item-title">{collaboratorName}</span>
                  <span className="data-table__item-meta access-table__meta">{collaboratorMeta}</span>
                </button>
              </td>
              <td className="data-table__cell">
                <div className="access-table__stack">
                  <span className="data-table__item-title">{systemsText}</span>
                  <span className="data-table__item-meta access-table__meta">{enrollmentCountLabel}</span>
                </div>
              </td>
              <td className="data-table__cell">
                <div className="access-table__stack">
                  <span className="data-table__item-title">{mediaTitle}</span>
                  <span className="data-table__item-meta access-table__meta">{mediaMeta}</span>
                </div>
              </td>
              <td className="data-table__cell">
                <div className="access-table__stack">
                  <span className={getEnrollmentStatusToneClass(row.status_key)}>{row.status_name}</span>
                  <span className="access-table__supporting">{row.status_note}</span>
                </div>
              </td>
              <td className="data-table__cell"><span className="access-table__supporting">{row.latestActivityLabel}</span></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderEventTable = () => (
    <table className="data-table__table inventory-table inventory-table--assignments">
      <thead>
        <tr>
          <th scope="col">Evento</th>
          <th scope="col">Colaborador</th>
          <th scope="col">Sistema</th>
          <th scope="col">Medio</th>
          <th scope="col">Fecha</th>
          <th scope="col">Operador</th>
        </tr>
      </thead>
      <tbody>
        {eventPage.rows.map((eventRow) => {
          const isActiveRow = Number(selectedEventId) === Number(eventRow.id);

          return (
            <tr
              key={eventRow.id}
              className={`data-table__row inventory-table__row${isActiveRow ? ' data-table__row--active' : ''}`}
            >
              <td className="data-table__cell">
                <button
                  type="button"
                  className="data-table__row-action"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      accessDetailKeyboardIntentRef.current = true;
                    }
                  }}
                  onClick={(event) => openAccessDetail('event', eventRow.id, event.currentTarget, {
                    shouldAutoFocus: event.detail === 0
                  })}
                  aria-label={`Ver detalle del evento ${toEventLabel(eventRow.event_type)}`}
                  aria-controls={ACCESS_DETAIL_ID}
                  aria-expanded={activeView === 'history' && isActiveRow}
                >
                  <span className="data-table__item-title">{toEventLabel(eventRow.event_type)}</span>
                  <span className="data-table__item-meta access-table__meta">{toAccessEventNote(eventRow.notes) || 'Sin observaciones'}</span>
                </button>
              </td>
              <td className="data-table__cell">{eventRow.collaborator_name || 'Sin colaborador'}</td>
              <td className="data-table__cell">{eventRow.access_system_name || 'Sin sistema'}</td>
              <td className="data-table__cell">{eventRow.tag_code || 'Sin medio'}</td>
              <td className="data-table__cell"><span className="access-table__supporting">{formatDateTime(eventRow.happened_at)}</span></td>
              <td className="data-table__cell">{eventRow.operator_name || 'Sistema'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const offboardHasActiveAssignments = Boolean(
    activeOffboardTarget?.assignments?.some((assignment) => assignment.status_key === 'active')
  );
  const activeAssignmentsForDetail = detailContext?.assignments?.filter((assignment) => assignment.status_key === 'active') || [];
  const detailCurrentEnrollments = detailContext?.currentEnrollments?.length
    ? detailContext.currentEnrollments
    : (detailContext?.enrollment ? [detailContext.enrollment] : []);
  const detailHasFieldAccess = detailCurrentEnrollments.some((enrollment) => {
    const systemKey = enrollment.access_system?.system_key;
    return systemKey === 'production' || systemKey === 'bathroom';
  });
  const detailEnrollmentCanMigrate = detailCurrentEnrollments.some((enrollment) => (
    enrollment.status_key === 'active' && enrollment.access_system?.system_key === 'offices'
  )) && !detailHasFieldAccess;
  const detailHasActiveOperationalRecord = detailContext?.assignment?.status_key === 'active'
    || detailCurrentEnrollments.some((enrollment) => enrollment.status_key === 'active');
  const canGrantFromDetail = Boolean(detailContext?.collaborator?.id)
    && canGrantAccess
    && !detailHasActiveOperationalRecord;
  const canMigrateFromDetail = Boolean(detailContext?.collaborator?.id) && canGrantAccess && detailEnrollmentCanMigrate;
  const canOffboardFromDetail = Boolean(detailContext?.collaborator?.id)
    && (detailContext?.enrollments?.some((enrollment) => enrollment.status_key !== 'deactivated') || activeAssignmentsForDetail.length > 0);
  const accessDetailHasActions = Boolean(
    (detailContext?.media?.status_key === 'available' && canGrantAccess)
    || (detailContext?.assignment?.status_key === 'active' && canAssignAccess)
    || canMigrateFromDetail
    || canGrantFromDetail
    || canOffboardFromDetail
  );

  const accessDetailStatus = detailContext?.type === 'assignment' && detailContext?.assignment ? {
    label: detailContext.assignment.status_name,
    className: getAssignmentStatusToneClass(detailContext.assignment.status_key)
  } : detailContext?.enrollment ? {
    label: detailContext.enrollment.status_name,
    className: getEnrollmentStatusToneClass(detailContext.enrollment.status_key)
  } : detailContext?.assignment ? {
    label: detailContext.assignment.status_name,
    className: getAssignmentStatusToneClass(detailContext.assignment.status_key)
  } : detailContext?.media ? {
    label: detailContext.media.status_name,
    className: getMediumStatusToneClass(detailContext.media.status_key)
  } : detailContext?.event ? {
    label: toEventLabel(detailContext.event.event_type),
    className: 'inventory-status-chip inventory-status-chip--neutral'
  } : null;

  const accessDetailIdentifier = detailContext?.collaborator?.employee_id
    ? `ID ${detailContext.collaborator.employee_id}`
    : detailContext?.media?.asset_unit?.asset_tag
      || detailContext?.media?.tag_code
      || 'Accesos';
  const accessDetailCurrentSystemsText = formatListConjunction(
    detailCurrentEnrollments
      .map((enrollment) => enrollment.access_system?.name || '')
      .filter(Boolean)
  );
  const accessDetailSystemsSummary = accessDetailCurrentSystemsText
    || detailContext?.enrollment?.access_system?.name
    || detailContext?.event?.access_system_name
    || 'Sin sistema vigente';
  const accessDetailMediaSummary = detailContext?.media
    ? toMediaLabel(detailContext.media)
    : (detailContext?.event?.tag_code || 'Sin RFID ligado');
  const accessDetailDateValue = detailContext?.assignment?.assigned_at
    || detailContext?.enrollment?.activated_at
    || detailContext?.event?.happened_at
    || null;
  const accessDetailDateLabel = detailContext?.assignment
    ? 'Asignado'
    : detailContext?.enrollment
      ? 'Activo desde'
      : detailContext?.event
        ? 'Evento'
        : 'Fecha';
  const shouldShowAccessCollaboratorFact = Boolean(
    detailContext?.collaborator?.full_name
    && detailContext.title !== detailContext.collaborator.full_name
  );

  const accessDetailToolbar = accessDetailHasActions ? (
    <div className="inventory-asset-detail__toolbar panel-detail__toolbar access-detail__toolbar" aria-label="Acciones operativas del acceso">
      {detailContext?.media?.status_key === 'available' && canGrantAccess ? (
        <button
          type="button"
          className="workspace-action workspace-action--primary"
          onClick={(event) => openGrantAccessModal({
            assetUnitId: detailContext.media.asset_unit?.id || detailContext.media.asset_unit_id,
            triggerElement: event.currentTarget
          })}
        >
          <ShieldCheck size={14} aria-hidden="true" />
          <span>Dar acceso</span>
        </button>
      ) : null}
      {canMigrateFromDetail ? (
        <button
          type="button"
          className="workspace-action workspace-action--primary"
          onClick={(event) => openGrantAccessModal({
            collaboratorId: detailContext.collaborator.id,
            lockCollaborator: true,
            systems: ['production', 'bathroom'],
            triggerElement: event.currentTarget
          })}
        >
          <ShieldCheck size={14} aria-hidden="true" />
          <span>Migrar acceso</span>
        </button>
      ) : null}
      {canGrantFromDetail ? (
        <button
          type="button"
          className="workspace-action workspace-action--primary"
          onClick={(event) => openGrantAccessModal({
            collaboratorId: detailContext.collaborator.id,
            lockCollaborator: true,
            triggerElement: event.currentTarget
          })}
        >
          <ShieldCheck size={14} aria-hidden="true" />
          <span>Dar acceso</span>
        </button>
      ) : null}
      {detailContext?.assignment?.status_key === 'active' && canAssignAccess ? (
        <button
          type="button"
          className="workspace-action workspace-action--primary"
          onClick={() => openReturnModal(detailContext.assignment)}
        >
          <Undo2 size={14} aria-hidden="true" />
          <span>Devolver</span>
        </button>
      ) : null}
      {((detailContext?.assignment?.status_key === 'active' && canAssignAccess) || (canOffboardFromDetail && canAssignAccess)) ? (
        <div className="inventory-asset-detail__toolbar-secondary panel-detail__toolbar-secondary access-detail__toolbar-secondary">
          {detailContext?.assignment?.status_key === 'active' && canAssignAccess ? (
            <button
              type="button"
              className="inventory-asset-detail__toolbar-action panel-detail__toolbar-action"
              onClick={() => openNotReturnedModal(detailContext.assignment)}
            >
              <CircleOff size={14} aria-hidden="true" />
              <span>No devuelto</span>
            </button>
          ) : null}
          {canOffboardFromDetail && canAssignAccess ? (
            <button
              type="button"
              className="inventory-asset-detail__toolbar-action panel-detail__toolbar-action"
              onClick={() => openOffboardModal(detailContext)}
            >
              <UserMinus size={14} aria-hidden="true" />
              <span>Cerrar acceso</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  ) : null;

  const hasAccessRelatedContext = Boolean(
    detailContext?.assignment
    || detailContext?.media
    || detailContext?.enrollment
    || detailContext?.event
  );

  const accessDetailTabOptions = [
    { key: 'summary', label: 'Resumen' },
    { key: 'enrollments', label: 'Altas', count: detailContext?.enrollments?.length || 0 },
    { key: 'history', label: 'Historial', count: detailContext?.events?.length || 0 }
  ];

  const accessDetailPanel = detailContext ? (
    <div
      className="ticket-detail panel-detail ticket-detail--tone-primary inventory-asset-detail access-detail"
      onKeyDownCapture={(event) => {
        if (event.key !== 'Escape') {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        closeAccessDetail();
      }}
    >
      <header className="ticket-detail__header panel-detail__header inventory-asset-detail__header access-detail__header">
        <div className="ticket-detail__header-top panel-detail__header-top">
          <div className="ticket-detail__header-id panel-detail__header-id inventory-asset-detail__header-id access-detail__header-id">
            <span className="ticket-detail__ticket-id">{accessDetailIdentifier}</span>
            {accessDetailStatus ? (
              <span className={accessDetailStatus.className}>{accessDetailStatus.label}</span>
            ) : null}
          </div>
          <div className="ticket-detail__header-actions panel-detail__header-actions inventory-asset-detail__header-actions access-detail__header-actions">
            <button
              type="button"
              className="ticket-detail__close access-detail__close"
              ref={accessDetailCloseButtonRef}
              onClick={() => closeAccessDetail()}
              aria-label="Cerrar detalle de accesos"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
        <h2 id={ACCESS_DETAIL_TITLE_ID} className="ticket-detail__title panel-detail__title inventory-asset-detail__title">{detailContext.title}</h2>
        <p className="ticket-detail__summary panel-detail__summary-copy inventory-asset-detail__summary-copy access-detail__summary-copy">{detailContext.subtitle}</p>
      </header>

      <section className="ticket-detail__section ticket-detail__section--log panel-detail__section panel-detail__section--log inventory-asset-detail__log access-detail__log">
        <DrawerTabs
          label="Secciones del detalle de acceso"
          activeKey={activeAccessDetailTab}
          onChange={setActiveAccessDetailTab}
          className="ticket-detail__tabs panel-detail__tabs inventory-asset-detail__tabs-rail access-detail__tabs-rail"
          tabs={accessDetailTabOptions.map((tabOption) => ({
            key: tabOption.key,
            label: tabOption.label,
            id: `access-detail-tab-${tabOption.key}`,
            controls: `access-detail-panel-${tabOption.key}`,
            count: tabOption.count
          }))}
        />

        <div className="inventory-asset-detail__content panel-detail__content access-detail__content">
          <section
            id="access-detail-panel-summary"
            role="tabpanel"
            aria-labelledby="access-detail-tab-summary"
            hidden={activeAccessDetailTab !== 'summary'}
            className="ticket-detail__tab-panel panel-detail__tab-panel inventory-asset-detail__panel access-detail__panel"
          >
            <div className="panel-detail__summary-layout access-detail__summary-layout">
              <section className="ticket-detail__section panel-detail__section inventory-asset-detail__section access-detail__section">
                <div className="inventory-asset-detail__panel-header panel-detail__panel-header access-detail__panel-header">
                  <div>
                    <h3 className="inventory-asset-detail__panel-title panel-detail__panel-title access-detail__panel-title">Acceso actual</h3>
                  </div>
                  {accessDetailToolbar}
                </div>

                <dl className="ticket-detail__meta-grid panel-detail__facts inventory-asset-detail__meta-grid access-detail__meta-grid">
                  {shouldShowAccessCollaboratorFact ? (
                    <div className="ticket-detail__meta-item panel-detail__fact">
                      <dt className="ticket-detail__meta-label panel-detail__fact-label">Colaborador</dt>
                      <dd>{detailContext.collaborator.full_name}</dd>
                    </div>
                  ) : null}
                  <div className="ticket-detail__meta-item panel-detail__fact">
                    <dt className="ticket-detail__meta-label panel-detail__fact-label">Sistemas</dt>
                    <dd>{accessDetailSystemsSummary}</dd>
                  </div>
                  <div className="ticket-detail__meta-item panel-detail__fact">
                    <dt className="ticket-detail__meta-label panel-detail__fact-label">RFID</dt>
                    <dd>{accessDetailMediaSummary}</dd>
                  </div>
                  <div className="ticket-detail__meta-item panel-detail__fact">
                    <dt className="ticket-detail__meta-label panel-detail__fact-label">{accessDetailDateLabel}</dt>
                    <dd>{accessDetailDateValue ? formatDateTime(accessDetailDateValue) : 'Sin fecha registrada'}</dd>
                  </div>
                </dl>
              </section>

              {hasAccessRelatedContext ? (
                <section className="ticket-detail__section panel-detail__section inventory-asset-detail__section access-detail__section access-detail__section--related">
                  <div className="ticket-detail__section-headline panel-detail__section-headline inventory-asset-detail__section-headline access-detail__section-headline">
                    <h3 className="ticket-detail__section-title panel-detail__section-title inventory-asset-detail__section-title access-detail__section-title">
                      Detalles
                    </h3>
                  </div>

                  <ul className="access-detail__list inventory-asset-detail__list panel-detail__list">
                    {detailContext.assignment ? (
                      <li>
                        <strong>Entrega</strong>
                        <span>Asignado el {formatDateTime(detailContext.assignment.assigned_at)}</span>
                        <span>{detailContext.assignment.expected_return_at ? `Retorno: ${formatDateOnly(detailContext.assignment.expected_return_at)}` : 'Sin retorno programado'}</span>
                      </li>
                    ) : null}
                    {detailContext.media ? (
                      <li>
                        <strong>Unidad física</strong>
                        <span>{detailContext.media.asset_unit?.asset_tag || detailContext.media.asset_unit_id}</span>
                        <span>{detailContext.media.asset_unit?.serial_number || 'Sin número de serie registrado'}</span>
                      </li>
                    ) : null}
                    {detailContext.enrollment ? (
                      <li>
                        <strong>{detailCurrentEnrollments.length > 0 ? 'Alta operativa' : 'Última alta'}</strong>
                        <span>{accessDetailCurrentSystemsText || detailContext.enrollment.access_system?.name || 'Sin sistema'}</span>
                        <span>
                          {detailContext.enrollment.activated_at
                            ? `Desde ${formatDateTime(detailContext.enrollment.activated_at)}`
                            : 'Sin fecha de activación'}
                        </span>
                      </li>
                    ) : null}
                    {detailContext.event ? (
                      <li>
                        <strong>Evento seleccionado</strong>
                        <span>{formatDateTime(detailContext.event.happened_at)}</span>
                        <span>{toAccessEventNote(detailContext.event.notes) || 'Sin observaciones adicionales'}</span>
                      </li>
                    ) : null}
                  </ul>
                </section>
              ) : null}
            </div>
          </section>

          <section
            id="access-detail-panel-enrollments"
            role="tabpanel"
            aria-labelledby="access-detail-tab-enrollments"
            hidden={activeAccessDetailTab !== 'enrollments'}
            className="ticket-detail__tab-panel panel-detail__tab-panel inventory-asset-detail__panel access-detail__panel"
          >
            <section className="ticket-detail__section panel-detail__section inventory-asset-detail__section access-detail__section">
              <div className="ticket-detail__section-headline panel-detail__section-headline inventory-asset-detail__section-headline">
                <h3 className="ticket-detail__section-title panel-detail__section-title inventory-asset-detail__section-title">Altas relacionadas</h3>
              </div>
              {detailContext.enrollments?.length ? (
                <ul className="access-detail__list inventory-asset-detail__list panel-detail__list">
                  {detailContext.enrollments.map((enrollment) => (
                    <li key={enrollment.id}>
                      <strong>{enrollment.access_system?.name || 'Sin sistema'}</strong>
                      <span>{enrollment.media?.tag_code || 'Sin medio ligado'}</span>
                      <div className="access-detail__list-inline">
                        <span className={getEnrollmentStatusToneClass(enrollment.status_key)}>{enrollment.status_name}</span>
                        {enrollment.status_key !== 'deactivated' && canUpdateAccess ? (
                          <button type="button" className="action-inline action-inline--secondary" onClick={() => openEnrollmentStatusModal(enrollment)}>
                            <Wrench size={14} aria-hidden="true" />
                            <span>Cambiar estado</span>
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="inventory-asset-detail__empty-copy access-detail__empty-copy">No hay altas relacionadas para este contexto.</p>
              )}
            </section>
          </section>

          <section
            id="access-detail-panel-history"
            role="tabpanel"
            aria-labelledby="access-detail-tab-history"
            hidden={activeAccessDetailTab !== 'history'}
            className="ticket-detail__tab-panel panel-detail__tab-panel inventory-asset-detail__panel access-detail__panel"
          >
            <section className="ticket-detail__section ticket-detail__section--activity panel-detail__section inventory-asset-detail__section access-detail__section">
              <div className="ticket-detail__section-headline panel-detail__section-headline inventory-asset-detail__section-headline">
                <h3 className="ticket-detail__section-title panel-detail__section-title inventory-asset-detail__section-title">Historial reciente</h3>
              </div>
              {detailContext.events?.length ? (
                <ul className="ticket-activity inventory-asset-detail__activity-list access-detail__activity-list" aria-label="Historial reciente de accesos">
                  {detailContext.events.map((eventRow) => (
                    <li key={eventRow.id} className="ticket-activity__item">
                      <span className="ticket-activity__dot" aria-hidden="true" />
                      <div>
                        <p className="ticket-activity__title">{toEventLabel(eventRow.event_type)}</p>
                        <p className="ticket-activity__meta">
                          <span className="inventory-asset-detail__activity-impact">{eventRow.access_system_name || eventRow.tag_code || eventRow.collaborator_name || 'Accesos'}</span>
                          <span className="ticket-activity__meta-separator"> · </span>
                          <span className="inventory-asset-detail__activity-when">{formatDateTime(eventRow.happened_at)}</span>
                        </p>
                        {toAccessEventNote(eventRow.notes) ? (
                          <p className="ticket-detail__comment-history-caption">{toAccessEventNote(eventRow.notes)}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="inventory-asset-detail__empty-copy access-detail__empty-copy">Aún no hay eventos relacionados que mostrar.</p>
              )}
            </section>
          </section>
        </div>
      </section>
    </div>
  ) : null;

  return (
    <section className="workspace-page access-page" aria-label="Área de trabajo de accesos">
      <header className="workspace-page__header">
        <div className="workspace-page__heading">
          <h1 className="workspace-page__title">Accesos</h1>
        </div>
        <div className="workspace-page__header-actions">
          {headerActions}
        </div>
      </header>

      <section className="workspace-page__surface workspace-page__surface--operational">
        <div className="workspace-page__toolbar workspace-page__toolbar--operational">
          <SegmentedControl
            label="Vista operativa de accesos"
            options={accessViewOptions}
            activeKey={activeView}
            onActivate={handleViewChange}
            className="workspace-segmented workspace-page__view-segmented"
            buttonClassName="workspace-segmented__button"
            activeButtonClassName="workspace-segmented__button--active"
            idPrefix="access-view"
            panelIdByKey={(key) => `access-panel-${key}`}
          />
        </div>

        {hasActionNotice ? <WorkspaceNoticeRail notices={workspaceNotices} /> : null}

        {screenError ? (
          <EmptyState title={accessLoadErrorTitle} copy={screenError} id="access-state-error" role="region">
            <button type="button" className="workspace-action workspace-action--primary" onClick={() => void loadCoreData()}>Reintentar</button>
          </EmptyState>
        ) : (
          <>
            <section id="access-panel-assignments" role="tabpanel" aria-labelledby="access-view-assignments" hidden={activeView !== 'assignments'} className="workspace-panel access-panel">
              <div className="workspace-page__control-row workspace-page__control-row--operational">
                <ToolbarSearchField
                  id="access-assignments-search"
                  name="access-assignments-search"
                  value={assignmentSearchTerm}
                  onChange={setAssignmentSearchTerm}
                  placeholder="Buscar por colaborador, tag o unidad..."
                  srLabel="Buscar asignaciones de acceso"
                  className="workspace-search--operational"
                />
                <div className="workspace-page__filters workspace-page__filters--operational">
                  <FilterChipGroup
                    label="Filtro por estado de asignación"
                    options={assignmentStatusOptions}
                    activeKey={assignmentStatusFilter}
                    onSelect={setAssignmentStatusFilter}
                    className="workspace-chip-group workspace-chip-group--compact"
                    chipClassName="workspace-chip"
                    activeChipClassName="workspace-chip--active"
                  />
                </div>
              </div>

              <WorkspaceSplitLayout
                viewKey="list"
                detailOpen={activeView === 'assignments' && detailOpen}
                detailId={ACCESS_DETAIL_ID}
                detailRole="complementary"
                detailAriaLabelledBy={ACCESS_DETAIL_TITLE_ID}
                className="access-layout"
                main={(
                  <div className="workspace-panel__viewport workspace-panel__viewport--flush workspace-panel__viewport--fixed">
                    <OperationalTablePanel
                      preserveShell
                      isLoading={screenLoading}
                      hasData={filteredAssignments.length > 0}
                      tone="primary"
                      className="access-panel__table"
                      ariaLabel="Listado de asignaciones de acceso"
                      scrollClassName="data-table__scroll workspace-scroll-wrap--fill"
                      loadingTitle={accessLoadingState.title}
                      loadingCopy={accessLoadingState.copy}
                      table={renderAssignmentTable()}
                      pagination={(
                        <PaginationBar
                          ariaLabel="Paginación de asignaciones de acceso"
                          start={assignmentPage.start + 1}
                          end={Math.min(assignmentPage.start + assignmentPageSize, filteredAssignments.length)}
                          total={filteredAssignments.length}
                          pageSize={assignmentPageSize}
                          pageSizeOptions={ACCESS_PAGE_SIZE_OPTIONS}
                          pageSizeId="access-assignments-page-size"
                          pageSizeName="access_assignments_page_size"
                          currentPage={assignmentPage.page}
                          totalPages={assignmentPage.totalPages}
                          onPageSizeChange={(nextSize) => {
                            setAssignmentPageSize(nextSize);
                            setAssignmentCurrentPage(1);
                          }}
                          onPrev={() => setAssignmentCurrentPage((page) => Math.max(1, page - 1))}
                          onNext={() => setAssignmentCurrentPage((page) => Math.min(assignmentPage.totalPages, page + 1))}
                        />
                      )}
                      emptyTitle={accessAssignmentsNoRecordsState.title}
                      emptyCopy={accessAssignmentsNoRecordsState.copy}
                      emptyActions={canGrantAccess ? (
                        <button
                          type="button"
                          className="workspace-action workspace-action--primary"
                          onClick={(event) => openGrantAccessModal({ triggerElement: event.currentTarget })}
                        >
                          <Plus size={14} aria-hidden="true" />
                          <span>Dar acceso</span>
                        </button>
                      ) : null}
                    />
                  </div>
                )}
                detail={accessDetailPanel}
              />
            </section>

            <section id="access-panel-media" role="tabpanel" aria-labelledby="access-view-media" hidden={activeView !== 'media'} className="workspace-panel access-panel">
              <div className="workspace-page__control-row workspace-page__control-row--operational">
                <ToolbarSearchField
                  id="access-media-search"
                  name="access-media-search"
                  value={mediaSearchTerm}
                  onChange={setMediaSearchTerm}
                  placeholder="Buscar por tag, tipo, unidad o colaborador..."
                  srLabel="Buscar medios de acceso"
                  className="workspace-search--operational"
                />
                <div className="workspace-page__filters workspace-page__filters--operational">
                  <FilterSelect
                    id="access-media-status-filter"
                    name="access_media_status_filter"
                    label="Estado"
                    showLabel={false}
                    value={mediaStatusFilter}
                    options={mediaStatusFilterOptions}
                    onChange={setMediaStatusFilter}
                    className="filter-select filter-select--operational"
                  />
                  <FilterSelect
                    id="access-media-type-filter"
                    name="access_media_type_filter"
                    label="Tipo"
                    showLabel={false}
                    value={mediumTypeFilter}
                    options={mediumTypeFilterOptions}
                    onChange={setMediumTypeFilter}
                    className="filter-select filter-select--operational"
                  />
                </div>
                <div className="workspace-page__actions">
                </div>
              </div>

              <WorkspaceSplitLayout
                viewKey="list"
                detailOpen={activeView === 'media' && detailOpen}
                detailId={ACCESS_DETAIL_ID}
                detailRole="complementary"
                detailAriaLabelledBy={ACCESS_DETAIL_TITLE_ID}
                className="access-layout"
                main={(
                  <div className="workspace-panel__viewport workspace-panel__viewport--flush workspace-panel__viewport--fixed">
                    <OperationalTablePanel
                      preserveShell
                      isLoading={screenLoading}
                      hasData={filteredMedia.length > 0}
                      tone="info"
                      className="access-panel__table"
                      ariaLabel="Listado de medios de acceso"
                      scrollClassName="data-table__scroll workspace-scroll-wrap--fill"
                      loadingTitle={accessLoadingState.title}
                      loadingCopy={accessLoadingState.copy}
                      table={renderMediaTable()}
                      pagination={(
                        <PaginationBar
                          ariaLabel="Paginación de medios de acceso"
                          start={mediaPage.start + 1}
                          end={Math.min(mediaPage.start + mediaPageSize, filteredMedia.length)}
                          total={filteredMedia.length}
                          pageSize={mediaPageSize}
                          pageSizeOptions={ACCESS_PAGE_SIZE_OPTIONS}
                          pageSizeId="access-media-page-size"
                          pageSizeName="access_media_page_size"
                          currentPage={mediaPage.page}
                          totalPages={mediaPage.totalPages}
                          onPageSizeChange={(nextSize) => {
                            setMediaPageSize(nextSize);
                            setMediaCurrentPage(1);
                          }}
                          onPrev={() => setMediaCurrentPage((page) => Math.max(1, page - 1))}
                          onNext={() => setMediaCurrentPage((page) => Math.min(mediaPage.totalPages, page + 1))}
                        />
                      )}
                      emptyTitle={accessMediaNoRecordsState.title}
                      emptyCopy={accessMediaNoRecordsState.copy}
                      emptyActions={null}
                    />
                  </div>
                )}
                detail={accessDetailPanel}
              />
            </section>

            <section id="access-panel-enrollments" role="tabpanel" aria-labelledby="access-view-enrollments" hidden={activeView !== 'enrollments'} className="workspace-panel access-panel">
              <div className="workspace-page__control-row workspace-page__control-row--operational">
                <ToolbarSearchField
                  id="access-enrollments-search"
                  name="access-enrollments-search"
                  value={enrollmentSearchTerm}
                  onChange={setEnrollmentSearchTerm}
                  placeholder="Buscar por colaborador, sistema o RFID..."
                  srLabel="Buscar colaboradores con acceso"
                  className="workspace-search--operational"
                />
                <div className="workspace-page__filters workspace-page__filters--operational">
                  <FilterChipGroup
                    label="Filtro por estado operativo"
                    options={enrollmentStatusOptions}
                    activeKey={enrollmentStatusFilter}
                    onSelect={setEnrollmentStatusFilter}
                    className="workspace-chip-group workspace-chip-group--compact"
                    chipClassName="workspace-chip"
                    activeChipClassName="workspace-chip--active"
                  />
                  <FilterSelect
                    id="access-enrollment-system-filter"
                    name="access_enrollment_system_filter"
                    label="Sistema"
                    showLabel={false}
                    value={enrollmentSystemFilter}
                    options={systemFilterOptions}
                    onChange={setEnrollmentSystemFilter}
                    className="filter-select filter-select--operational"
                  />
                </div>
              </div>

              <WorkspaceSplitLayout
                viewKey="list"
                detailOpen={activeView === 'enrollments' && detailOpen}
                detailId={ACCESS_DETAIL_ID}
                detailRole="complementary"
                detailAriaLabelledBy={ACCESS_DETAIL_TITLE_ID}
                className="access-layout"
                main={(
                  <div className="workspace-panel__viewport workspace-panel__viewport--flush workspace-panel__viewport--fixed">
                    <OperationalTablePanel
                      preserveShell
                      isLoading={screenLoading}
                      hasData={filteredEnrollmentRows.length > 0}
                      tone="neutral"
                      className="access-panel__table"
                      ariaLabel="Listado de colaboradores con acceso"
                      scrollClassName="data-table__scroll workspace-scroll-wrap--fill"
                      loadingTitle={accessLoadingState.title}
                      loadingCopy={accessLoadingState.copy}
                      table={renderEnrollmentTable()}
                      pagination={(
                        <PaginationBar
                          ariaLabel="Paginación de colaboradores con acceso"
                          start={enrollmentPage.start + 1}
                          end={Math.min(enrollmentPage.start + enrollmentPageSize, filteredEnrollmentRows.length)}
                          total={filteredEnrollmentRows.length}
                          pageSize={enrollmentPageSize}
                          pageSizeOptions={ACCESS_PAGE_SIZE_OPTIONS}
                          pageSizeId="access-enrollments-page-size"
                          pageSizeName="access_enrollments_page_size"
                          currentPage={enrollmentPage.page}
                          totalPages={enrollmentPage.totalPages}
                          onPageSizeChange={(nextSize) => {
                            setEnrollmentPageSize(nextSize);
                            setEnrollmentCurrentPage(1);
                          }}
                          onPrev={() => setEnrollmentCurrentPage((page) => Math.max(1, page - 1))}
                          onNext={() => setEnrollmentCurrentPage((page) => Math.min(enrollmentPage.totalPages, page + 1))}
                        />
                      )}
                      emptyTitle={accessEnrollmentsNoRecordsState.title}
                      emptyCopy={accessEnrollmentsNoRecordsState.copy}
                      emptyActions={canGrantAccess ? (
                        <button type="button" className="workspace-action workspace-action--primary" onClick={(event) => openGrantAccessModal({ triggerElement: event.currentTarget })}>
                          <Plus size={14} aria-hidden="true" />
                          <span>Dar acceso</span>
                        </button>
                      ) : null}
                    />
                  </div>
                )}
                detail={accessDetailPanel}
              />
            </section>

            <section id="access-panel-history" role="tabpanel" aria-labelledby="access-view-history" hidden={activeView !== 'history'} className="workspace-panel access-panel">
              <div className="workspace-page__control-row workspace-page__control-row--operational">
                <ToolbarSearchField
                  id="access-events-search"
                  name="access-events-search"
                  value={eventSearchTerm}
                  onChange={setEventSearchTerm}
                  placeholder="Buscar por evento, colaborador, sistema o tag..."
                  srLabel="Buscar historial de accesos"
                  className="workspace-search--operational"
                />
              </div>

              <WorkspaceSplitLayout
                viewKey="list"
                detailOpen={activeView === 'history' && detailOpen}
                detailId={ACCESS_DETAIL_ID}
                detailRole="complementary"
                detailAriaLabelledBy={ACCESS_DETAIL_TITLE_ID}
                className="access-layout"
                main={(
                  <div className="workspace-panel__viewport workspace-panel__viewport--flush workspace-panel__viewport--fixed">
                    <OperationalTablePanel
                      preserveShell
                      isLoading={screenLoading}
                      hasData={filteredEvents.length > 0}
                      tone="warning"
                      className="access-panel__table"
                      ariaLabel="Historial de eventos de acceso"
                      scrollClassName="data-table__scroll workspace-scroll-wrap--fill"
                      loadingTitle={accessLoadingState.title}
                      loadingCopy={accessLoadingState.copy}
                      table={renderEventTable()}
                      pagination={(
                        <PaginationBar
                          ariaLabel="Paginación de eventos de acceso"
                          start={eventPage.start + 1}
                          end={Math.min(eventPage.start + eventPageSize, filteredEvents.length)}
                          total={filteredEvents.length}
                          pageSize={eventPageSize}
                          pageSizeOptions={ACCESS_PAGE_SIZE_OPTIONS}
                          pageSizeId="access-events-page-size"
                          pageSizeName="access_events_page_size"
                          currentPage={eventPage.page}
                          totalPages={eventPage.totalPages}
                          onPageSizeChange={(nextSize) => {
                            setEventPageSize(nextSize);
                            setEventCurrentPage(1);
                          }}
                          onPrev={() => setEventCurrentPage((page) => Math.max(1, page - 1))}
                          onNext={() => setEventCurrentPage((page) => Math.min(eventPage.totalPages, page + 1))}
                        />
                      )}
                      emptyTitle={accessEventsNoRecordsState.title}
                      emptyCopy={accessEventsNoRecordsState.copy}
                    />
                  </div>
                )}
                detail={accessDetailPanel}
              />
            </section>
          </>
        )}
      </section>

      {/* Modals intentionally follow the existing modal system for consistency. */}
      <ModalDialog open={isCreateMediaOpen} title="Registrar RFID" onClose={closeCreateMediaModal} returnFocusRef={createMediaReturnFocusRef} size="narrow">
        <form className="modal-dialog__form access-modal access-modal--compact" onSubmit={(event) => void handleCreateMediaSubmit(event)}>
          <section className="access-modal__panel">
            {catalog.medium_types.length > 1 ? (
              <div className="modal-dialog__field modal-dialog__field--full">
                <span>Formato</span>
                <FilterChipGroup
                  label="Formato del medio"
                  options={catalog.medium_types.map((mediumType) => ({ key: mediumType.type_key, label: mediumType.name }))}
                  activeKey={createMediaForm.medium_type_key}
                  onSelect={(value) => setCreateMediaForm((current) => ({ ...current, medium_type_key: value }))}
                  className="workspace-chip-group workspace-chip-group--compact access-modal__type-group"
                  chipClassName="workspace-chip"
                  activeChipClassName="workspace-chip--active"
                />
              </div>
            ) : null}

            <div className="modal-dialog__grid access-modal__compact-grid access-modal__compact-grid--single">
              <label className="modal-dialog__field">
                <span>Unidad de inventario</span>
                <FilterSelect
                  id="access-create-media-unit"
                  name="access_create_media_unit"
                  label="Unidad RFID"
                  variant="field"
                  showLabel={false}
                  value={createMediaForm.asset_unit_id}
                  options={registerableUnitOptions}
                  onChange={(value) => setCreateMediaForm((current) => {
                    const selectedUnit = inventoryUnitById.get(Number(value || 0));
                    const nextTagCode = normalizeFieldValue(current.tag_code) ? current.tag_code : (selectedUnit?.asset_tag || '');
                    return {
                      ...current,
                      asset_unit_id: value,
                      tag_code: nextTagCode
                    };
                  })}
                  placeholder="Selecciona una unidad"
                  disabled={isLoadingUnits}
                  ariaDescribedBy={getFieldDescribedBy('access-create-media-unit')}
                  invalid={Boolean(getFieldError('access-create-media-unit'))}
                />
                {renderFieldError('access-create-media-unit')}
                <p className="modal-dialog__field-help">Solo aparecen unidades RFID disponibles que aún no se usan en Accesos.</p>
              </label>

              <label className="modal-dialog__field" htmlFor="access-create-media-tag">
                <span>Tag o código</span>
                <input
                  id="access-create-media-tag"
                  name="access_create_media_tag"
                  type="text"
                  value={createMediaForm.tag_code}
                  onChange={(event) => setCreateMediaForm((current) => ({ ...current, tag_code: event.target.value.toUpperCase() }))}
                  placeholder="Ej. 5373445"
                  aria-invalid={getFieldError('access-create-media-tag') ? 'true' : undefined}
                  aria-describedby={getFieldDescribedBy('access-create-media-tag')}
                />
                {renderFieldError('access-create-media-tag')}
              </label>

              <label className="modal-dialog__field modal-dialog__field--full" htmlFor="access-create-media-notes">
                <span>Notas</span>
                <textarea
                  id="access-create-media-notes"
                  name="access_create_media_notes"
                  value={createMediaForm.notes}
                  onChange={(event) => setCreateMediaForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Contexto opcional"
                />
              </label>
            </div>
          </section>
          {renderModalNoticeSlot(true)}
          <div className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={closeCreateMediaModal}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Registrar RFID'}</button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog
        open={isGrantAccessOpen}
        title={isGrantMigrationFlow ? 'Migrar acceso' : 'Dar acceso'}
        onClose={closeAllModals}
        returnFocusRef={grantAccessReturnFocusRef}
        size="wide"
      >
        <form className="modal-dialog__form access-flow" onSubmit={(event) => void handleGrantAccessSubmit(event)}>
          <div className="access-flow__main">
            <section className="access-flow__card">
              <div className="access-flow__card-head">
                <h3 className="access-flow__title">Colaborador</h3>
                <div className="access-flow__section-meta" aria-live="polite">
                  {isGrantCollaboratorLocked ? (
                    <p className="access-flow__meta-copy">Esta operación se aplicará solo a este colaborador.</p>
                  ) : isGrantExistingCollaborator ? (
                    <p className="access-flow__meta-copy">Selecciona al colaborador y luego define el acceso que vas a habilitar.</p>
                  ) : (
                    <>
                      {suggestedEmployeeId ? <span className="access-flow__meta-chip">ID sugerido {suggestedEmployeeId}</span> : null}
                      <p className="access-flow__meta-copy">Usa alta rápida solo cuando el colaborador aún no exista en el sistema.</p>
                    </>
                  )}
                </div>
              </div>

              {isGrantCollaboratorLocked && selectedGrantCollaborator ? (
                <div className="access-flow__summary">
                  <span className="access-flow__summary-kicker">Colaborador fijo</span>
                  <p className="access-flow__summary-headline">{selectedGrantCollaborator.full_name || 'Sin nombre'}</p>
                  <dl className="access-flow__summary-list">
                    <div>
                      <dt>ID operativo</dt>
                      <dd>{selectedGrantCollaborator.employee_id || 'Sin ID'}</dd>
                    </div>
                    <div>
                      <dt>Área</dt>
                      <dd>{selectedGrantCollaborator.area_name || 'Sin área registrada'}</dd>
                    </div>
                    <div>
                      <dt>Acceso actual</dt>
                      <dd>{grantActiveSystemsText || 'Sin accesos vigentes'}</dd>
                    </div>
                  </dl>
                  {isGrantMigrationFlow ? (
                    <p className="access-flow__summary-note">
                      Se activará {grantSelectedSystemsText || 'el acceso operativo'} y se {grantAutoCloseOptions.length > 1 ? 'cerrarán' : 'cerrará'} {grantAutoCloseSystemsText}.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="access-flow__inline-panel access-flow__inline-panel--compact access-flow__inline-panel--bare">
                  <div className="access-flow__inline-actions">
                    <button type="button" className="action-inline action-inline--secondary" onClick={toggleGrantCollaboratorMode}>
                      <UserPlus size={14} aria-hidden="true" />
                      <span>{isGrantExistingCollaborator ? 'Nuevo colaborador' : 'Usar colaborador existente'}</span>
                    </button>
                  </div>

                  {isGrantExistingCollaborator ? (
                    <div className="access-flow__inline-panel access-flow__inline-panel--compact access-flow__inline-panel--bare">
                      <FilterSelect
                        id="access-grant-collaborator"
                        name="access_grant_collaborator"
                        label="Colaborador"
                        variant="field"
                        showLabel={false}
                        value={grantAccessForm.collaborator_id}
                        options={collaboratorOptions}
                        onChange={(value) => setGrantAccessForm((current) => ({
                          ...current,
                          collaborator_id: value,
                          deactivate_enrollment_ids: []
                        }))}
                        placeholder="Selecciona un colaborador"
                        ariaDescribedBy={getFieldDescribedBy('access-grant-collaborator')}
                        invalid={Boolean(getFieldError('access-grant-collaborator'))}
                      />
                      {renderFieldError('access-grant-collaborator')}
                    </div>
                  ) : (
                    <div className="modal-dialog__grid">
                      <div className="modal-dialog__field">
                        <label className="modal-dialog__field-label" htmlFor="access-grant-collaborator-employee-id">ID operativo</label>
                        <input
                          id="access-grant-collaborator-employee-id"
                          name="access_grant_collaborator_employee_id"
                          type="text"
                          inputMode="numeric"
                          value={grantAccessForm.collaborator_create.employee_id}
                          onChange={(event) => setGrantAccessForm((current) => ({
                            ...current,
                            collaborator_create: {
                              ...current.collaborator_create,
                              employee_id: event.target.value
                            }
                          }))}
                          placeholder={suggestedEmployeeId ? `Ej. ${suggestedEmployeeId}` : 'Ej. 36'}
                          aria-invalid={getFieldError('access-grant-collaborator-employee-id') ? 'true' : undefined}
                          aria-describedby={getFieldDescribedBy('access-grant-collaborator-employee-id')}
                        />
                        {renderFieldSupport('access-grant-collaborator-employee-id')}
                      </div>
                      <div className="modal-dialog__field">
                        <label className="modal-dialog__field-label" htmlFor="access-grant-collaborator-area-name">Área</label>
                        <input
                          id="access-grant-collaborator-area-name"
                          name="access_grant_collaborator_area_name"
                          type="text"
                          value={grantAccessForm.collaborator_create.area_name}
                          onChange={(event) => setGrantAccessForm((current) => ({
                            ...current,
                            collaborator_create: {
                              ...current.collaborator_create,
                              area_name: event.target.value
                            }
                          }))}
                          placeholder="Ej. Producción"
                        />
                        {renderFieldSupport()}
                      </div>
                      <div className="modal-dialog__field">
                        <label className="modal-dialog__field-label" htmlFor="access-grant-collaborator-first-name">Nombre(s)</label>
                        <input
                          id="access-grant-collaborator-first-name"
                          name="access_grant_collaborator_first_name"
                          type="text"
                          value={grantAccessForm.collaborator_create.first_name}
                          onChange={(event) => setGrantAccessForm((current) => ({
                            ...current,
                            collaborator_create: {
                              ...current.collaborator_create,
                              first_name: event.target.value
                            }
                          }))}
                          placeholder="Ej. Laura"
                          aria-invalid={getFieldError('access-grant-collaborator-first-name') ? 'true' : undefined}
                          aria-describedby={getFieldDescribedBy('access-grant-collaborator-first-name')}
                        />
                        {renderFieldSupport('access-grant-collaborator-first-name')}
                      </div>
                      <div className="modal-dialog__field">
                        <label className="modal-dialog__field-label" htmlFor="access-grant-collaborator-last-name">Apellidos</label>
                        <input
                          id="access-grant-collaborator-last-name"
                          name="access_grant_collaborator_last_name"
                          type="text"
                          value={grantAccessForm.collaborator_create.last_name}
                          onChange={(event) => setGrantAccessForm((current) => ({
                            ...current,
                            collaborator_create: {
                              ...current.collaborator_create,
                              last_name: event.target.value
                            }
                          }))}
                          placeholder="Ej. Santiago"
                          aria-invalid={getFieldError('access-grant-collaborator-last-name') ? 'true' : undefined}
                          aria-describedby={getFieldDescribedBy('access-grant-collaborator-last-name')}
                        />
                        {renderFieldSupport('access-grant-collaborator-last-name')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="access-flow__card">
              <div className="access-flow__card-head">
                <h3 className="access-flow__title">Sistemas</h3>
              </div>

              {isGrantMigrationFlow ? (
                <div className="access-flow__summary">
                  <span className="access-flow__summary-kicker">Cambio aplicado</span>
                  <p className="access-flow__summary-headline">{grantSelectedSystemLabels.length ? grantSelectedSystemsText : 'Acceso operativo'}</p>
                  <dl className="access-flow__summary-list">
                    <div>
                      <dt>Se activarán</dt>
                      <dd>{grantSelectedSystemsText || 'Sin sistemas seleccionados'}</dd>
                    </div>
                    <div>
                      <dt>Se cerrará</dt>
                      <dd>{grantAutoCloseSystemsText || 'Sin cierres automáticos'}</dd>
                    </div>
                    <div>
                      <dt>RFID requerido</dt>
                      <dd>Sí</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <>
                  <div id="access-grant-systems" className="access-flow__system-grid" role="group" tabIndex={-1} aria-describedby={getFieldDescribedBy('access-grant-systems')}>
                    {grantSystemOptions.map((system) => {
                      const isSelected = grantAccessForm.systems.includes(system.key);
                      const isAlreadyActive = activeSystemKeysForGrantCollaborator.includes(system.key);
                      const willCloseOnConfirm = grantAutoCloseOptions.some((enrollment) => enrollment.access_system?.system_key === system.key);
                      const systemState = willCloseOnConfirm
                        ? 'closing'
                        : isAlreadyActive
                          ? 'active'
                          : isSelected
                            ? 'selected'
                            : '';
                      const systemStateLabel = systemState === 'closing'
                        ? 'Se cerrará'
                        : systemState === 'active'
                          ? 'Vigente'
                          : systemState === 'selected'
                            ? 'Se activará'
                            : '';
                      const SystemIcon = system.icon;

                      return (
                        <button
                          key={system.key}
                          type="button"
                          className={`access-flow__system-card${isSelected ? ' access-flow__system-card--selected' : ''}${isAlreadyActive ? ' access-flow__system-card--active' : ''}`}
                          aria-pressed={isSelected}
                          disabled={isAlreadyActive}
                          onClick={() => toggleGrantSystem(system.key)}
                        >
                          <span className="access-flow__system-icon" aria-hidden="true">
                            <SystemIcon size={16} />
                          </span>
                          {systemStateLabel ? (
                            <span className={`access-flow__system-state access-flow__system-state--${systemState}`}>
                              {systemStateLabel}
                            </span>
                          ) : null}
                          <span className="access-flow__system-label">{system.label}</span>
                          <small className="access-flow__system-helper">
                            {willCloseOnConfirm ? 'Se cerrará al confirmar' : isAlreadyActive ? 'Ya activo' : system.helper}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                  <div className="access-flow__feedback-slot">
                    {renderFieldSupport('access-grant-systems')}
                  </div>
                  {grantHasOfficeOnlySelection ? (
                    <div className="access-flow__system-tools">
                      <button
                        type="button"
                        className="action-inline action-inline--secondary"
                        onClick={() => setGrantAccessForm((current) => ({
                          ...current,
                          requires_rfid_override: !current.requires_rfid_override,
                          asset_unit_id: current.requires_rfid_override ? '' : current.asset_unit_id
                        }))}
                      >
                        <span>{grantAccessForm.requires_rfid_override ? 'Quitar RFID' : 'Agregar RFID'}</span>
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </section>

            {grantRequiresRfid ? (
              <section className="access-flow__card">
                <div className="access-flow__card-head">
                  <h3 className="access-flow__title">{grantHasOfficeOnlySelection ? 'RFID opcional' : 'RFID'}</h3>
                </div>

                <div className="modal-dialog__grid">
                  {grantHasReusableActiveAssignment ? (
                    <div className="modal-dialog__field modal-dialog__field--full">
                      <span>RFID activo</span>
                      <p className="access-flow__field-note">
                        Se usará el RFID activo de este colaborador: {grantReusableMediaLabel || 'sin detalle disponible'}.
                      </p>
                    </div>
                  ) : (
                    <label className="modal-dialog__field modal-dialog__field--full">
                      <span>Unidad RFID</span>
                      <FilterSelect
                        id="access-grant-media"
                        name="access_grant_media"
                        label="Unidad RFID"
                        variant="field"
                        showLabel={false}
                        value={grantAccessForm.asset_unit_id}
                        options={grantInventoryUnitOptions}
                        onChange={(value) => setGrantAccessForm((current) => ({ ...current, asset_unit_id: value }))}
                        placeholder="Selecciona un RFID"
                        ariaDescribedBy={getFieldDescribedBy('access-grant-media')}
                        invalid={Boolean(getFieldError('access-grant-media'))}
                      />
                      {renderFieldError('access-grant-media')}
                      {!hasGrantMediaOptions ? (
                        <p className="access-flow__field-note">No hay RFID disponible para esta entrega.</p>
                      ) : grantHasOfficeOnlySelection ? (
                        <p className="access-flow__field-note">Oficinas puede operar sin medio, pero aquí puedes dejar preparado el RFID para una migración futura.</p>
                      ) : null}
                    </label>
                  )}
                </div>
              </section>
            ) : null}

            <section className="access-flow__card access-flow__card--compact">
              <div className="modal-dialog__grid access-modal__compact-grid">
                <label className="modal-dialog__field" htmlFor="access-grant-assigned-at">
                  <span>Entrega</span>
                  <input
                    id="access-grant-assigned-at"
                    name="access_grant_assigned_at"
                    type="datetime-local"
                    value={grantAccessForm.assigned_at}
                    onChange={(event) => setGrantAccessForm((current) => ({ ...current, assigned_at: event.target.value }))}
                    aria-invalid={getFieldError('access-grant-assigned-at') ? 'true' : undefined}
                    aria-describedby={getFieldDescribedBy('access-grant-assigned-at')}
                  />
                  {renderFieldError('access-grant-assigned-at')}
                </label>

                <div className="modal-dialog__field access-modal__optional-field">
                  <button
                    type="button"
                    className="action-inline action-inline--secondary"
                    onClick={() => setIsGrantNotesOpen((current) => !current)}
                    aria-label={isGrantNotesOpen ? 'Ocultar nota de entrega' : 'Agregar nota de entrega'}
                  >
                    <span>{isGrantNotesOpen ? 'Ocultar' : 'Agregar nota'}</span>
                  </button>
                </div>

                {isGrantNotesOpen ? (
                  <label className="modal-dialog__field modal-dialog__field--full" htmlFor="access-grant-notes">
                    <span className="sr-only">Notas</span>
                    <textarea
                      id="access-grant-notes"
                      name="access_grant_notes"
                      value={grantAccessForm.notes}
                      onChange={(event) => setGrantAccessForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Contexto opcional"
                      rows={3}
                    />
                  </label>
                ) : null}
              </div>
            </section>
          </div>

          {renderModalNoticeSlot(true)}
          <div className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={closeAllModals}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmitting}>
              {isSubmitting
                ? isGrantMigrationFlow ? 'Aplicando...' : 'Otorgando...'
                : isGrantMigrationFlow ? 'Aplicar migración' : 'Dar acceso'}
            </button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog open={isCreateEnrollmentOpen} title="Alta avanzada" onClose={closeAllModals} returnFocusRef={createEnrollmentReturnFocusRef} size="narrow">
        <form className="modal-dialog__form access-modal access-modal--compact" onSubmit={(event) => void handleCreateEnrollmentSubmit(event)}>
          <section className="access-modal__panel">
            <div className="access-modal__stack">
              <div className="modal-dialog__field">
                <div className="access-modal__field-headline">
                  <span className="modal-dialog__field-label">Colaborador</span>
                  {canCreateCollaborators ? (
                    <button type="button" className="action-inline action-inline--secondary" onClick={toggleEnrollmentCollaboratorInline}>
                      <UserPlus size={14} aria-hidden="true" />
                      <span>{isEnrollmentCollaboratorInlineOpen ? 'Usar existente' : 'Nuevo colaborador'}</span>
                    </button>
                  ) : null}
                </div>

                {isEnrollmentCollaboratorInlineOpen ? (
                  <section className="access-flow__inline-panel access-flow__inline-panel--compact access-flow__inline-panel--bare" onKeyDown={handleEnrollmentCollaboratorInlineKeyDown}>
                    <div className="access-flow__section-meta access-flow__section-meta--inline" aria-live="polite">
                      {suggestedEmployeeId ? <span className="access-flow__meta-chip">ID sugerido {suggestedEmployeeId}</span> : null}
                      <p className="access-flow__meta-copy">{employeeIdAvailabilityLabel}</p>
                    </div>
                    <div className="modal-dialog__grid">
                      <div className="modal-dialog__field">
                        <label className="modal-dialog__field-label" htmlFor="access-create-collaborator-employee-id">ID operativo</label>
                        <input
                          id="access-create-collaborator-employee-id"
                          name="access_create_collaborator_employee_id"
                          type="text"
                          inputMode="numeric"
                          value={createCollaboratorForm.employee_id}
                          onChange={(event) => setCreateCollaboratorForm((current) => ({ ...current, employee_id: event.target.value }))}
                          placeholder={suggestedEmployeeId ? `Ej. ${suggestedEmployeeId}` : 'Ej. 36'}
                          aria-invalid={getFieldError('access-create-collaborator-employee-id') ? 'true' : undefined}
                          aria-describedby={getFieldDescribedBy('access-create-collaborator-employee-id')}
                        />
                        {renderFieldSupport('access-create-collaborator-employee-id')}
                      </div>
                      <div className="modal-dialog__field">
                        <label className="modal-dialog__field-label" htmlFor="access-create-collaborator-area-name">Área</label>
                        <input
                          id="access-create-collaborator-area-name"
                          name="access_create_collaborator_area_name"
                          type="text"
                          value={createCollaboratorForm.area_name}
                          onChange={(event) => setCreateCollaboratorForm((current) => ({ ...current, area_name: event.target.value }))}
                          placeholder="Ej. Producción"
                        />
                        {renderFieldSupport()}
                      </div>
                      <div className="modal-dialog__field">
                        <label className="modal-dialog__field-label" htmlFor="access-create-collaborator-first-name">Nombre(s)</label>
                        <input
                          id="access-create-collaborator-first-name"
                          name="access_create_collaborator_first_name"
                          type="text"
                          value={createCollaboratorForm.first_name}
                          onChange={(event) => setCreateCollaboratorForm((current) => ({ ...current, first_name: event.target.value }))}
                          placeholder="Ej. Laura"
                          aria-invalid={getFieldError('access-create-collaborator-first-name') ? 'true' : undefined}
                          aria-describedby={getFieldDescribedBy('access-create-collaborator-first-name')}
                        />
                        {renderFieldSupport('access-create-collaborator-first-name')}
                      </div>
                      <div className="modal-dialog__field">
                        <label className="modal-dialog__field-label" htmlFor="access-create-collaborator-last-name">Apellidos</label>
                        <input
                          id="access-create-collaborator-last-name"
                          name="access_create_collaborator_last_name"
                          type="text"
                          value={createCollaboratorForm.last_name}
                          onChange={(event) => setCreateCollaboratorForm((current) => ({ ...current, last_name: event.target.value }))}
                          placeholder="Ej. Santiago"
                          aria-invalid={getFieldError('access-create-collaborator-last-name') ? 'true' : undefined}
                          aria-describedby={getFieldDescribedBy('access-create-collaborator-last-name')}
                        />
                        {renderFieldSupport('access-create-collaborator-last-name')}
                      </div>
                    </div>
                    <div className="access-flow__inline-actions">
                      <button type="button" className="workspace-action workspace-action--ghost" onClick={() => void submitCreateCollaborator()} disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : 'Crear colaborador'}
                      </button>
                    </div>
                  </section>
                ) : (
                  <>
                    <FilterSelect
                      id="access-create-enrollment-collaborator"
                      name="access_create_enrollment_collaborator"
                      label="Colaborador"
                      variant="field"
                      showLabel={false}
                      value={createEnrollmentForm.collaborator_id}
                      options={collaboratorOptions}
                      onChange={(value) => setCreateEnrollmentForm((current) => ({ ...current, collaborator_id: value, media_assignment_id: '' }))}
                      placeholder="Selecciona un colaborador"
                      ariaDescribedBy={getFieldDescribedBy('access-create-enrollment-collaborator')}
                      invalid={Boolean(getFieldError('access-create-enrollment-collaborator'))}
                    />
                    {renderFieldError('access-create-enrollment-collaborator')}
                  </>
                )}
              </div>

              <div className="modal-dialog__grid access-modal__compact-grid">
                <label className="modal-dialog__field">
                  <span>Sistema</span>
                  <FilterSelect
                    id="access-create-enrollment-system"
                    name="access_create_enrollment_system"
                    label="Sistema"
                    variant="field"
                    showLabel={false}
                    value={createEnrollmentForm.access_system_id}
                    options={enrollmentSystemOptions}
                    onChange={(value) => setCreateEnrollmentForm((current) => ({
                      ...current,
                      access_system_id: value,
                      media_assignment_id: value === current.access_system_id ? current.media_assignment_id : ''
                    }))}
                    placeholder="Selecciona un sistema"
                    ariaDescribedBy={getFieldDescribedBy('access-create-enrollment-system')}
                    invalid={Boolean(getFieldError('access-create-enrollment-system'))}
                  />
                  {renderFieldError('access-create-enrollment-system')}
                </label>
                {enrollmentRequiresRfid ? (
                  <label className="modal-dialog__field">
                    <span>RFID</span>
                    <FilterSelect
                      id="access-create-enrollment-assignment"
                      name="access_create_enrollment_assignment"
                      label="RFID ligado"
                      variant="field"
                      showLabel={false}
                      value={createEnrollmentForm.media_assignment_id}
                      options={activeAssignmentOptionsByCollaborator}
                      onChange={(value) => setCreateEnrollmentForm((current) => ({ ...current, media_assignment_id: value }))}
                      placeholder={createEnrollmentForm.collaborator_id ? 'Selecciona un RFID activo' : 'Selecciona colaborador primero'}
                      disabled={!createEnrollmentForm.collaborator_id}
                      ariaDescribedBy={getFieldDescribedBy('access-create-enrollment-assignment')}
                      invalid={Boolean(getFieldError('access-create-enrollment-assignment'))}
                    />
                    {renderFieldError('access-create-enrollment-assignment')}
                    {createEnrollmentForm.collaborator_id && activeAssignmentOptionsByCollaborator.length <= 1 ? (
                      <p className="modal-dialog__field-help">Este sistema requiere un RFID ya asignado al colaborador.</p>
                    ) : null}
                  </label>
                ) : null}
                <label className="modal-dialog__field" htmlFor="access-create-enrollment-activated-at">
                  <span>Activación</span>
                  <input
                    id="access-create-enrollment-activated-at"
                    name="access_create_enrollment_activated_at"
                    type="datetime-local"
                    value={createEnrollmentForm.activated_at}
                    onChange={(event) => setCreateEnrollmentForm((current) => ({ ...current, activated_at: event.target.value }))}
                    aria-invalid={getFieldError('access-create-enrollment-activated-at') ? 'true' : undefined}
                    aria-describedby={getFieldDescribedBy('access-create-enrollment-activated-at')}
                  />
                  {renderFieldError('access-create-enrollment-activated-at')}
                </label>
                <div className="modal-dialog__field access-modal__optional-field">
                  <button
                    type="button"
                    className="action-inline action-inline--secondary"
                    onClick={() => setIsEnrollmentNotesOpen((current) => !current)}
                    aria-label={isEnrollmentNotesOpen ? 'Ocultar nota' : 'Agregar nota'}
                  >
                      <span>{isEnrollmentNotesOpen ? 'Ocultar' : 'Agregar nota'}</span>
                  </button>
                </div>
                {isEnrollmentNotesOpen ? (
                  <label className="modal-dialog__field modal-dialog__field--full" htmlFor="access-create-enrollment-notes">
                    <span className="sr-only">Notas</span>
                    <textarea
                      id="access-create-enrollment-notes"
                      name="access_create_enrollment_notes"
                      value={createEnrollmentForm.notes}
                      onChange={(event) => setCreateEnrollmentForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Contexto opcional"
                      rows={3}
                    />
                  </label>
                ) : null}
              </div>
            </div>
          </section>
          {renderModalNoticeSlot(true)}
          <div className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={closeAllModals}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmitting}>{isSubmitting ? 'Registrando...' : 'Guardar alta'}</button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog open={isReturnModalOpen} title="Registrar devolución" onClose={closeAllModals} size="narrow">
        <form className="modal-dialog__form access-modal access-modal--compact" onSubmit={(event) => void handleReturnSubmit(event)}>
          <section className="access-modal__panel">
            <div className="modal-dialog__grid">
            <label className="modal-dialog__field">
              <span>Ubicación de reintegro</span>
              <FilterSelect
                id="access-return-location"
                name="access_return_location"
                label="Ubicación de reintegro"
                variant="field"
                showLabel={false}
                value={returnForm.location_id}
                options={locationOptions}
                onChange={(value) => setReturnForm((current) => ({ ...current, location_id: value }))}
                placeholder="Selecciona una ubicación"
                ariaDescribedBy={getFieldDescribedBy('access-return-location')}
                invalid={Boolean(getFieldError('access-return-location'))}
              />
              {renderFieldError('access-return-location')}
            </label>
            <label className="modal-dialog__field" htmlFor="access-return-returned-at">
              <span>Fecha de devolución</span>
              <input
                id="access-return-returned-at"
                name="access_return_returned_at"
                type="datetime-local"
                value={returnForm.returned_at}
                onChange={(event) => setReturnForm((current) => ({ ...current, returned_at: event.target.value }))}
                aria-invalid={getFieldError('access-return-returned-at') ? 'true' : undefined}
                aria-describedby={getFieldDescribedBy('access-return-returned-at')}
              />
              {renderFieldError('access-return-returned-at')}
            </label>
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="access-return-notes">
              <span>Notas</span>
              <textarea
                id="access-return-notes"
                name="access_return_notes"
                value={returnForm.notes}
                onChange={(event) => setReturnForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Condición o contexto de la devolución"
              />
            </label>
            </div>
          </section>
          {renderModalNoticeSlot(true)}
          <div className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={closeAllModals}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmitting}>{isSubmitting ? 'Procesando...' : 'Registrar devolución'}</button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog open={isNotReturnedModalOpen} title="Marcar no devuelto" onClose={closeAllModals} size="narrow">
        <form className="modal-dialog__form access-modal access-modal--compact" onSubmit={(event) => void handleNotReturnedSubmit(event)}>
          <section className="access-modal__panel">
            <div className="modal-dialog__grid">
            <label className="modal-dialog__field" htmlFor="access-not-returned-resolved-at">
              <span>Fecha de cierre</span>
              <input
                id="access-not-returned-resolved-at"
                name="access_not_returned_resolved_at"
                type="datetime-local"
                value={notReturnedForm.resolved_at}
                onChange={(event) => setNotReturnedForm((current) => ({ ...current, resolved_at: event.target.value }))}
                aria-invalid={getFieldError('access-not-returned-resolved-at') ? 'true' : undefined}
                aria-describedby={getFieldDescribedBy('access-not-returned-resolved-at')}
              />
              {renderFieldError('access-not-returned-resolved-at')}
            </label>
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="access-not-returned-notes">
              <span>Motivo</span>
              <textarea
                id="access-not-returned-notes"
                name="access_not_returned_notes"
                value={notReturnedForm.notes}
                onChange={(event) => setNotReturnedForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Describe por qué el medio ya no fue devuelto"
              />
            </label>
            </div>
          </section>
          {renderModalNoticeSlot(true)}
          <div className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={closeAllModals}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmitting}>{isSubmitting ? 'Procesando...' : 'Confirmar no devolución'}</button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog open={isEnrollmentStatusOpen} title="Cambiar estado del alta" onClose={closeAllModals} size="narrow">
        <form className="modal-dialog__form access-modal access-modal--compact" onSubmit={(event) => void handleEnrollmentStatusSubmit(event)}>
          <section className="access-modal__panel">
            <div className="modal-dialog__grid">
            <label className="modal-dialog__field">
              <span>Nuevo estado</span>
              <FilterSelect
                id="access-enrollment-next-status"
                name="access_enrollment_next_status"
                label="Nuevo estado"
                variant="field"
                showLabel={false}
                value={enrollmentStatusForm.status_key}
                options={catalog.enrollment_statuses
                  .filter((status) => status.status_key !== activeEnrollmentAction?.status_key)
                  .map((status) => ({ key: status.status_key, label: status.name }))}
                onChange={(value) => setEnrollmentStatusForm((current) => ({ ...current, status_key: value }))}
                placeholder="Selecciona un estado"
                ariaDescribedBy={getFieldDescribedBy('access-enrollment-next-status')}
                invalid={Boolean(getFieldError('access-enrollment-next-status'))}
              />
              {renderFieldError('access-enrollment-next-status')}
            </label>
            <label className="modal-dialog__field">
              <span>Asignación ligada</span>
              <FilterSelect
                id="access-enrollment-next-assignment"
                name="access_enrollment_next_assignment"
                label="Asignación ligada"
                variant="field"
                showLabel={false}
                value={enrollmentStatusForm.media_assignment_id}
                options={assignmentOptionsForEnrollmentStatus}
                onChange={(value) => setEnrollmentStatusForm((current) => ({ ...current, media_assignment_id: value }))}
                placeholder="Opcional"
              />
            </label>
            <label className="modal-dialog__field" htmlFor="access-enrollment-activated-at">
              <span>Fecha de activación</span>
              <input
                id="access-enrollment-activated-at"
                name="access_enrollment_activated_at"
                type="datetime-local"
                value={enrollmentStatusForm.activated_at}
                onChange={(event) => setEnrollmentStatusForm((current) => ({ ...current, activated_at: event.target.value }))}
                aria-invalid={getFieldError('access-enrollment-activated-at') ? 'true' : undefined}
                aria-describedby={getFieldDescribedBy('access-enrollment-activated-at')}
              />
              {renderFieldError('access-enrollment-activated-at')}
            </label>
            <label className="modal-dialog__field" htmlFor="access-enrollment-deactivated-at">
              <span>Fecha de baja</span>
              <input
                id="access-enrollment-deactivated-at"
                name="access_enrollment_deactivated_at"
                type="datetime-local"
                value={enrollmentStatusForm.deactivated_at}
                onChange={(event) => setEnrollmentStatusForm((current) => ({ ...current, deactivated_at: event.target.value }))}
                aria-invalid={getFieldError('access-enrollment-deactivated-at') ? 'true' : undefined}
                aria-describedby={getFieldDescribedBy('access-enrollment-deactivated-at')}
              />
              {renderFieldError('access-enrollment-deactivated-at')}
            </label>
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="access-enrollment-status-notes">
              <span>Notas</span>
              <textarea
                id="access-enrollment-status-notes"
                name="access_enrollment_status_notes"
                value={enrollmentStatusForm.notes}
                onChange={(event) => setEnrollmentStatusForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Contexto del cambio de estado"
              />
            </label>
            </div>
          </section>
          {renderModalNoticeSlot(true)}
          <div className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={closeAllModals}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmitting}>{isSubmitting ? 'Actualizando...' : 'Aplicar cambio'}</button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog open={isOffboardOpen} title="Cerrar acceso" onClose={closeAllModals} size="narrow">
        <form className="modal-dialog__form access-modal access-modal--compact" onSubmit={(event) => void handleOffboardSubmit(event)}>
          <section className="access-modal__panel">
            <div className="access-modal__stack">
              <div className="modal-dialog__field">
                <span className="modal-dialog__field-label">RFID</span>
                {offboardHasActiveAssignments ? (
                  <>
                    <FilterChipGroup
                      label="Resolución del RFID"
                      options={[
                        { key: 'returned', label: 'Devuelto' },
                        { key: 'not_returned', label: 'No devuelto' }
                      ]}
                      activeKey={offboardForm.media_resolution}
                      onSelect={(value) => setOffboardForm((current) => ({ ...current, media_resolution: value }))}
                      className="workspace-chip-group workspace-chip-group--compact access-modal__resolution-group"
                      chipClassName="workspace-chip access-modal__resolution-chip"
                      activeChipClassName="workspace-chip--active"
                    />
                    <p className="access-flow__field-note">
                      {offboardForm.media_resolution === 'not_returned'
                        ? 'El RFID saldrá del inventario reutilizable.'
                        : 'El RFID volverá a inventario y quedará disponible.'}
                    </p>
                  </>
                ) : (
                  <p className="access-flow__field-note">No hay RFID activo. Solo se cerrarán las altas vigentes.</p>
                )}
                {renderFieldError('access-offboard-resolution')}
              </div>

              <div className="modal-dialog__grid access-modal__compact-grid">
                <label className="modal-dialog__field" htmlFor="access-offboarded-at">
                  <span>Cierre</span>
                  <input
                    id="access-offboarded-at"
                    name="access_offboarded_at"
                    type="datetime-local"
                    value={offboardForm.offboarded_at}
                    onChange={(event) => setOffboardForm((current) => ({ ...current, offboarded_at: event.target.value }))}
                    aria-invalid={getFieldError('access-offboarded-at') ? 'true' : undefined}
                    aria-describedby={getFieldDescribedBy('access-offboarded-at')}
                  />
                  {renderFieldError('access-offboarded-at')}
                </label>

                <div className="modal-dialog__field access-modal__optional-field">
                  <button
                    type="button"
                    className="action-inline action-inline--secondary"
                    onClick={() => setIsOffboardNotesOpen((current) => !current)}
                    aria-label={isOffboardNotesOpen ? 'Ocultar nota de cierre' : 'Agregar nota de cierre'}
                  >
                    <span>{isOffboardNotesOpen ? 'Ocultar' : 'Agregar nota'}</span>
                  </button>
                </div>

                {offboardForm.media_resolution === 'returned' ? (
                  <label className="modal-dialog__field modal-dialog__field--full">
                    <span>Ubicación de reintegro</span>
                    <FilterSelect
                      id="access-offboard-location"
                      name="access_offboard_location"
                      label="Ubicación de reintegro"
                      variant="field"
                      showLabel={false}
                      value={offboardForm.location_id}
                      options={locationOptions}
                      onChange={(value) => setOffboardForm((current) => ({ ...current, location_id: value }))}
                      placeholder="Selecciona una ubicación"
                      ariaDescribedBy={getFieldDescribedBy('access-offboard-location')}
                      invalid={Boolean(getFieldError('access-offboard-location'))}
                    />
                    {renderFieldError('access-offboard-location')}
                  </label>
                ) : null}

                {isOffboardNotesOpen ? (
                  <label className="modal-dialog__field modal-dialog__field--full" htmlFor="access-offboard-notes">
                    <span className="sr-only">Notas</span>
                    <textarea
                      id="access-offboard-notes"
                      name="access_offboard_notes"
                      value={offboardForm.notes}
                      onChange={(event) => setOffboardForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Contexto opcional"
                      rows={3}
                    />
                  </label>
                ) : null}
              </div>
            </div>
          </section>
          {renderModalNoticeSlot(true)}
          <div className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={closeAllModals}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmitting}>{isSubmitting ? 'Procesando...' : 'Cerrar acceso'}</button>
          </div>
        </form>
      </ModalDialog>
    </section>
  );
};

export default AccessPage;
