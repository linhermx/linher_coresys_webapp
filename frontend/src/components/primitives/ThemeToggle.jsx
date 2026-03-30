import { useTheme } from "../../context/ThemeContext.jsx";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Cambiar a modo ${theme === "light" ? "oscuro" : "claro"}`}
    >
      <span className={`theme-toggle__option ${theme === "light" ? "is-active" : ""}`}>
        Claro
      </span>
      <span className={`theme-toggle__option ${theme === "dark" ? "is-active" : ""}`}>
        Oscuro
      </span>
    </button>
  );
}

export default ThemeToggle;
