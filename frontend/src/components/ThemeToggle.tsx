import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

const THEME_KEY = "crisalida_theme_mode";

function getInitialMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
  } catch {
    return "system";
  }

  return "system";
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const shouldUseDark = mode === "dark" || (mode === "system" && prefersDark);

  root.classList.toggle("dark", shouldUseDark);
  root.style.colorScheme = shouldUseDark ? "dark" : "light";
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => getInitialMode());

  useEffect(() => {
    applyTheme(mode);

    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      // Ignorar error de localStorage
    }
  }, [mode]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const onChange = () => {
      if (mode === "system") applyTheme("system");
    };

    media.addEventListener("change", onChange);

    return () => {
      media.removeEventListener("change", onChange);
    };
  }, [mode]);

  const nextMode = () => {
    setMode((current) => {
      if (current === "system") return "light";
      if (current === "light") return "dark";
      return "system";
    });
  };

  const label =
    mode === "system"
      ? "Auto"
      : mode === "light"
        ? "Claro"
        : "Oscuro";

  const icon = mode === "system" ? "◐" : mode === "light" ? "☀️" : "🌙";

  return (
    <button
      type="button"
      onClick={nextMode}
      className="flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-xs font-black text-white transition hover:bg-white hover:text-black dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white dark:hover:text-black"
      title="Cambiar tema"
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}