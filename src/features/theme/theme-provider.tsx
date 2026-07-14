/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";

import { ThemeContextType, ThemeProviderPropTypes, ThemeType } from "./types";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function applyTheme(theme: ThemeType) {
  const root = window.document.documentElement;

  root.classList.remove("light", "dark");

  const effectiveTheme = theme === "light" ? "light" : "dark";

  root.classList.add(effectiveTheme);
}

export const ThemeProvider = ({ children }: ThemeProviderPropTypes) => {
  const [theme, setTheme, removeTheme] = useLocalStorage<ThemeType>("theme", "light");
  const isLightMode = theme === "light";

  useEffect(() => {
    applyTheme(theme as ThemeType);
  }, [theme]);

  const setThemeAndPersist = (newTheme: ThemeType) => {
    setTheme(newTheme);
  };

  const contextValue: ThemeContextType = {
    theme,
    setTheme: setThemeAndPersist,
    removeTheme,
    isLightMode,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export { ThemeContext };

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
