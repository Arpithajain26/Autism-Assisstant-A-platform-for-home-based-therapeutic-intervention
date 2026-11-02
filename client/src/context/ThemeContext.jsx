import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") {
        return saved;
      }
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
    } catch (e) {
      console.warn("Could not read theme preference:", e);
    }
    return "light";
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      root.setAttribute("data-theme", theme);
      document.body.setAttribute("data-theme", theme);

      if (theme === "dark") {
        root.classList.add("dark");
        document.body.classList.add("dark");
      } else {
        root.classList.remove("dark");
        document.body.classList.remove("dark");
      }

      localStorage.setItem("theme", theme);
    } catch (e) {
      console.warn("Could not save theme:", e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === "dark",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}
