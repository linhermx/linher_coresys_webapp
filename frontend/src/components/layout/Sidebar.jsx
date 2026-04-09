import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import logoVerticalNegative from '../../assets/logo-coresys-vertical-negativo.svg';
import logoVerticalPositive from '../../assets/logo-coresys-vertical-positivo.svg';
import { useTheme } from '../../hooks/useTheme.js';

const navigationItemShape = PropTypes.shape({
  path: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired
});

const navigationGroupShape = PropTypes.shape({
  label: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(navigationItemShape).isRequired
});

const toGroupId = (label) => (
  label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
);

export const Sidebar = ({
  currentPath,
  isMobileOpen,
  navigationGroups,
  onNavigate,
  sidebarId
}) => {
  const { theme } = useTheme();
  const brandLogo = theme === 'dark' ? logoVerticalNegative : logoVerticalPositive;

  return (
    <aside
      id={sidebarId}
      className={`sidebar${isMobileOpen ? ' sidebar--open' : ''}`}
      aria-label="Navegación principal del sistema"
    >
      <div className="sidebar__brand">
        <img
          className="sidebar__brand-logo"
          src={brandLogo}
          alt="Coresys"
          width="168"
          height="35"
        />
      </div>

      <nav className="sidebar__nav" aria-label="Módulos principales">
        {navigationGroups.map((group) => {
          const groupId = `sidebar-group-${toGroupId(group.label)}`;

          return (
            <section
              key={group.label}
              className="sidebar__section"
              aria-labelledby={groupId}
            >
              <h2 id={groupId} className="sidebar__section-title">{group.label}</h2>

              <ul className="sidebar__links">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = currentPath === item.path || currentPath.startsWith(`${item.path}/`);

                  return (
                    <li key={item.path} className="sidebar__item">
                      <NavLink
                        to={item.path}
                        className={`sidebar__link${isCurrent ? ' sidebar__link--active' : ''}`}
                        onClick={onNavigate}
                        title={item.label}
                      >
                        <span className="sidebar__link-icon" aria-hidden="true">
                          <Icon size={18} />
                        </span>
                        <span className="sidebar__link-label">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </nav>
    </aside>
  );
};

Sidebar.propTypes = {
  currentPath: PropTypes.string.isRequired,
  isMobileOpen: PropTypes.bool.isRequired,
  navigationGroups: PropTypes.arrayOf(navigationGroupShape).isRequired,
  onNavigate: PropTypes.func.isRequired,
  sidebarId: PropTypes.string.isRequired
};
