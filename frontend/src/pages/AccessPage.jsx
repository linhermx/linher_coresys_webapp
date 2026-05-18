import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRightLeft,
  CircleOff,
  History,
  IdCard,
  Plus,
  ShieldCheck,
  Undo2,
  UserCog,
  UserPlus,
  UserMinus,
  Wrench
} from 'lucide-react';

import { EmptyState } from '../components/primitives/EmptyState.jsx';
import { FilterChipGroup } from '../components/primitives/FilterChipGroup.jsx';
import { FilterSelect } from '../components/primitives/FilterSelect.jsx';
import { InlineNotice } from '../components/primitives/InlineNotice.jsx';
import { ModalDialog } from '../components/primitives/ModalDialog.jsx';
import { OperationalTablePanel } from '../components/primitives/OperationalTablePanel.jsx';
import { PaginationBar } from '../components/primitives/PaginationBar.jsx';
import { SegmentedControl } from '../components/primitives/SegmentedControl.jsx';
import { ToolbarSearchField } from '../components/primitives/ToolbarSearchField.jsx';
import { WorkspaceActionMenu } from '../components/primitives/WorkspaceActionMenu.jsx';
import { WorkspaceNoticeRail } from '../components/primitives/WorkspaceNoticeRail.jsx';
import { WorkspaceSplitLayout } from '../components/primitives/WorkspaceSplitLayout.jsx';
import { useAuth } from '../hooks/useAuth.js';
import {
  assignAccessMedia,
  createAccessEnrollment,
  createAccessMedia,
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
import {
  createWorkspaceErrorTitle,
  createWorkspaceLoadingState,
  createWorkspaceNoRecordsState
} from '../utils/workspaceStateCopy.js';

const accessViewOptions = [
  { key: 'assignments', label: 'Asignaciones', icon: ShieldCheck },
  { key: 'media', label: 'Medios', icon: IdCard },
  { key: 'enrollments', label: 'Altas', icon: UserCog },
  { key: 'history', label: 'Historial', icon: History }
];

const validAccessViewKeys = new Set(accessViewOptions.map((option) => option.key));
const resolveAccessView = (value) => {
  const normalized = String(value || '').trim();
  return validAccessViewKeys.has(normalized) ? normalized : 'assignments';
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
  'Asigna el primer chip o tarjeta para comenzar a controlar la entrega operativa de medios.'
);
const accessMediaNoRecordsState = createWorkspaceNoRecordsState(
  'medios',
  'Vincula los chips y tarjetas RFID que ya viven en Inventario para poder asignarlos y darles seguimiento operativo.'
);
const accessEnrollmentsNoRecordsState = createWorkspaceNoRecordsState(
  'altas',
  'Crea la primera alta por sistema para mantener visible quién está activo en Producción, Oficinas o Baño.'
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
  enrollment_statuses: []
};

const defaultCreateMediaForm = {
  medium_type_key: 'chip',
  asset_unit_id: '',
  tag_code: '',
  notes: ''
};

const defaultAssignForm = {
  access_media_id: '',
  collaborator_id: '',
  assigned_at: '',
  expected_return_at: '',
  location_id: '',
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
    media_created: 'Medio registrado',
    media_assigned: 'Medio asignado',
    media_returned: 'Medio devuelto',
    media_marked_not_returned: 'Medio no devuelto',
    enrollment_created: 'Alta creada',
    enrollment_activated: 'Alta activada',
    enrollment_suspended: 'Alta suspendida',
    enrollment_deactivated: 'Alta desactivada',
    collaborator_offboarded: 'Baja procesada'
  };

  return labelMap[eventType] || eventType;
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
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const [isCreateMediaOpen, setIsCreateMediaOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCreateEnrollmentOpen, setIsCreateEnrollmentOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isNotReturnedModalOpen, setIsNotReturnedModalOpen] = useState(false);
  const [isEnrollmentStatusOpen, setIsEnrollmentStatusOpen] = useState(false);
  const [isOffboardOpen, setIsOffboardOpen] = useState(false);
  const [isCreateCollaboratorOpen, setIsCreateCollaboratorOpen] = useState(false);

  const [createMediaForm, setCreateMediaForm] = useState(defaultCreateMediaForm);
  const [assignForm, setAssignForm] = useState(defaultAssignForm);
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

  const createAssignmentTriggerRef = useRef(null);
  const createMediaTriggerRef = useRef(null);
  const createEnrollmentTriggerRef = useRef(null);
  const accessOverflowTriggerRef = useRef(null);
  const createAssignmentReturnFocusRef = useRef(null);
  const createMediaReturnFocusRef = useRef(null);
  const createEnrollmentReturnFocusRef = useRef(null);
  const createCollaboratorReturnFocusRef = useRef(null);

  const activeView = resolveAccessView(searchParams.get('view'));
  const canCreateAccess = hasPermission(authUser, 'access.create');
  const canAssignAccess = hasPermission(authUser, 'access.assign');
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
      const linkedUnitIds = new Set(media.map((item) => Number(item.asset_unit_id)));
      setAvailableInventoryUnits(units.filter((unit) => (
        unit.asset_type_key === 'rfid_tag' && !linkedUnitIds.has(Number(unit.id))
      )));
    } finally {
      setIsLoadingUnits(false);
    }
  }, [media]);

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
    setSelectedAssignmentId(null);
    setSelectedMediaId(null);
    setSelectedEnrollmentId(null);
    setSelectedEventId(null);
  }, [activeView]);

  const collaboratorOptions = useMemo(() => ([
    { key: '', label: 'Selecciona un colaborador' },
    ...collaborators.map((collaborator) => ({
      key: String(collaborator.id),
      label: toCollaboratorLabel(collaborator)
    }))
  ]), [collaborators]);

  const systemFilterOptions = useMemo(() => ([
    { key: 'all', label: 'Todos los sistemas' },
    ...catalog.systems.map((system) => ({
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

  const assignmentMediumOptions = useMemo(() => ([
    { key: '', label: 'Selecciona un medio disponible' },
    ...media
      .filter((item) => item.status_key === 'available')
      .map((item) => ({
        key: String(item.id),
        label: `${item.tag_code} · ${item.medium_type_name}`
      }))
  ]), [media]);

  const enrollmentSystemOptions = useMemo(() => ([
    { key: '', label: 'Selecciona un sistema' },
    ...catalog.systems.map((system) => ({
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

  const availableUnitOptions = useMemo(() => ([
    { key: '', label: isLoadingUnits ? 'Cargando unidades disponibles...' : 'Selecciona una unidad RFID' },
    ...availableInventoryUnits.map((unit) => ({
      key: String(unit.id),
      label: `${unit.asset_tag} · ${unit.asset_name || 'Sin activo'}${unit.serial_number ? ` · ${unit.serial_number}` : ''}`
    }))
  ]), [availableInventoryUnits, isLoadingUnits]);

  const activeAssignmentOptionsByCollaborator = useMemo(() => {
    const collaboratorId = Number(createEnrollmentForm.collaborator_id || 0);
    const filteredAssignments = collaboratorId > 0
      ? assignments.filter((assignment) => (
        assignment.status_key === 'active' && Number(assignment.collaborator?.id) === collaboratorId
      ))
      : assignments.filter((assignment) => assignment.status_key === 'active');

    return [
      { key: '', label: 'Sin medio ligado' },
      ...filteredAssignments.map((assignment) => ({
        key: String(assignment.id),
        label: `${assignment.media?.tag_code || 'Sin tag'} · ${assignment.collaborator?.full_name || 'Sin colaborador'}`
      }))
    ];
  }, [assignments, createEnrollmentForm.collaborator_id]);

  const assignmentOptionsForEnrollmentStatus = useMemo(() => {
    const collaboratorId = Number(activeEnrollmentAction?.collaborator?.id || 0);
    const filteredAssignments = collaboratorId > 0
      ? assignments.filter((assignment) => (
        assignment.status_key === 'active' && Number(assignment.collaborator?.id) === collaboratorId
      ))
      : assignments.filter((assignment) => assignment.status_key === 'active');

    return [
      { key: '', label: 'Sin medio ligado' },
      ...filteredAssignments.map((assignment) => ({
        key: String(assignment.id),
        label: `${assignment.media?.tag_code || 'Sin tag'} · ${assignment.collaborator?.full_name || 'Sin colaborador'}`
      }))
    ];
  }, [activeEnrollmentAction, assignments]);

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

  const filteredEnrollments = useMemo(() => enrollments.filter((enrollment) => {
    if (enrollmentStatusFilter !== 'all' && enrollment.status_key !== enrollmentStatusFilter) {
      return false;
    }

    if (enrollmentSystemFilter !== 'all' && String(enrollment.access_system?.id) !== enrollmentSystemFilter) {
      return false;
    }

    return matchesSearch(enrollmentSearchTerm, [
      enrollment.collaborator?.full_name,
      enrollment.collaborator?.employee_id,
      enrollment.access_system?.name,
      enrollment.media?.tag_code,
      enrollment.notes
    ]);
  }), [enrollments, enrollmentSearchTerm, enrollmentStatusFilter, enrollmentSystemFilter]);

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
    () => paginateRows(filteredEnrollments, enrollmentCurrentPage, enrollmentPageSize),
    [filteredEnrollments, enrollmentCurrentPage, enrollmentPageSize]
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
  const selectedEnrollment = useMemo(
    () => enrollments.find((enrollment) => Number(enrollment.id) === Number(selectedEnrollmentId)) || null,
    [enrollments, selectedEnrollmentId]
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

    if (activeView === 'enrollments' && selectedEnrollment) {
      const collaboratorId = Number(selectedEnrollment.collaborator?.id || 0);
      const accessMediaId = Number(selectedEnrollment.media?.id || 0);

      return {
        type: 'enrollment',
        title: selectedEnrollment.collaborator?.full_name || selectedEnrollment.access_system?.name || 'Alta',
        subtitle: `${selectedEnrollment.access_system?.name || 'Sistema'} · ${selectedEnrollment.status_name}`,
        collaborator: selectedEnrollment.collaborator || null,
        media: accessMediaId > 0 ? media.find((item) => Number(item.id) === accessMediaId) || null : null,
        assignment: assignments.find((assignment) => Number(assignment.collaborator?.id || 0) === collaboratorId && assignment.status_key === 'active') || null,
        enrollment: selectedEnrollment,
        event: null,
        events: events.filter((eventRow) => (
          Number(eventRow.access_enrollment_id || 0) === Number(selectedEnrollment.id) || Number(eventRow.collaborator_id || 0) === collaboratorId
        )).slice(0, 12),
        enrollments: enrollments.filter((enrollment) => Number(enrollment.collaborator?.id || 0) === collaboratorId),
        assignments: assignments.filter((assignment) => Number(assignment.collaborator?.id || 0) === collaboratorId)
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
  }, [activeView, assignments, collaborators, enrollments, events, media, selectedAssignment, selectedEnrollment, selectedEvent, selectedMedia]);

  const handleViewChange = (viewKey) => {
    setSearchParams({ view: viewKey }, { replace: true });
  };

  const closeAllModals = () => {
    setIsCreateMediaOpen(false);
    setIsAssignModalOpen(false);
    setIsCreateEnrollmentOpen(false);
    setIsReturnModalOpen(false);
    setIsNotReturnedModalOpen(false);
    setIsEnrollmentStatusOpen(false);
    setIsOffboardOpen(false);
    setIsCreateCollaboratorOpen(false);
    setModalError('');
    setFormErrors({});
    setIsSubmitting(false);
    setActiveAssignmentAction(null);
    setActiveEnrollmentAction(null);
    setActiveOffboardTarget(null);
    setCollaboratorCreationTarget(null);
  };

  const openCreateMediaModal = async (triggerElement = null) => {
    resetFeedback();
    createMediaReturnFocusRef.current = triggerElement || createMediaTriggerRef.current || accessOverflowTriggerRef.current;
    setCreateMediaForm(defaultCreateMediaForm);
    setIsCreateMediaOpen(true);
    await loadAvailableUnits();
  };

  const openAssignModal = (prefillMediaId = null, triggerElement = null) => {
    resetFeedback();
    createAssignmentReturnFocusRef.current = triggerElement || createAssignmentTriggerRef.current;
    setAssignForm({
      ...defaultAssignForm,
      access_media_id: prefillMediaId ? String(prefillMediaId) : '',
      assigned_at: toDateTimeLocalValue()
    });
    setIsAssignModalOpen(true);
  };

  const openCreateEnrollmentModal = (context = null, triggerElement = null) => {
    resetFeedback();
    createEnrollmentReturnFocusRef.current = triggerElement || createEnrollmentTriggerRef.current || accessOverflowTriggerRef.current;
    setCreateEnrollmentForm({
      ...defaultEnrollmentForm,
      collaborator_id: context?.collaborator?.id ? String(context.collaborator.id) : '',
      media_assignment_id: context?.assignment?.id ? String(context.assignment.id) : '',
      activated_at: toDateTimeLocalValue()
    });
    setIsCreateEnrollmentOpen(true);
  };

  const openCreateCollaboratorModal = (target = null, triggerElement = null) => {
    resetFeedback();
    createCollaboratorReturnFocusRef.current = triggerElement || accessOverflowTriggerRef.current;
    setCreateCollaboratorForm(defaultCreateCollaboratorForm);
    setCollaboratorCreationTarget(target);
    setIsCreateCollaboratorOpen(true);
  };

  const closeCreateCollaboratorModal = () => {
    setIsCreateCollaboratorOpen(false);
    setCollaboratorCreationTarget(null);
    setModalError('');
    setFormErrors({});
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
      errors['access-create-media-tag'] = 'Captura el tag o codigo del medio.';
    }

    return errors;
  };

  const validateCreateCollaboratorForm = () => {
    const errors = {};

    if (!normalizeFieldValue(createCollaboratorForm.employee_id)) {
      errors['access-create-collaborator-employee-id'] = 'Captura el ID operativo del colaborador.';
    } else if (!toPositiveNumberOrNull(createCollaboratorForm.employee_id)) {
      errors['access-create-collaborator-employee-id'] = 'El ID operativo debe ser un número entero mayor a cero.';
    }

    if (!normalizeFieldValue(createCollaboratorForm.first_name)) {
      errors['access-create-collaborator-first-name'] = 'Captura el nombre del colaborador.';
    }

    if (!normalizeFieldValue(createCollaboratorForm.last_name)) {
      errors['access-create-collaborator-last-name'] = 'Captura los apellidos del colaborador.';
    }

    return errors;
  };

  const validateAssignForm = () => {
    const errors = {};

    if (!toPositiveNumberOrNull(assignForm.access_media_id)) {
      errors['access-assign-media'] = 'Selecciona un medio disponible.';
    }

    if (!toPositiveNumberOrNull(assignForm.collaborator_id)) {
      errors['access-assign-collaborator'] = 'Selecciona un colaborador.';
    }

    if (!normalizeFieldValue(assignForm.assigned_at)) {
      errors['access-assign-assigned-at'] = 'Indica la fecha de asignacion.';
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

    if (!normalizeFieldValue(createEnrollmentForm.status_key)) {
      errors['access-create-enrollment-status'] = 'Selecciona un estado inicial.';
    }

    if (createEnrollmentForm.status_key === 'active' && !normalizeFieldValue(createEnrollmentForm.activated_at)) {
      errors['access-create-enrollment-activated-at'] = 'Indica la fecha de activacion del alta.';
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

    await runMutation(() => createAccessMedia({
      medium_type_key: createMediaForm.medium_type_key,
      asset_unit_id: toPositiveNumberOrNull(createMediaForm.asset_unit_id),
      tag_code: normalizeFieldValue(createMediaForm.tag_code),
      notes: normalizeFieldValue(createMediaForm.notes) || undefined
    }), 'Medio de acceso vinculado correctamente.');
  };

  const handleCreateCollaboratorSubmit = async (event) => {
    event.preventDefault();
    const errors = validateCreateCollaboratorForm();
    if (Object.keys(errors).length > 0) {
      applyValidationErrors(errors);
      return;
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

      if (collaboratorCreationTarget === 'assign') {
        setAssignForm((current) => ({
          ...current,
          collaborator_id: String(createdCollaborator.id)
        }));
      }

      if (collaboratorCreationTarget === 'enrollment') {
        setCreateEnrollmentForm((current) => ({
          ...current,
          collaborator_id: String(createdCollaborator.id),
          media_assignment_id: ''
        }));
      }

      closeCreateCollaboratorModal();
      setActionSuccess('Colaborador registrado correctamente.');
    } catch (error) {
      if (isAccessAuthError(error) || isCollaboratorAuthError(error) || isInventoryAuthError(error)) {
        clearSession();
        return;
      }

      setModalError(normalizeErrorMessage(error, 'No fue posible registrar el colaborador.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignSubmit = async (event) => {
    event.preventDefault();
    const errors = validateAssignForm();
    if (Object.keys(errors).length > 0) {
      applyValidationErrors(errors);
      return;
    }

    await runMutation(() => assignAccessMedia({
      access_media_id: toPositiveNumberOrNull(assignForm.access_media_id),
      collaborator_id: toPositiveNumberOrNull(assignForm.collaborator_id),
      assigned_at: normalizeFieldValue(assignForm.assigned_at) || undefined,
      expected_return_at: normalizeFieldValue(assignForm.expected_return_at) || undefined,
      location_id: toPositiveNumberOrNull(assignForm.location_id) || undefined,
      notes: normalizeFieldValue(assignForm.notes) || undefined
    }), 'Medio asignado correctamente.');
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
    }), 'La baja de accesos se procesó correctamente.');
  };

  const accessOverflowActions = [
    canCreateAccess ? {
      key: 'link-media',
      label: 'Vincular medio',
      icon: IdCard,
      onSelect: () => {
        void openCreateMediaModal(accessOverflowTriggerRef.current);
      }
    } : null,
    canCreateAccess ? {
      key: 'create-enrollment',
      label: 'Registrar alta',
      icon: UserCog,
      onSelect: () => openCreateEnrollmentModal(null, accessOverflowTriggerRef.current)
    } : null,
    canCreateCollaborators ? {
      key: 'create-collaborator',
      label: 'Registrar colaborador',
      icon: UserPlus,
      onSelect: () => openCreateCollaboratorModal(null, accessOverflowTriggerRef.current)
    } : null
  ].filter(Boolean);

  const headerActions = (
    <>
      {accessOverflowActions.length ? (
        <WorkspaceActionMenu
          label="Más acciones"
          items={accessOverflowActions}
          className="workspace-page__header-menu"
          triggerClassName="workspace-action workspace-action--ghost"
          triggerRef={accessOverflowTriggerRef}
        />
      ) : null}
      {canAssignAccess ? (
        <button
          type="button"
          className="workspace-action workspace-action--primary"
          ref={createAssignmentTriggerRef}
          onClick={(event) => openAssignModal(null, event.currentTarget)}
        >
          <Plus size={16} aria-hidden="true" />
          <span>Asignar medio</span>
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
              tabIndex={0}
              onClick={() => setSelectedAssignmentId(assignment.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedAssignmentId(assignment.id);
                }
              }}
            >
              <td className="data-table__cell">
                <span className="data-table__item-title">{assignment.collaborator?.full_name || 'Sin colaborador'}</span>
                <span className="data-table__item-meta access-table__meta">{assignment.collaborator?.employee_id ? `ID ${assignment.collaborator.employee_id}` : 'Sin ID'}</span>
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
              tabIndex={0}
              onClick={() => setSelectedMediaId(item.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedMediaId(item.id);
                }
              }}
            >
              <td className="data-table__cell">
                <span className="data-table__item-title">{item.tag_code}</span>
                <span className="data-table__item-meta access-table__meta">{item.notes || 'Sin observaciones'}</span>
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
                  {item.status_key === 'available' && canAssignAccess ? (
                    <button type="button" className="action-inline action-inline--primary" onClick={(event) => {
                      event.stopPropagation();
                      openAssignModal(item.id, event.currentTarget);
                    }}>
                      <ArrowRightLeft size={14} aria-hidden="true" />
                      <span>Asignar</span>
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
          <th scope="col">Sistema</th>
          <th scope="col">Medio</th>
          <th scope="col">Estado</th>
          <th scope="col">Activado</th>
          <th scope="col">Acción</th>
        </tr>
      </thead>
      <tbody>
        {enrollmentPage.rows.map((enrollment) => {
          const isActiveRow = Number(selectedEnrollmentId) === Number(enrollment.id);

          return (
            <tr
              key={enrollment.id}
              className={`data-table__row inventory-table__row${isActiveRow ? ' data-table__row--active' : ''}`}
              tabIndex={0}
              onClick={() => setSelectedEnrollmentId(enrollment.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedEnrollmentId(enrollment.id);
                }
              }}
            >
              <td className="data-table__cell">
                <span className="data-table__item-title">{enrollment.collaborator?.full_name || 'Sin colaborador'}</span>
                <span className="data-table__item-meta access-table__meta">{enrollment.collaborator?.employee_id ? `ID ${enrollment.collaborator.employee_id}` : 'Sin ID'}</span>
              </td>
              <td className="data-table__cell">{enrollment.access_system?.name || 'Sin sistema'}</td>
              <td className="data-table__cell">{enrollment.media?.tag_code || 'Sin medio ligado'}</td>
              <td className="data-table__cell">
                <span className={getEnrollmentStatusToneClass(enrollment.status_key)}>{enrollment.status_name}</span>
              </td>
              <td className="data-table__cell">
                <span className="access-table__supporting">{enrollment.activated_at ? formatDateTime(enrollment.activated_at) : 'Sin fecha'}</span>
              </td>
              <td className="data-table__cell">
                <div className="inventory-table__actions access-table__actions">
                  {enrollment.status_key !== 'deactivated' && canUpdateAccess ? (
                    <button type="button" className="action-inline action-inline--primary" onClick={(event) => {
                      event.stopPropagation();
                      openEnrollmentStatusModal(enrollment);
                    }}>
                      <Wrench size={14} aria-hidden="true" />
                      <span>Cambiar estado</span>
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
              tabIndex={0}
              onClick={() => setSelectedEventId(eventRow.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedEventId(eventRow.id);
                }
              }}
            >
              <td className="data-table__cell">
                <span className="data-table__item-title">{toEventLabel(eventRow.event_type)}</span>
                <span className="data-table__item-meta access-table__meta">{eventRow.notes || 'Sin observaciones'}</span>
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

  const detailOpen = Boolean(detailContext);
  const offboardHasActiveAssignments = Boolean(
    activeOffboardTarget?.assignments?.some((assignment) => assignment.status_key === 'active')
  );
  const activeAssignmentsForDetail = detailContext?.assignments?.filter((assignment) => assignment.status_key === 'active') || [];
  const canOffboardFromDetail = Boolean(detailContext?.collaborator?.id)
    && (detailContext?.enrollments?.some((enrollment) => enrollment.status_key !== 'deactivated') || activeAssignmentsForDetail.length > 0);
  const accessDetailPanel = detailContext ? (
    <aside className="ticket-detail ticket-detail--tone-primary access-detail" aria-labelledby={ACCESS_DETAIL_TITLE_ID}>
      <div className="ticket-detail__summary">
        <header className="ticket-detail__header">
          <div className="ticket-detail__header-top">
            <div>
              <div className="ticket-detail__header-id">
                <span className="ticket-detail__ticket-id">Detalle</span>
              </div>
              <h2 id={ACCESS_DETAIL_TITLE_ID} className="ticket-detail__title">{detailContext.title}</h2>
              <p className="ticket-detail__summary access-detail__summary-copy">{detailContext.subtitle}</p>
            </div>
            <div className="ticket-detail__header-actions">
              {detailContext.media?.status_key === 'available' && canAssignAccess ? (
                <button type="button" className="ticket-detail__edit" onClick={(event) => openAssignModal(detailContext.media.id, event.currentTarget)}>
                  <ArrowRightLeft size={14} aria-hidden="true" />
                  <span>Asignar</span>
                </button>
              ) : null}
              {detailContext.assignment?.status_key === 'active' && canAssignAccess ? (
                <button type="button" className="ticket-detail__edit" onClick={() => openReturnModal(detailContext.assignment)}>
                  <Undo2 size={14} aria-hidden="true" />
                  <span>Devolver</span>
                </button>
              ) : null}
              {detailContext.assignment?.status_key === 'active' && canAssignAccess ? (
                <button type="button" className="ticket-detail__edit" onClick={() => openNotReturnedModal(detailContext.assignment)}>
                  <CircleOff size={14} aria-hidden="true" />
                  <span>No devuelto</span>
                </button>
              ) : null}
              {detailContext.collaborator?.id && canCreateAccess ? (
                <button type="button" className="ticket-detail__edit" onClick={(event) => openCreateEnrollmentModal(detailContext, event.currentTarget)}>
                  <UserCog size={14} aria-hidden="true" />
                  <span>Registrar alta</span>
                </button>
              ) : null}
              {canOffboardFromDetail && canAssignAccess ? (
                <button type="button" className="ticket-detail__edit" onClick={() => openOffboardModal(detailContext)}>
                  <UserMinus size={14} aria-hidden="true" />
                  <span>Dar de baja accesos</span>
                </button>
              ) : null}
              <button
                type="button"
                className="ticket-detail__close"
                onClick={() => {
                  setSelectedAssignmentId(null);
                  setSelectedMediaId(null);
                  setSelectedEnrollmentId(null);
                  setSelectedEventId(null);
                }}
                aria-label="Cerrar detalle de accesos"
              >
                <CircleOff size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <dl className="ticket-detail__meta-grid">
            <div className="ticket-detail__meta-item">
              <dt className="ticket-detail__meta-label">Colaborador</dt>
              <dd>{detailContext.collaborator?.full_name || 'Sin colaborador ligado'}</dd>
            </div>
            <div className="ticket-detail__meta-item">
              <dt className="ticket-detail__meta-label">ID operativo</dt>
              <dd>{detailContext.collaborator?.employee_id || 'Sin ID'}</dd>
            </div>
            <div className="ticket-detail__meta-item">
              <dt className="ticket-detail__meta-label">Medio</dt>
              <dd>{detailContext.media ? toMediaLabel(detailContext.media) : 'Sin medio ligado'}</dd>
            </div>
            <div className="ticket-detail__meta-item">
              <dt className="ticket-detail__meta-label">Estado principal</dt>
              <dd>
                {detailContext.assignment ? (
                  <span className={getAssignmentStatusToneClass(detailContext.assignment.status_key)}>{detailContext.assignment.status_name}</span>
                ) : detailContext.enrollment ? (
                  <span className={getEnrollmentStatusToneClass(detailContext.enrollment.status_key)}>{detailContext.enrollment.status_name}</span>
                ) : detailContext.media ? (
                  <span className={getMediumStatusToneClass(detailContext.media.status_key)}>{detailContext.media.status_name}</span>
                ) : detailContext.event ? (
                  <span className="inventory-status-chip inventory-status-chip--neutral">{toEventLabel(detailContext.event.event_type)}</span>
                ) : 'Sin contexto'}
              </dd>
            </div>
          </dl>
        </header>

        <section className="ticket-detail__section">
          <div className="ticket-detail__section-headline">
            <h3 className="ticket-detail__section-title">Resumen operativo</h3>
          </div>
          <ul className="access-detail__list">
            {detailContext.assignment ? (
              <li>
                <strong>Asignación vigente</strong>
                <span>Asignado el {formatDateTime(detailContext.assignment.assigned_at)}</span>
                <span>{detailContext.assignment.expected_return_at ? `Retorno esperado: ${formatDateOnly(detailContext.assignment.expected_return_at)}` : 'Sin fecha de retorno comprometida'}</span>
              </li>
            ) : null}
            {detailContext.media ? (
              <li>
                <strong>Unidad física vinculada</strong>
                <span>{detailContext.media.asset_unit?.asset_tag || detailContext.media.asset_unit_id}</span>
                <span>{detailContext.media.asset_unit?.serial_number || 'Sin número de serie registrado'}</span>
              </li>
            ) : null}
            {detailContext.enrollment ? (
              <li>
                <strong>Alta actual</strong>
                <span>{detailContext.enrollment.access_system?.name || 'Sin sistema'}</span>
                <span>{detailContext.enrollment.activated_at ? `Activo desde ${formatDateTime(detailContext.enrollment.activated_at)}` : 'Sin fecha de activación registrada'}</span>
              </li>
            ) : null}
            {detailContext.event ? (
              <li>
                <strong>Evento seleccionado</strong>
                <span>{formatDateTime(detailContext.event.happened_at)}</span>
                <span>{detailContext.event.notes || 'Sin observaciones adicionales'}</span>
              </li>
            ) : null}
          </ul>
        </section>

        <section className="ticket-detail__section">
          <div className="ticket-detail__section-headline">
            <h3 className="ticket-detail__section-title">Altas relacionadas</h3>
          </div>
          {detailContext.enrollments?.length ? (
            <ul className="access-detail__list">
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
            <p className="inventory-asset-detail__empty-copy">No hay altas relacionadas para este contexto todavía.</p>
          )}
        </section>

        <section className="ticket-detail__section ticket-detail__section--activity">
          <div className="ticket-detail__section-headline">
            <h3 className="ticket-detail__section-title">Historial reciente</h3>
          </div>
          {detailContext.events?.length ? (
            <ul className="ticket-activity inventory-asset-detail__activity-list" aria-label="Historial reciente de accesos">
              {detailContext.events.map((eventRow) => (
                <li key={eventRow.id} className="ticket-activity__item">
                  <span className="ticket-activity__dot" aria-hidden="true" />
                  <div>
                    <p className="ticket-activity__title">{toEventLabel(eventRow.event_type)}</p>
                    <p className="ticket-activity__meta">
                      <span className="inventory-asset-detail__activity-impact">{eventRow.access_system_name || eventRow.tag_code || eventRow.collaborator_name || 'Accesos'}</span>
                      <span className="inventory-asset-detail__activity-when">{formatDateTime(eventRow.happened_at)}</span>
                    </p>
                    {eventRow.notes ? (
                      <p className="ticket-detail__comment-history-caption">{eventRow.notes}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="inventory-asset-detail__empty-copy">Aún no hay eventos relacionados que mostrar.</p>
          )}
        </section>
      </div>
    </aside>
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
                      emptyActions={canAssignAccess ? (
                        <button type="button" className="workspace-action workspace-action--primary" onClick={(event) => openAssignModal(null, event.currentTarget)}>
                          <Plus size={14} aria-hidden="true" />
                          <span>Asignar medio</span>
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
                  {canCreateAccess ? (
                    <button
                      type="button"
                      className="workspace-action workspace-action--ghost"
                      ref={createMediaTriggerRef}
                      onClick={(event) => {
                        void openCreateMediaModal(event.currentTarget);
                      }}
                    >
                      <IdCard size={16} aria-hidden="true" />
                      <span>Vincular medio</span>
                    </button>
                  ) : null}
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
                      emptyActions={canCreateAccess ? (
                        <button type="button" className="workspace-action workspace-action--primary" onClick={(event) => void openCreateMediaModal(event.currentTarget)}>
                          <Plus size={14} aria-hidden="true" />
                          <span>Vincular medio</span>
                        </button>
                      ) : null}
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
                  placeholder="Buscar por colaborador, sistema o tag..."
                  srLabel="Buscar altas"
                  className="workspace-search--operational"
                />
                <div className="workspace-page__filters workspace-page__filters--operational">
                  <FilterChipGroup
                    label="Filtro por estado de alta"
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
                <div className="workspace-page__actions">
                  {canCreateAccess ? (
                    <button
                      type="button"
                      className="workspace-action workspace-action--ghost"
                      ref={createEnrollmentTriggerRef}
                      onClick={(event) => openCreateEnrollmentModal(null, event.currentTarget)}
                    >
                      <UserCog size={16} aria-hidden="true" />
                      <span>Registrar alta</span>
                    </button>
                  ) : null}
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
                      hasData={filteredEnrollments.length > 0}
                      tone="neutral"
                      className="access-panel__table"
                      ariaLabel="Listado de altas de acceso"
                      scrollClassName="data-table__scroll workspace-scroll-wrap--fill"
                      loadingTitle={accessLoadingState.title}
                      loadingCopy={accessLoadingState.copy}
                      table={renderEnrollmentTable()}
                      pagination={(
                        <PaginationBar
                          ariaLabel="Paginación de altas"
                          start={enrollmentPage.start + 1}
                          end={Math.min(enrollmentPage.start + enrollmentPageSize, filteredEnrollments.length)}
                          total={filteredEnrollments.length}
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
                      emptyActions={canCreateAccess ? (
                        <button type="button" className="workspace-action workspace-action--primary" onClick={(event) => openCreateEnrollmentModal(null, event.currentTarget)}>
                          <Plus size={14} aria-hidden="true" />
                          <span>Registrar alta</span>
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
      <ModalDialog open={isCreateMediaOpen} title="Vincular medio de acceso" onClose={closeAllModals} returnFocusRef={createMediaReturnFocusRef} size="wide">
        <form className="modal-dialog__form" onSubmit={(event) => void handleCreateMediaSubmit(event)}>
          <div className="modal-dialog__grid">
            <label className="modal-dialog__field">
              <span>Tipo de medio</span>
              <FilterSelect
                id="access-create-media-type"
                name="access_create_media_type"
                label="Tipo de medio"
                variant="field"
                showLabel={false}
                value={createMediaForm.medium_type_key}
                options={catalog.medium_types.map((mediumType) => ({ key: mediumType.type_key, label: mediumType.name }))}
                onChange={(value) => setCreateMediaForm((current) => ({ ...current, medium_type_key: value }))}
                placeholder="Selecciona un tipo"
                ariaDescribedBy={getFieldDescribedBy('access-create-media-type')}
                invalid={Boolean(getFieldError('access-create-media-type'))}
              />
              {renderFieldError('access-create-media-type')}
            </label>
            <label className="modal-dialog__field">
              <span>Unidad RFID</span>
              <FilterSelect
                id="access-create-media-unit"
                name="access_create_media_unit"
                label="Unidad RFID"
                variant="field"
                showLabel={false}
                value={createMediaForm.asset_unit_id}
                options={availableUnitOptions}
                onChange={(value) => setCreateMediaForm((current) => ({ ...current, asset_unit_id: value }))}
                placeholder="Selecciona una unidad"
                disabled={isLoadingUnits}
                ariaDescribedBy={getFieldDescribedBy('access-create-media-unit')}
                invalid={Boolean(getFieldError('access-create-media-unit'))}
              />
              {renderFieldError('access-create-media-unit')}
              <p className="modal-dialog__field-help">Solo se muestran unidades RFID disponibles que ya existen en Inventario.</p>
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
              <span>Observaciones</span>
              <textarea
                id="access-create-media-notes"
                name="access_create_media_notes"
                value={createMediaForm.notes}
                onChange={(event) => setCreateMediaForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Contexto opcional del medio de acceso"
              />
            </label>
          </div>
          {modalError ? <InlineNotice tone="error">{modalError}</InlineNotice> : null}
          <div className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={closeAllModals}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmitting}>{isSubmitting ? 'Vinculando...' : 'Vincular medio'}</button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog open={isAssignModalOpen} title="Asignar medio" onClose={closeAllModals} returnFocusRef={createAssignmentReturnFocusRef} size="wide">
        <form className="modal-dialog__form" onSubmit={(event) => void handleAssignSubmit(event)}>
          <div className="modal-dialog__grid">
            <label className="modal-dialog__field">
              <span>Medio disponible</span>
              <FilterSelect
                id="access-assign-media"
                name="access_assign_media"
                label="Medio"
                variant="field"
                showLabel={false}
                value={assignForm.access_media_id}
                options={assignmentMediumOptions}
                onChange={(value) => setAssignForm((current) => ({ ...current, access_media_id: value }))}
                placeholder="Selecciona un medio"
                ariaDescribedBy={getFieldDescribedBy('access-assign-media')}
                invalid={Boolean(getFieldError('access-assign-media'))}
              />
              {renderFieldError('access-assign-media')}
            </label>
            <label className="modal-dialog__field">
              <div className="access-modal__field-headline">
                <span>Colaborador</span>
                {canCreateCollaborators ? (
                  <button type="button" className="action-inline action-inline--secondary" onClick={(event) => openCreateCollaboratorModal('assign', event.currentTarget)}>
                    <UserPlus size={14} aria-hidden="true" />
                    <span>Registrar colaborador</span>
                  </button>
                ) : null}
              </div>
              <FilterSelect
                id="access-assign-collaborator"
                name="access_assign_collaborator"
                label="Colaborador"
                variant="field"
                showLabel={false}
                value={assignForm.collaborator_id}
                options={collaboratorOptions}
                onChange={(value) => setAssignForm((current) => ({ ...current, collaborator_id: value }))}
                placeholder="Selecciona un colaborador"
                ariaDescribedBy={getFieldDescribedBy('access-assign-collaborator')}
                invalid={Boolean(getFieldError('access-assign-collaborator'))}
              />
              {renderFieldError('access-assign-collaborator')}
            </label>
            <label className="modal-dialog__field" htmlFor="access-assign-assigned-at">
              <span>Fecha de asignación</span>
              <input
                id="access-assign-assigned-at"
                name="access_assign_assigned_at"
                type="datetime-local"
                value={assignForm.assigned_at}
                onChange={(event) => setAssignForm((current) => ({ ...current, assigned_at: event.target.value }))}
                aria-invalid={getFieldError('access-assign-assigned-at') ? 'true' : undefined}
                aria-describedby={getFieldDescribedBy('access-assign-assigned-at')}
              />
              {renderFieldError('access-assign-assigned-at')}
            </label>
            <label className="modal-dialog__field" htmlFor="access-assign-expected-return-at">
              <span>Retorno esperado</span>
              <input
                id="access-assign-expected-return-at"
                name="access_assign_expected_return_at"
                type="datetime-local"
                value={assignForm.expected_return_at}
                onChange={(event) => setAssignForm((current) => ({ ...current, expected_return_at: event.target.value }))}
              />
            </label>
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="access-assign-notes">
              <span>Notas</span>
              <textarea
                id="access-assign-notes"
                name="access_assign_notes"
                value={assignForm.notes}
                onChange={(event) => setAssignForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Entrega personal del chip o tarjeta al colaborador"
              />
            </label>
          </div>
          {modalError ? <InlineNotice tone="error">{modalError}</InlineNotice> : null}
          <div className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={closeAllModals}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmitting}>{isSubmitting ? 'Asignando...' : 'Confirmar asignación'}</button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog open={isCreateEnrollmentOpen} title="Registrar alta" onClose={closeAllModals} returnFocusRef={createEnrollmentReturnFocusRef} size="wide">
        <form className="modal-dialog__form" onSubmit={(event) => void handleCreateEnrollmentSubmit(event)}>
          <div className="modal-dialog__grid">
            <label className="modal-dialog__field">
              <div className="access-modal__field-headline">
                <span>Colaborador</span>
                {canCreateCollaborators ? (
                  <button type="button" className="action-inline action-inline--secondary" onClick={(event) => openCreateCollaboratorModal('enrollment', event.currentTarget)}>
                    <UserPlus size={14} aria-hidden="true" />
                    <span>Registrar colaborador</span>
                  </button>
                ) : null}
              </div>
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
            </label>
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
                onChange={(value) => setCreateEnrollmentForm((current) => ({ ...current, access_system_id: value }))}
                placeholder="Selecciona un sistema"
                ariaDescribedBy={getFieldDescribedBy('access-create-enrollment-system')}
                invalid={Boolean(getFieldError('access-create-enrollment-system'))}
              />
              {renderFieldError('access-create-enrollment-system')}
            </label>
            <label className="modal-dialog__field">
              <span>Asignación ligada</span>
              <FilterSelect
                id="access-create-enrollment-assignment"
                name="access_create_enrollment_assignment"
                label="Asignación ligada"
                variant="field"
                showLabel={false}
                value={createEnrollmentForm.media_assignment_id}
                options={activeAssignmentOptionsByCollaborator}
                onChange={(value) => setCreateEnrollmentForm((current) => ({ ...current, media_assignment_id: value }))}
                placeholder="Opcional"
              />
            </label>
            <label className="modal-dialog__field">
              <span>Estado inicial</span>
              <FilterSelect
                id="access-create-enrollment-status"
                name="access_create_enrollment_status"
                label="Estado inicial"
                variant="field"
                showLabel={false}
                value={createEnrollmentForm.status_key}
                options={catalog.enrollment_statuses.map((status) => ({ key: status.status_key, label: status.name }))}
                onChange={(value) => setCreateEnrollmentForm((current) => ({ ...current, status_key: value }))}
                placeholder="Selecciona un estado"
                ariaDescribedBy={getFieldDescribedBy('access-create-enrollment-status')}
                invalid={Boolean(getFieldError('access-create-enrollment-status'))}
              />
              {renderFieldError('access-create-enrollment-status')}
            </label>
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="access-create-enrollment-activated-at">
              <span>Fecha de activación</span>
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
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="access-create-enrollment-notes">
              <span>Notas</span>
              <textarea
                id="access-create-enrollment-notes"
                name="access_create_enrollment_notes"
                value={createEnrollmentForm.notes}
                onChange={(event) => setCreateEnrollmentForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Contexto operativo del alta"
              />
            </label>
          </div>
          {modalError ? <InlineNotice tone="error">{modalError}</InlineNotice> : null}
          <div className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={closeAllModals}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmitting}>{isSubmitting ? 'Registrando...' : 'Registrar alta'}</button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog open={isCreateCollaboratorOpen} title="Registrar colaborador" onClose={closeCreateCollaboratorModal} returnFocusRef={createCollaboratorReturnFocusRef} size="wide">
        <form className="modal-dialog__form" onSubmit={(event) => void handleCreateCollaboratorSubmit(event)}>
          <div className="modal-dialog__grid">
            <label className="modal-dialog__field" htmlFor="access-create-collaborator-employee-id">
              <span>ID operativo</span>
              <input
                id="access-create-collaborator-employee-id"
                name="access_create_collaborator_employee_id"
                type="text"
                inputMode="numeric"
                value={createCollaboratorForm.employee_id}
                onChange={(event) => setCreateCollaboratorForm((current) => ({ ...current, employee_id: event.target.value }))}
                placeholder="Ej. 900109"
                aria-invalid={getFieldError('access-create-collaborator-employee-id') ? 'true' : undefined}
                aria-describedby={getFieldDescribedBy('access-create-collaborator-employee-id')}
              />
              {renderFieldError('access-create-collaborator-employee-id')}
            </label>
            <label className="modal-dialog__field" htmlFor="access-create-collaborator-first-name">
              <span>Nombre(s)</span>
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
              {renderFieldError('access-create-collaborator-first-name')}
            </label>
            <label className="modal-dialog__field" htmlFor="access-create-collaborator-last-name">
              <span>Apellidos</span>
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
              {renderFieldError('access-create-collaborator-last-name')}
            </label>
            <label className="modal-dialog__field" htmlFor="access-create-collaborator-area-name">
              <span>Área</span>
              <input
                id="access-create-collaborator-area-name"
                name="access_create_collaborator_area_name"
                type="text"
                value={createCollaboratorForm.area_name}
                onChange={(event) => setCreateCollaboratorForm((current) => ({ ...current, area_name: event.target.value }))}
                placeholder="Ej. Producción"
              />
            </label>
            <div className="modal-dialog__field modal-dialog__field--full">
              <p className="modal-dialog__field-help">Esto agrega al colaborador al directorio operativo. No crea un usuario para entrar a Coresys.</p>
            </div>
          </div>
          {modalError ? <InlineNotice tone="error">{modalError}</InlineNotice> : null}
          <div className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={closeCreateCollaboratorModal}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmitting}>{isSubmitting ? 'Registrando...' : 'Registrar colaborador'}</button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog open={isReturnModalOpen} title="Registrar devolución" onClose={closeAllModals} size="wide">
        <form className="modal-dialog__form" onSubmit={(event) => void handleReturnSubmit(event)}>
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
          {modalError ? <InlineNotice tone="error">{modalError}</InlineNotice> : null}
          <div className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={closeAllModals}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmitting}>{isSubmitting ? 'Procesando...' : 'Registrar devolución'}</button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog open={isNotReturnedModalOpen} title="Marcar no devuelto" onClose={closeAllModals} size="wide">
        <form className="modal-dialog__form" onSubmit={(event) => void handleNotReturnedSubmit(event)}>
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
          {modalError ? <InlineNotice tone="error">{modalError}</InlineNotice> : null}
          <div className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={closeAllModals}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmitting}>{isSubmitting ? 'Procesando...' : 'Confirmar no devolución'}</button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog open={isEnrollmentStatusOpen} title="Cambiar estado del alta" onClose={closeAllModals} size="wide">
        <form className="modal-dialog__form" onSubmit={(event) => void handleEnrollmentStatusSubmit(event)}>
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
          {modalError ? <InlineNotice tone="error">{modalError}</InlineNotice> : null}
          <div className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={closeAllModals}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmitting}>{isSubmitting ? 'Actualizando...' : 'Aplicar cambio'}</button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog open={isOffboardOpen} title="Dar de baja accesos" onClose={closeAllModals} size="wide">
        <form className="modal-dialog__form" onSubmit={(event) => void handleOffboardSubmit(event)}>
          <div className="modal-dialog__grid">
            <label className="modal-dialog__field">
              <span>Resolución del medio</span>
              <FilterSelect
                id="access-offboard-resolution"
                name="access_offboard_resolution"
                label="Resolución del medio"
                variant="field"
                showLabel={false}
                value={offboardForm.media_resolution}
                options={[
                  { key: 'returned', label: 'Devuelto' },
                  { key: 'not_returned', label: 'No devuelto' }
                ]}
                onChange={(value) => setOffboardForm((current) => ({ ...current, media_resolution: value }))}
                placeholder="Selecciona una resolución"
                disabled={!offboardHasActiveAssignments}
                ariaDescribedBy={getFieldDescribedBy('access-offboard-resolution', 'access-offboard-resolution-help')}
                invalid={Boolean(getFieldError('access-offboard-resolution'))}
              />
              <p id="access-offboard-resolution-help" className="modal-dialog__field-help">
                {offboardHasActiveAssignments
                  ? offboardForm.media_resolution === 'not_returned'
                    ? 'Se cerraran las asignaciones activas como no devueltas y las altas vigentes quedaran desactivadas.'
                    : 'Se cerraran las asignaciones activas como devueltas, las altas vigentes quedaran desactivadas y el medio volvera a la ubicacion seleccionada.'
                  : 'Este colaborador no tiene medios activos. La baja solo desactivara altas vigentes y registrara el evento.'}
              </p>
              {renderFieldError('access-offboard-resolution')}
            </label>
            <label className="modal-dialog__field" htmlFor="access-offboarded-at">
              <span>Fecha de baja</span>
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
            <label className="modal-dialog__field modal-dialog__field--full" htmlFor="access-offboard-notes">
              <span>Notas</span>
              <textarea
                id="access-offboard-notes"
                name="access_offboard_notes"
                value={offboardForm.notes}
                onChange={(event) => setOffboardForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Describe el contexto de la baja operativa"
              />
            </label>
          </div>
          {modalError ? <InlineNotice tone="error">{modalError}</InlineNotice> : null}
          <div className="modal-dialog__actions">
            <button type="button" className="workspace-action workspace-action--ghost" onClick={closeAllModals}>Cancelar</button>
            <button type="submit" className="workspace-action workspace-action--primary" disabled={isSubmitting}>{isSubmitting ? 'Procesando...' : 'Confirmar baja'}</button>
          </div>
        </form>
      </ModalDialog>
    </section>
  );
};

export default AccessPage;
