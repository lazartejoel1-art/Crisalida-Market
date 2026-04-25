import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

type NavItem = { label: string; to: string };

const NAV: NavItem[] = [
  { label: "Inicio", to: "/" },
  { label: "Tienda", to: "/tienda" },
  { label: "Museo", to: "/museo" },
  { label: "Carrito", to: "/carrito" },
  { label: "Artistas", to: "/artistas" },
  { label: "Contacto", to: "/contacto" },
  { label: "Admin", to: "/admin/login" },
];

export default function Navbar({
  title = "Crisálida",
  logoSrc = "/uploads/crisalida.png",
  cartTo = "/carrito",
}: {
  title?: string;
  logoSrc?: string;
  cartTo?: string;
}) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // ✅ cerrar al cambiar de ruta (evita warning de eslint: lo hacemos solo si está abierto)
  useEffect(() => {
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ✅ cerrar con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "var(--c-topbar-bg)",
          borderColor: "var(--c-topbar-border)",
          color: "var(--c-topbar-text)",
        }}
      >
        <div className="h-14 px-4 flex items-center justify-between relative">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-md"
            style={{ background: "transparent" }}
            aria-label="Abrir menú"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--c-topbar-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <span className="text-2xl leading-none">☰</span>
          </button>

          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
            aria-label="Ir a inicio"
          >
            <img
              src={logoSrc}
              alt="Logo Crisálida"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="font-extrabold">{title}</span>
          </Link>

          <Link
            to={cartTo}
            className="w-10 h-10 flex items-center justify-center rounded-md"
            aria-label="Ver carrito"
            title="Carrito"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "var(--c-topbar-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "transparent";
            }}
          >
            <span className="text-xl">🛒</span>
          </Link>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          />

          <aside
            className="absolute left-0 top-0 h-full w-[280px] border-r p-5"
            style={{
              background: "var(--c-panel)",
              borderColor: "var(--c-border)",
              color: "var(--c-text)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <img
                  src={logoSrc}
                  alt="Logo Crisálida"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold leading-tight">{title}</p>
                  <p className="text-xs" style={{ color: "var(--c-muted)" }}>
                    Menú
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xl"
                style={{ color: "var(--c-muted)" }}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <nav className="space-y-2">
              {NAV.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  className="block px-3 py-2 rounded-lg"
                  style={{ color: "var(--c-text)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "rgba(255,255,255,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "transparent";
                  }}
                >
                  {it.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
              