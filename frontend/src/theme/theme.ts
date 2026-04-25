// src/theme/theme.ts
export type Theme = {
  bg: string;
  panel: string;
  border: string;
  text: string;
  muted: string;
  soft: string;
  accent: string;
};

export const DEFAULT_THEME: Theme = {
  bg: "#0b0f1a",
  panel: "#050816",
  border: "rgba(255,255,255,0.10)",
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.55)",
  soft: "rgba(255,255,255,0.08)",
  accent: "#21c55d",
};

export const THEME_STORAGE_KEY = "crisalida_theme_v1";

export function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw) as Partial<Theme>;
    return { ...DEFAULT_THEME, ...parsed };
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(t: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(t));
}

export function applyThemeToCssVars(t: Theme) {
  const root = document.documentElement;
  root.style.setProperty("--c-bg", t.bg);
  root.style.setProperty("--c-panel", t.panel);
  root.style.setProperty("--c-border", t.border);
  root.style.setProperty("--c-text", t.text);
  root.style.setProperty("--c-muted", t.muted);
  root.style.setProperty("--c-soft", t.soft);
  root.style.setProperty("--c-accent", t.accent);
}
