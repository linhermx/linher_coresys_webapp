import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth.js';
import { getFocusableElements, trapFocusInContainer } from '../../utils/focusTrap.js';
import { filterNavigationGroupsByAccess, navigationGroups } from '../../utils/appNavigation.js';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';

export const AppShell = () => {
  const location = useLocation();
  const { authUser } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const sidebarTriggerRef = useRef(null);
  const wasMobileSidebarOpenRef = useRef(false);
  const sidebarId = 'app-sidebar';
  const visibleNavigationGroups = useMemo(
    () => filterNavigationGroupsByAccess(navigationGroups, authUser),
    [authUser]
  );

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      if (wasMobileSidebarOpenRef.current) {
        sidebarTriggerRef.current?.focus?.();
      }
      wasMobileSidebarOpenRef.current = false;
      return undefined;
    }

    wasMobileSidebarOpenRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      const currentLink = sidebarRef.current?.querySelector('.sidebar__link--active');
      const fallbackTarget = getFocusableElements(sidebarRef.current)[0] || sidebarRef.current;
      (currentLink || fallbackTarget)?.focus?.();
    });

    return () => window.cancelAnimationFrame(frame);
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

  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  return (
    <div className="shell">
      <button
        type="button"
        className={`shell__backdrop${isMobileSidebarOpen ? ' shell__backdrop--visible' : ''}`}
        aria-hidden="true"
        onClick={closeMobileSidebar}
        tabIndex={-1}
      />

      <Sidebar
        currentPath={location.pathname}
        isMobileOpen={isMobileSidebarOpen}
        navigationGroups={visibleNavigationGroups}
        onNavigate={closeMobileSidebar}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeMobileSidebar();
            return;
          }

          trapFocusInContainer(event, sidebarRef.current);
        }}
        sidebarId={sidebarId}
        sidebarRef={sidebarRef}
      />

      <div className="shell__main">
        <Topbar
          isSidebarOpen={isMobileSidebarOpen}
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          sidebarId={sidebarId}
          sidebarTriggerRef={sidebarTriggerRef}
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
