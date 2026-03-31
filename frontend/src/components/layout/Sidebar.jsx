import { APP_METADATA, NAVIGATION_ITEMS } from "../../utils/app.js";
import {
  Boxes,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Server,
  Ticket,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const NAVIGATION_GROUPS = [
  {
    title: "Operación",
    items: ["dashboard", "tickets", "services"],
  },
  {
    title: "Infraestructura",
    items: ["inventory", "telephony"],
  },
];

const NAVIGATION_ICONS = {
  dashboard: LayoutDashboard,
  tickets: Ticket,
  inventory: Boxes,
  telephony: Phone,
  services: Server,
};

const getUserInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join("") || "UI";

function Sidebar({ user, isCollapsed, onNavigate, onToggle }) {
  const CollapseIcon = isCollapsed ? PanelLeftOpen : PanelLeftClose;
  const userName = user?.name ?? "Usuario interno";
  const userRole = user?.roleLabel ?? "Administrador IT";
  const userInitials = getUserInitials(userName);

  return (
    <aside className={`sidebar ${isCollapsed ? "is-collapsed" : ""}`}>
      <div className="sidebar__header">
        <NavLink
          to="/dashboard"
          className="sidebar__brand-link"
          aria-label="Ir al panel principal"
          onClick={onNavigate}
        >
          <div className="sidebar__logo-badge" aria-hidden="true">
            CS
          </div>
          {!isCollapsed ? (
            <div className="sidebar__brand-copy">
              <span className="sidebar__brand-product">{APP_METADATA.name}</span>
              <span className="sidebar__brand-signature">por LINHER</span>
            </div>
          ) : null}
        </NavLink>

        <button
          className="sidebar__collapse icon-button"
          type="button"
          onClick={onToggle}
          aria-label={isCollapsed ? "Expandir navegación" : "Colapsar navegación"}
        >
          <CollapseIcon size={16} strokeWidth={1.9} />
        </button>
      </div>

      <nav className="sidebar__nav" aria-label="Navegación principal">
        {NAVIGATION_GROUPS.map((group) => {
          const items = NAVIGATION_ITEMS.filter((item) =>
            group.items.includes(item.key),
          );

          return (
            <section key={group.title} className="sidebar__section">
              {!isCollapsed ? (
                <p className="sidebar__section-title">{group.title}</p>
              ) : null}
              <div className="sidebar__links">
                {items.map((item) => {
                  const ItemIcon = NAVIGATION_ICONS[item.key] ?? LayoutDashboard;

                  return (
                    <NavLink
                      key={item.key}
                      to={item.path}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `sidebar__link ${isActive ? "is-active" : ""}`
                      }
                    >
                      <span className="sidebar__link-icon" aria-hidden="true">
                        <ItemIcon size={18} strokeWidth={1.9} />
                      </span>
                      {!isCollapsed ? (
                        <span className="sidebar__label">{item.label}</span>
                      ) : null}
                    </NavLink>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user-panel">
          <div className="sidebar__user-avatar" aria-hidden="true">
            <span className="sidebar__user-avatar-text">{userInitials}</span>
            <span className="sidebar__user-status-dot" />
          </div>

          {!isCollapsed ? (
            <div className="sidebar__user-meta">
              <span className="sidebar__user-name">{userName}</span>
              <span className="sidebar__user-role">{userRole}</span>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
