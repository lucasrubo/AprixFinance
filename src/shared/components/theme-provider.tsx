"use client";

import { useEffect } from "react";

export function ThemeProvider() {
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const theme = savedTheme || (prefersDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", theme === "dark");
    } catch (e) {
      // Fallback para tema claro se houver erro
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return null;
}
