import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchObras } from "../services/api"; // Update path if needed: e.g., "./api" or "../../api"

function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  return imagePath.startsWith("http") ? imagePath : `/images/${imagePath}`;
}

type Work = {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number | string;
  imagen?: string | null;
  imagenUrl?: string | null;
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
  imagenUrl: string | null;
  artistaNombre?: string;
};

const CART_KEY = "crisalida_cart";

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readCartCount() {
  const items = readCart();
  return items.reduce((acc, it) => acc + (it.cantidad ?? 0), 0);
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("crisalida_cart_updated"));
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
      const data = await fetchObras();
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

  useEffect(() => {
    const updateCount = () => setCartCount(readCartCount());

    window.addEventListener("storage", updateCount);
    window.addEventListener("crisalida_cart_updated", updateCount);

    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("crisalida_cart_updated", updateCount);
    };
  }, []);

  const addToCart = (w: Work) => {
    const rawPrice = w.precio;
    const precioNum =
      typeof rawPrice === "number" ? rawPrice : Number(rawPrice ?? 0);

    const safePrice = Number.isFinite(precioNum) ? precioNum : 0;
    const imageUrl = getImageUrl(w.imagenUrl || w.imagen);

    const cart = readCart();

    const idx = cart.findIndex((x) => x.id === w.id);

    if (idx >= 0) {
      cart[idx] = {
        ...cart[idx],
        cantidad: cart[idx].cantidad + 1,
      };
    } else {
      cart.push({
        id: w.id,
        titulo: w.titulo,
        precio: safePrice,
        cantidad: 1,
        imagenUrl: imageUrl,
        artistaNombre: w.artista?.nombre,
      });
    }

    saveCart(cart);
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
          type="button"
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
          className="text-sm px-4 py-2 rounded-lg border hover:opacity-95 transition whitespace-nowrap"
          style={{
            borderColor: "var(--c-border)",
            color: "var(--c-text)",
          }}
        >
          Ver carrito ({cartCount})
        </Link>
      </div>

      {works.length === 0 && (
        <div
          className="rounded-2xl p-6 text-center text-sm"
          style={{
            border: "1px dashed var(--c-border)",
            color: "var(--c-muted)",
          }}
        >
          Todavía no hay obras disponibles en la tienda.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {works.map((w) => {
          const price =
            typeof w.precio === "number" ? w.precio : Number(w.precio ?? 0);

          const safePrice = Number.isFinite(price) ? price : 0;
          const imageUrl = getImageUrl(w.imagenUrl || w.imagen);

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
              <div className="relative h-44">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={w.titulo}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />

                    <div className="absolute inset-0 z-10 pointer-events-none" />

                    <div className="absolute bottom-2 right-2 text-[10px] text-white/40 uppercase tracking-widest pointer-events-none">
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
                    {safePrice.toFixed(2)} Bs
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
                    type="button"
                    onClick={() => addToCart(w)}
                    disabled={w.stock <= 0}
                    className="flex-1 text-xs px-3 py-2 rounded-lg font-semibold hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 text-xs px-4 py-2 rounded-full shadow-lg z-50"
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