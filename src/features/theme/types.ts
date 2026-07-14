import { ReactNode } from "react";

export type ThemeType = "light" | "dark";

export type ThemeContextType = {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  removeTheme: () => void;
  isLightMode: boolean;
};

export type ThemeProviderPropTypes = {
  children: ReactNode;
};
