import { useEffect, useRef, useState } from 'react';
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

export const Topbar = ({ isSidebarOpen, onOpenSidebar, sidebarId }) => {
  const { authUser, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogoutSubmitting, setIsLogoutSubmitting] = useState(false);
  const profileMenuRef = useRef(null);
  const displayName = String(authUser?.name || '').trim() || 'Usuario';
  const displayEmail = String(authUser?.email || '').trim() || 'Cuenta activa';

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!profileMenuRef.current || profileMenuRef.current.contains(event.target)) {
        return;
      }

      setIsProfileMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
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
        >
          <Menu size={18} />
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
          <Bell size={18} />
        </button>

        <ThemeToggle className="topbar__theme-button" />

        <div className="topbar__profile-wrap" ref={profileMenuRef}>
          <button
            type="button"
            className="topbar__profile"
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="menu"
            aria-label="Abrir menú de cuenta"
            title="Cuenta"
            onClick={() => setIsProfileMenuOpen((currentState) => !currentState)}
          >
            <span className="topbar__profile-avatar" aria-hidden="true">{getInitials(displayName)}</span>
            <span className="topbar__profile-name">{displayName}</span>
            <ChevronDown className="topbar__profile-chevron" size={16} aria-hidden="true" />
          </button>

          {isProfileMenuOpen ? (
            <div className="topbar__profile-menu" role="menu" aria-label="Opciones de cuenta">
              <div className="topbar__profile-menu-head">
                <strong className="topbar__profile-menu-name">{displayName}</strong>
                <span className="topbar__profile-menu-email">{displayEmail}</span>
              </div>
              <button
                type="button"
                className="topbar__profile-menu-action"
                role="menuitem"
                onClick={handleLogout}
                disabled={isLogoutSubmitting}
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
  sidebarId: PropTypes.string.isRequired
};
