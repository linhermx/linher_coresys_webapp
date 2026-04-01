import {
  APP_METADATA,
  NAVIGATION_ITEMS,
  NAVIGATION_SECTIONS,
} from "../../utils/app.js";
import {
  Boxes,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Server,
  Ticket,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const NAVIGATION_ICONS = {
  tickets: Ticket,
  inventory: Boxes,
  telephony: Phone,
  services: Server,
  access: KeyRound,
  infrastructure: Network,
};

const ROLE_LABELS = {
  admin: "Administrador",
  admin_systems: "Admin. Systems",
  operator: "Operador",
  requester: "Solicitante",
  viewer: "Solo lectura",
};

const getUserInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join("") || "UI";

const formatRoleLabel = (value = "") => {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (!normalized) {
    return "Administrador";
  }

  if (ROLE_LABELS[normalized]) {
    return ROLE_LABELS[normalized];
  }

  return normalized
    .split("_")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
};

function Sidebar({ user, isCollapsed, onNavigate, onToggle, onLogout }) {
  const CollapseIcon = isCollapsed ? PanelLeftOpen : PanelLeftClose;
  const userName = user?.name ?? "Usuario interno";
  const userRole = formatRoleLabel(user?.roleLabel ?? user?.role_name);
  const userInitials = getUserInitials(userName);

  return (
    <aside className={`sidebar ${isCollapsed ? "is-collapsed" : ""}`}>
      <div className="sidebar__header">
        <NavLink
          to={APP_METADATA.homePath}
          className="sidebar__brand-link"
          aria-label="Ir al módulo principal"
          onClick={onNavigate}
          title={
            isCollapsed
              ? `${APP_METADATA.name}: ${APP_METADATA.description}`
              : undefined
          }
        >
          <div className="sidebar__logo-badge" aria-hidden="true">
            CS
          </div>
          {!isCollapsed ? (
            <div className="sidebar__brand-copy">
              <div className="sidebar__brand-row">
                <span className="sidebar__brand-product">{APP_METADATA.name}</span>
              </div>
              <span className="sidebar__brand-signature">Operación IT</span>
            </div>
          ) : null}
        </NavLink>

        <button
          className="sidebar__collapse"
          type="button"
          onClick={onToggle}
          aria-label={
            isCollapsed ? "Expandir barra lateral" : "Contraer barra lateral"
          }
          aria-controls="sidebar-navigation"
          aria-expanded={!isCollapsed}
          title={isCollapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
        >
          <CollapseIcon size={16} strokeWidth={1.9} />
        </button>
      </div>

      <nav
        id="sidebar-navigation"
        className="sidebar__nav"
        aria-label="Navegación principal"
      >
        {NAVIGATION_SECTIONS.map((group) => {
          const items = NAVIGATION_ITEMS.filter(
            (item) => item.section === group.key,
          );

          if (!items.length) {
            return null;
          }

          return (
            <section key={group.key} className="sidebar__section">
              {!isCollapsed ? (
                <p className="sidebar__section-title">{group.label}</p>
              ) : null}
              <div className="sidebar__links">
                {items.map((item) => {
                  const ItemIcon = NAVIGATION_ICONS[item.key] ?? LayoutDashboard;

                  return (
                    <NavLink
                      key={item.key}
                      to={item.path}
                      onClick={onNavigate}
                      aria-label={isCollapsed ? item.label : undefined}
                      title={
                        isCollapsed
                          ? `${item.label}: ${item.description}`
                          : undefined
                      }
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
        <div
          className="sidebar__user-panel"
          title={isCollapsed ? `${userName}: ${userRole}` : undefined}
        >
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

          <button
            className="sidebar__logout-button icon-button"
            type="button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={16} strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
