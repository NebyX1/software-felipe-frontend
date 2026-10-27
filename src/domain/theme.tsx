import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppTheme = "neon" | "celestial";

interface ThemeContextValue {
  theme: AppTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "lavalleja-dashboard-theme";

function savedTheme(): AppTheme {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "celestial"
      ? "celestial"
      : "neon";
  } catch {
    return "neon";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(savedTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The current session still keeps its selection if storage is unavailable.
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () =>
        setTheme((current) => (current === "neon" ? "celestial" : "neon")),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div className="theme-root" data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return context;
}
