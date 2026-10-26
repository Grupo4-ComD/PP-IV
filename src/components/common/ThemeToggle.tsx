"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 animate-pulse ${className}`}
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center gap-1.5 p-1.5 sm:px-2 sm:py-1.5 rounded-xl border transition-all duration-200 cursor-pointer select-none active:scale-95 ${
        isDark
          ? "bg-slate-900/90 hover:bg-slate-800 text-amber-400 border-slate-700 shadow-sm"
          : "bg-white hover:bg-slate-100 text-indigo-600 border-slate-200 shadow-sm"
      } ${className}`}
      title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
      aria-label={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
    >
      <div className="w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform duration-300 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 transition-transform duration-300 hover:-rotate-12" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {isDark ? "Modo Claro" : "Modo Oscuro"}
        </span>
      )}
    </button>
  );
}
