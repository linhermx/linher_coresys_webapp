import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Badge from "../primitives/Badge.jsx";
import ThemeToggle from "../primitives/ThemeToggle.jsx";

const formatTopbarDate = (timezone) =>
  new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeZone: timezone,
  }).format(new Date());

function Topbar({
  currentModule,
  isSidebarCollapsed,
  onSidebarToggle,
  productName,
  productStage,
  timezone,
}) {
  const SidebarToggleIcon = isSidebarCollapsed ? PanelLeftOpen : PanelLeftClose;
  const moduleDescription =
    currentModule?.description ?? "Vista operativa del sistema.";

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

            <div className="topbar__title-block">
              <p className="topbar__eyebrow">{productName}</p>
              <div className="topbar__headline">
                <h1 className="topbar__title">{currentModule.label}</h1>
                <Badge tone="info">{productStage}</Badge>
              </div>
              <p className="topbar__subtitle">{moduleDescription}</p>
            </div>
          </div>

          <div className="topbar__actions">
            <div className="topbar__context" aria-label={`Fecha actual ${formatTopbarDate(timezone)}`}>
              <span className="topbar__context-label">Hoy</span>
              <strong>{formatTopbarDate(timezone)}</strong>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
