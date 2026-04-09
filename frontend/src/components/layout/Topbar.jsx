import PropTypes from 'prop-types';
import { Bell, ChevronDown, Menu, Search } from 'lucide-react';

import { ThemeToggle } from '../primitives/ThemeToggle.jsx';

export const Topbar = ({ isSidebarOpen, onOpenSidebar, sidebarId }) => (
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
      <span className="sr-only">Buscar en el sistema</span>
      <input
        id="global-search"
        name="global_search"
        type="search"
        placeholder="Buscar tickets, activos o servicios"
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

      <button
        type="button"
        className="topbar__profile topbar__profile--mock"
        aria-expanded="false"
        aria-haspopup="menu"
        aria-label="Abrir menú de cuenta"
        title="Cuenta"
        disabled
      >
        <span className="topbar__profile-avatar" aria-hidden="true">P</span>
        <span className="topbar__profile-name">Programador</span>
        <ChevronDown className="topbar__profile-chevron" size={16} aria-hidden="true" />
      </button>
    </div>
  </header>
);

Topbar.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  onOpenSidebar: PropTypes.func.isRequired,
  sidebarId: PropTypes.string.isRequired
};
