import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type NavItem = { label: string; to: string };

type CartItem = {
  id: number;
  cantidad: number;
};

const NAV: NavItem[] = [
  { label: "Inicio", to: "/" },
  { label: "Tienda", to: "/tienda" },
  { label: "Galería", to: "/museo" },
  { label: "Carrito", to: "/carrito" },
  { label: "Artistas", to: "/artistas" },
  { label: "Contacto", to: "/contacto" },
  { label: "Admin", to: "/admin/login" },
];

const CART_KEY = "crisalida_cart";

function readCartCount() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];

    if (!Array.isArray(parsed)) return 0;

    return parsed.reduce(
      (acc, item) => acc + Number(item.cantidad ?? 0),
      0
    );
  } catch {
    return 0;
  }
}

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
  const [cartCount, setCartCount] = useState(() => readCartCount());

  // ESC para cerrar menú
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Actualizar carrito
  useEffect(() => {
    const updateCart = () => {
      setCartCount(readCartCount());
    };

    window.addEventListener("storage", updateCart);
    window.addEventListener("crisalida_cart_updated", updateCart);

    return () => {
      window.removeEventListener("storage", updateCart);
      window.removeEventListener("crisalida_cart_updated", updateCart);
    };
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
          {/* Botón menú */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-md"
            aria-label="Abrir menú"
          >
            <span className="text-2xl">☰</span>
          </button>

          {/* Logo */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
          >
            <img
              src={logoSrc}
              alt="Logo"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="font-extrabold">{title}</span>
          </Link>

          {/* Carrito */}
          <Link
            to={cartTo}
            className="relative w-10 h-10 flex items-center justify-center"
          >
            <span className="text-xl">🛒</span>

            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-verdeEsmeralda text-black text-[11px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Menú lateral */}
      {open && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          <aside
            className="absolute left-0 top-0 h-full w-[280px] border-r p-5"
            style={{
              background: "var(--c-panel)",
              borderColor: "var(--c-border)",
            }}
          >
            <div className="flex justify-between items-center mb-5">
              <span className="font-bold">{title}</span>

              <button onClick={() => setOpen(false)}>✕</button>
            </div>

            <nav className="space-y-2">
              {NAV.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-lg"
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