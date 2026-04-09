import PropTypes from 'prop-types';
import { MoonStar, SunMedium } from 'lucide-react';

import { useTheme } from '../../hooks/useTheme.js';

export const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isLightTheme = theme === 'light';
  const buttonClassName = ['icon-button', className].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={toggleTheme}
      aria-pressed={!isLightTheme}
      aria-label={isLightTheme ? 'Activar modo oscuro' : 'Activar modo claro'}
      title={isLightTheme ? 'Activar modo oscuro' : 'Activar modo claro'}
    >
      {isLightTheme ? <MoonStar size={18} /> : <SunMedium size={18} />}
    </button>
  );
};

ThemeToggle.propTypes = {
  className: PropTypes.string
};
