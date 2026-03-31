import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import ThemeToggle from "../primitives/ThemeToggle.jsx";

function Topbar({ currentModule, isSidebarCollapsed, onSidebarToggle }) {
  const SidebarToggleIcon = isSidebarCollapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <header className="topbar">
      <div className="topbar__content">
        <div className="topbar__main-row">
          <div className="topbar__meta">
            <button
              className="icon-button topbar__menu-button"
              type="button"
              onClick={onSidebarToggle}
              aria-label={
                isSidebarCollapsed
                  ? "Mostrar panel lateral"
                  : "Ocultar panel lateral"
              }
            >
              <SidebarToggleIcon size={17} strokeWidth={1.9} />
            </button>

            <h1 className="topbar__title">{currentModule.label}</h1>
          </div>

          <div className="topbar__actions">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
