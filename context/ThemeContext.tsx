// context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Theme = "dark" | "light";

export const darkTheme = {
  mode: "dark" as Theme,
  BG: "#0F1117",
  CARD: "#1A1D27",
  BORDER: "#2A2D3A",
  TEXT_PRIMARY: "#F0F2FF",
  TEXT_SECONDARY: "#7B7F9E",
  ACCENT: "#6EE7B7",
  ACCENT_BG: "#0D2B22",
  ACCENT_BORDER: "#6EE7B7" + "40",
  LOGOUT_BG: "#1F1212",
  LOGOUT_BORDER: "#3D1F1F",
  LOGOUT_TEXT: "#F87171",
  TOGGLE_TRACK_OFF: "#2A2D3A",
  TOGGLE_THUMB: "#F0F2FF",
};

export const lightTheme = {
  mode: "light" as Theme,
  BG: "#F4F6FB",
  CARD: "#FFFFFF",
  BORDER: "#E2E6F0",
  TEXT_PRIMARY: "#0F1117",
  TEXT_SECONDARY: "#6B7280",
  ACCENT: "#059669",
  ACCENT_BG: "#ECFDF5",
  ACCENT_BORDER: "#059669" + "40",
  LOGOUT_BG: "#FEF2F2",
  LOGOUT_BORDER: "#FECACA",
  LOGOUT_TEXT: "#DC2626",
  TOGGLE_TRACK_OFF: "#E2E6F0",
  TOGGLE_THUMB: "#FFFFFF",
};

export type ThemeColors = typeof darkTheme;

interface ThemeContextValue {
  theme: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeColors>(darkTheme);

  useEffect(() => {
    AsyncStorage.getItem("theme").then((saved) => {
      if (saved === "light") setTheme(lightTheme);
    });
  }, []);

  const toggleTheme = async () => {
    const next = theme.mode === "dark" ? lightTheme : darkTheme;
    setTheme(next);
    await AsyncStorage.setItem("theme", next.mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
