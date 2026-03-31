import { APP_METADATA, NAVIGATION_ITEMS } from "../../utils/app.js";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

const getDefaultSidebarState = () =>
  typeof window !== "undefined" ? window.innerWidth < 1024 : false;

const INTERNAL_VIEWS = [
  {
    path: "/system-ui",
    label: "UI del sistema",
    description: "Vista interna para revisar tokens, shell y componentes base.",
  },
];

const SIDEBAR_USER_FALLBACK = {
  name: "Usuario interno",
  roleLabel: "Administrador de Systems",
};

const findCurrentModule = (pathname) =>
  NAVIGATION_ITEMS.find((item) => pathname.startsWith(item.path)) ??
  INTERNAL_VIEWS.find((item) => pathname.startsWith(item.path)) ??
  NAVIGATION_ITEMS[0];

function AppShell() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    getDefaultSidebarState,
  );
  const location = useLocation();
  const currentModule = findCurrentModule(location.pathname);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed((currentValue) => !currentValue);
  };

  const handleSidebarNavigation = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarCollapsed(true);
    }
  };

  return (
    <div className={`app-layout ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        user={SIDEBAR_USER_FALLBACK}
        isCollapsed={isSidebarCollapsed}
        onNavigate={handleSidebarNavigation}
        onToggle={handleSidebarToggle}
      />
      <div className="main-content">
        <Topbar
          currentModule={currentModule}
          isSidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={handleSidebarToggle}
          productName={APP_METADATA.name}
          productStage={APP_METADATA.productStage}
          timezone={APP_METADATA.timezone}
        />
        <main className="page-container">
          <div className="page-shell">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
