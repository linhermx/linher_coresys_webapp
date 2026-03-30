import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Badge from "../primitives/Badge.jsx";
import ThemeToggle from "../primitives/ThemeToggle.jsx";

function Topbar({
  currentModule,
  isSidebarCollapsed,
  onSidebarToggle,
  productName,
  timezone,
}) {
  const SidebarToggleIcon = isSidebarCollapsed
    ? PanelLeftOpen
    : PanelLeftClose;

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
            <div>
              <p className="eyebrow">{productName}</p>
              <h2 className="topbar__title">{currentModule.label}</h2>
              <p className="topbar__subtitle">{currentModule.description}</p>
            </div>
          </div>

          <div className="topbar__actions">
            <Badge tone="neutral">MAP</Badge>
            <Badge tone="info">{timezone}</Badge>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
