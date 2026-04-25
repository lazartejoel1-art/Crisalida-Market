import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Work = {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number | string;
  imagenUrl: string;
  stock: number;
  artista?: {
    id: number;
    nombre: string;
  };
};

type CartItem = {
  id: number;
  titulo: string;
  precio: number;
  cantidad: number;
  imagenUrl: string;
  artistaNombre?: string;
};

function readCartCount() {
  const raw = localStorage.getItem("crisalida_cart");
  if (!raw) return 0;
  try {
    const items = JSON.parse(raw) as CartItem[];
    return items.reduce((acc, it) => acc + (it.cantidad ?? 0), 0);
  } catch {
    return 0;
  }
}

export default function StorePage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState<number>(() => readCartCount());

  const loadWorks = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:3000/obras");
      if (!res.ok) throw new Error("No se pudo cargar la tienda");

      const data = (await res.json()) as Work[];
      setWorks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la tienda. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorks();
  }, []);

  const addToCart = (w: Work) => {
    const rawPrice = w.precio;
    const precioNum =
      typeof rawPrice === "number" ? rawPrice : Number(rawPrice ?? 0);

    const cartRaw = localStorage.getItem("crisalida_cart");
    const cart: CartItem[] = cartRaw ? (JSON.parse(cartRaw) as CartItem[]) : [];

    const idx = cart.findIndex((x) => x.id === w.id);
    if (idx >= 0) {
      cart[idx].cantidad += 1;
    } else {
      cart.push({
        id: w.id,
        titulo: w.titulo,
        precio: precioNum,
        cantidad: 1,
        imagenUrl: w.imagenUrl,
        artistaNombre: w.artista?.nombre,
      });
    }

    localStorage.setItem("crisalida_cart", JSON.stringify(cart));
    setCartCount(readCartCount());

    setToast("Agregado al carrito 🛒");
    window.setTimeout(() => setToast(null), 1500);
  };

  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-sm animate-pulse" style={{ color: "var(--c-muted)" }}>
          Cargando tienda...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-sm mb-3" style={{ color: "#f87171" }}>
          {error}
        </p>
        <button
          onClick={() => void loadWorks()}
          className="text-sm hover:underline"
          style={{ color: "var(--c-accent)" }}
        >
          Reintentar
        </button>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--c-text)" }}>
            🦋 Tienda Crisálida
          </h1>
          <p className="text-sm" style={{ color: "var(--c-muted)" }}>
            Explora las obras disponibles y arma tu colección.
          </p>
        </div>

        <Link
          to="/carrito"
          className="text-sm px-4 py-2 rounded-lg border hover:opacity-95 transition"
          style={{
            borderColor: "var(--c-border)",
            color: "var(--c-text)",
          }}
        >
          Ver carrito ({cartCount})
        </Link>
      </div>

      {/* GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {works.map((w) => {
          const price =
            typeof w.precio === "number"
              ? w.precio
              : Number(w.precio ?? 0);

          return (
            <article
              key={w.id}
              className="rounded-2xl overflow-hidden flex flex-col select-none"
              style={{
                background: "var(--c-panel)",
                border: "1px solid var(--c-border)",
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* IMAGEN PROTEGIDA */}
              <div className="relative h-44">
                {w.imagenUrl ? (
                  <>
                    <img
                      src={w.imagenUrl}
                      alt={w.titulo}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />

                    {/* Overlay protector */}
                    <div className="absolute inset-0 z-10 pointer-events-auto" />

                    {/* Marca de agua */}
                    <div className="absolute bottom-2 right-2 text-[10px] text-white/40 uppercase tracking-widest">
                      Crisálida
                    </div>
                  </>
                ) : (
                  <div
                    className="h-full flex items-center justify-center text-sm"
                    style={{ color: "var(--c-muted)" }}
                  >
                    Sin imagen
                  </div>
                )}
              </div>

              {/* INFO */}
              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold" style={{ color: "var(--c-text)" }}>
                      {w.titulo}
                    </p>
                    <p className="text-xs" style={{ color: "var(--c-accent)" }}>
                      {w.artista?.nombre ?? "Artista Crisálida"}
                    </p>
                  </div>

                  <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>
                    {price.toFixed(2)} Bs
                  </p>
                </div>

                <p className="text-xs line-clamp-3" style={{ color: "var(--c-muted)" }}>
                  {w.descripcion}
                </p>

                <div className="mt-auto flex gap-2">
                  <Link
                    to={`/obra/${w.id}`}
                    className="flex-1 text-center text-xs px-3 py-2 rounded-lg border hover:opacity-95 transition"
                    style={{
                      borderColor: "var(--c-border)",
                      color: "var(--c-text)",
                    }}
                  >
                    Ver detalle
                  </Link>

                  <button
                    onClick={() => addToCart(w)}
                    disabled={w.stock <= 0}
                    className="flex-1 text-xs px-3 py-2 rounded-lg font-semibold hover:opacity-95 transition disabled:opacity-50"
                    style={{
                      background: "var(--c-accent)",
                      color: "#07110a",
                    }}
                  >
                    {w.stock <= 0 ? "Sin stock" : "Agregar"}
                  </button>
                </div>

                <p className="text-[11px]" style={{ color: "var(--c-muted)" }}>
                  Stock: <span style={{ color: "var(--c-text)" }}>{w.stock}</span>
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {/* TOAST */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 text-xs px-4 py-2 rounded-full shadow-lg"
          style={{
            background: "var(--c-panel)",
            border: "1px solid var(--c-border)",
            color: "var(--c-accent)",
          }}
        >
          {toast}
        </div>
      )}
    </section>
  );
}
