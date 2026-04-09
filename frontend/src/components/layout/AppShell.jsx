import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { navigationGroups } from '../../utils/appNavigation.js';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';

export const AppShell = () => {
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const sidebarId = 'app-sidebar';

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 760px)');

    const handleViewportChange = (event) => {
      if (!event.matches) {
        setIsMobileSidebarOpen(false);
      }
    };

    handleViewportChange(mediaQuery);
    mediaQuery.addEventListener('change', handleViewportChange);

    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('body--locked', isMobileSidebarOpen);
    return () => document.body.classList.remove('body--locked');
  }, [isMobileSidebarOpen]);

  return (
    <div className="shell">
      <button
        type="button"
        className={`shell__backdrop${isMobileSidebarOpen ? ' shell__backdrop--visible' : ''}`}
        aria-hidden={!isMobileSidebarOpen}
        aria-label="Cerrar navegación"
        onClick={() => setIsMobileSidebarOpen(false)}
        tabIndex={isMobileSidebarOpen ? 0 : -1}
      />

      <Sidebar
        currentPath={location.pathname}
        isMobileOpen={isMobileSidebarOpen}
        navigationGroups={navigationGroups}
        onNavigate={() => setIsMobileSidebarOpen(false)}
        sidebarId={sidebarId}
      />

      <div className="shell__main">
        <Topbar
          isSidebarOpen={isMobileSidebarOpen}
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          sidebarId={sidebarId}
        />

        <main className="shell__content">
          <div className="content-frame">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
