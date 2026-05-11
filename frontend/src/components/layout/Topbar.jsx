import { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Bell, ChevronDown, LogOut, Menu, Search } from 'lucide-react';

import { useAuth } from '../../hooks/useAuth.js';
import { ThemeToggle } from '../primitives/ThemeToggle.jsx';

const getInitials = (fullName) => (
  String(fullName || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '??'
);

export const Topbar = ({ isSidebarOpen, onOpenSidebar, sidebarId, sidebarTriggerRef }) => {
  const { authUser, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogoutSubmitting, setIsLogoutSubmitting] = useState(false);
  const profilePanelRef = useRef(null);
  const profileTriggerRef = useRef(null);
  const logoutActionRef = useRef(null);
  const generatedId = useId().replace(/:/g, '');
  const profilePanelId = `topbar-profile-panel-${generatedId}`;
  const displayName = String(authUser?.name || '').trim() || 'Usuario';
  const displayEmail = String(authUser?.email || '').trim() || 'Cuenta activa';

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      logoutActionRef.current?.focus?.();
    });

    const handlePointerDown = (event) => {
      if (!profilePanelRef.current || profilePanelRef.current.contains(event.target) || profileTriggerRef.current?.contains(event.target)) {
        return;
      }

      setIsProfileMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsProfileMenuOpen(false);
        profileTriggerRef.current?.focus?.();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileMenuOpen]);

  const handleLogout = async () => {
    setIsLogoutSubmitting(true);
    try {
      await logout();
    } finally {
      setIsLogoutSubmitting(false);
      setIsProfileMenuOpen(false);
    }
  };

  return (
    <header className="topbar" aria-label="Barra de utilidades">
      <div className="topbar__leading">
        <button
          type="button"
          className="icon-button topbar__menu-button"
          onClick={onOpenSidebar}
          aria-controls={sidebarId}
          aria-expanded={isSidebarOpen}
          aria-label={isSidebarOpen ? 'Cerrar navegación' : 'Abrir navegación'}
          ref={sidebarTriggerRef}
        >
          <Menu size={18} aria-hidden="true" />
        </button>
      </div>

      <label className="topbar__search topbar__search--mock" htmlFor="global-search">
        <Search className="topbar__search-icon" size={16} aria-hidden="true" />
        <span className="sr-only">Búsqueda global</span>
        <input
          className="topbar__search-input"
          id="global-search"
          name="global_search"
          type="search"
          placeholder="Búsqueda global"
          autoComplete="off"
          disabled
          spellCheck="false"
        />
      </label>

      <div className="topbar__actions">
        <button
          type="button"
          className="icon-button topbar__action-button topbar__action-button--mock"
          aria-label="Ver notificaciones"
          title="Notificaciones"
          disabled
        >
          <Bell size={18} aria-hidden="true" />
        </button>

        <ThemeToggle className="topbar__theme-button" />

        <div className="topbar__profile-wrap">
          <button
            type="button"
            className="topbar__profile"
            aria-controls={profilePanelId}
            aria-expanded={isProfileMenuOpen}
            aria-label={isProfileMenuOpen ? 'Cerrar opciones de cuenta' : 'Abrir opciones de cuenta'}
            title="Cuenta"
            onClick={() => setIsProfileMenuOpen((currentState) => !currentState)}
            ref={profileTriggerRef}
          >
            <span className="topbar__profile-avatar" aria-hidden="true">{getInitials(displayName)}</span>
            <span className="topbar__profile-name">{displayName}</span>
            <ChevronDown className="topbar__profile-chevron" size={16} aria-hidden="true" />
          </button>

          {isProfileMenuOpen ? (
            <div
              id={profilePanelId}
              className="topbar__profile-menu"
              ref={profilePanelRef}
            >
              <div className="topbar__profile-menu-head">
                <strong className="topbar__profile-menu-name">{displayName}</strong>
                <span className="topbar__profile-menu-email">{displayEmail}</span>
              </div>
              <button
                type="button"
                className="topbar__profile-menu-action"
                onClick={handleLogout}
                disabled={isLogoutSubmitting}
                ref={logoutActionRef}
              >
                <LogOut size={16} aria-hidden="true" />
                <span>{isLogoutSubmitting ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

Topbar.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  onOpenSidebar: PropTypes.func.isRequired,
  sidebarId: PropTypes.string.isRequired,
  sidebarTriggerRef: PropTypes.shape({ current: PropTypes.any }).isRequired
};
