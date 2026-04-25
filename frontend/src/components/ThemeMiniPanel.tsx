// frontend/src/components/ThemeMiniPanel.tsx
import { useEffect, useState } from "react";
import {
  Theme,
  DEFAULT_THEME,
  loadTheme,
  saveTheme,
  applyThemeToCssVars,
} from "../theme/theme";

export default function ThemeMiniPanel() {
  const [open, setOpen] = useState(false);

  // ✅ Inicializa el tema DIRECTO (sin useEffect)
  const [theme, setTheme] = useState<Theme>(() => loadTheme());

  // ✅ Aplica el tema a CSS vars cada vez que cambie theme (sin setState aquí)
  useEffect(() => {
    applyThemeToCssVars(theme);
  }, [theme]);

  const update = (key: keyof Theme, value: string) => {
    const next: Theme = { ...theme, [key]: value };
    setTheme(next);
    saveTheme(next);
    // applyThemeToCssVars(next); // opcional: ya lo hace el useEffect
  };

  const restore = () => {
    setTheme(DEFAULT_THEME);
    saveTheme(DEFAULT_THEME);
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-[9999] w-12 h-12 rounded-full bg-black text-white shadow-lg"
        title="Cambiar colores"
      >
        🎨
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-[9999] w-72 rounded-xl bg-[#050816] border border-gray-800 p-4 text-white shadow-2xl">
          <h3 className="font-bold mb-3 text-sm">Tema Crisálida</h3>

          <Color label="Fondo" value={theme.bg} onChange={(v) => update("bg", v)} />
          <Color label="Paneles" value={theme.panel} onChange={(v) => update("panel", v)} />
          <Color label="Texto" value={theme.text} onChange={(v) => update("text", v)} />
          <Color label="Muted" value={theme.muted} onChange={(v) => update("muted", v)} />
          <Color label="Soft" value={theme.soft} onChange={(v) => update("soft", v)} />
          <Color label="Acento" value={theme.accent} onChange={(v) => update("accent", v)} />

          <button
            type="button"
            onClick={restore}
            className="mt-3 w-full text-xs py-2 rounded bg-white/10 hover:bg-white/20"
          >
            Restaurar colores
          </button>
        </div>
      )}
    </>
  );
}

function Color({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between text-xs mb-2 gap-2">
      <span>{label}</span>
      <input
        type="color"
        value={safeHex(value)}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-6 border-none bg-transparent cursor-pointer"
      />
    </label>
  );
}

// ✅ Si el color no es hex (#...), pon blanco para que el input no explote
function safeHex(v: string) {
  return typeof v === "string" && v.startsWith("#") ? v : "#ffffff";
}
