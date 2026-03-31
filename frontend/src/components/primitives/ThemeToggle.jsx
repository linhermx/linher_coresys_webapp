import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "light" ? "oscuro" : "claro";

  return (
    <button
      type="button"
      className={`theme-toggle theme-toggle--${theme}`}
      onClick={toggleTheme}
      aria-label={`Tema actual ${theme === "light" ? "claro" : "oscuro"}. Cambiar a modo ${nextTheme}`}
      title={`Cambiar a modo ${nextTheme}`}
    >
      <span className="theme-toggle__thumb" aria-hidden="true" />
      <span
        className={`theme-toggle__option ${theme === "light" ? "is-active" : ""}`}
        aria-hidden="true"
      >
        <Sun size={15} strokeWidth={2} />
      </span>
      <span
        className={`theme-toggle__option ${theme === "dark" ? "is-active" : ""}`}
        aria-hidden="true"
      >
        <Moon size={15} strokeWidth={2} />
      </span>
    </button>
  );
}

export default ThemeToggle;
