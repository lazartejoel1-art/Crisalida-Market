// src/theme/ThemePanel.tsx
import { useState } from "react";
import type { Theme } from "./theme";

export default function ThemePanel({
  theme,
  setTheme,
  reset,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  reset: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-12 rounded-full shadow-lg border border-white/10 bg-black/60 backdrop-blur flex items-center justify-center"
        aria-label="Abrir panel de colores"
        title="Colores"
      >
        🎨
      </button>

      {/* Panel */}
      {open && (
        <div className="mt-3 w-[280px] rounded-2xl border border-white/10 bg-black/70 backdrop-blur p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-white">Colores (Crisálida)</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {/* Fondo */}
          <div className="flex items-center justify-between gap-3 py-2">
            <div>
              <p className="text-xs text-white/80">Fondo</p>
              <p className="text-[11px] text-white/50">{theme.bg}</p>
            </div>
            <input
              type="color"
              value={theme.bg}
              onChange={(e) => setTheme({ ...theme, bg: e.target.value })}
              className="w-12 h-10 p-0 border-0 bg-transparent"
              title="Cambiar fondo"
            />
          </div>

          {/* Panel */}
          <div className="flex items-center justify-between gap-3 py-2">
            <div>
              <p className="text-xs text-white/80">Panel</p>
              <p className="text-[11px] text-white/50">{theme.panel}</p>
            </div>
            <input
              type="color"
              value={theme.panel}
              onChange={(e) => setTheme({ ...theme, panel: e.target.value })}
              className="w-12 h-10 p-0 border-0 bg-transparent"
              title="Cambiar panel"
            />
          </div>

          {/* Acento */}
          <div className="flex items-center justify-between gap-3 py-2">
            <div>
              <p className="text-xs text-white/80">Acento (verde)</p>
              <p className="text-[11px] text-white/50">{theme.accent}</p>
            </div>
            <input
              type="color"
              value={theme.accent}
              onChange={(e) => setTheme({ ...theme, accent: e.target.value })}
              className="w-12 h-10 p-0 border-0 bg-transparent"
              title="Cambiar acento"
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold border border-white/10 text-white/90 hover:bg-white/10"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:opacity-90"
            >
              Listo
            </button>
          </div>

          <p className="mt-3 text-[11px] text-white/55">
            Se guarda automático (localStorage).
          </p>
        </div>
      )}
    </div>
  );
}
