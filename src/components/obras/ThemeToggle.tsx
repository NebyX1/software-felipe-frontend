import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "../../domain/theme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "neon" ? "celestial" : "neon";

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={`Cambiar al modo ${nextTheme === "neon" ? "nocturno neón" : "diurno celestial"}`}
      aria-pressed={theme === "celestial"}
      title={`Cambiar al modo ${nextTheme === "neon" ? "nocturno neón" : "diurno celestial"}`}
    >
      {theme === "neon" ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
      <span>{theme === "neon" ? "Día celestial" : "Noche neón"}</span>
    </button>
  );
}
