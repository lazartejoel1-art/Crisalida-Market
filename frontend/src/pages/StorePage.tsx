import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buildImageUrl, fetchObras } from "../services/api";

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

function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  return buildImageUrl(imagePath);
}

function toPrice(value: number | string) {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

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
  return readCart().reduce((acc, it) => acc + Number(it.cantidad ?? 0), 0);
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("crisalida_cart_updated"));
}

function Shell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={undefined} className={`w-full px-4 sm:px-6 lg:px-10 2xl:px-16 ${className}`}>
      <div className="mx-auto w-full max-w-[1480px]">{children}</div>
    </section>
  );
}

function WorkImage({ src, title }: { src: string | null; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full aspect-[4/5] flex items-center justify-center bg-neutral-100 text-sm text-neutral-400">
        Sin imagen
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/5] overflow-hidden bg-neutral-100">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-neutral-200" />
      )}

      <img
        src={src}
        alt={title}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`block h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.045] ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        draggable={false}
      />

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/25 via-transparent to-transparent" />

      <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80 backdrop-blur pointer-events-none">
        Crisálida
      </div>
    </div>
  );
}

export default function StorePage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState<number>(() => readCartCount());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todos" | "disponibles" | "agotados">(
    "todos",
  );

  const loadWorks = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchObras();
      setWorks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la tienda.");
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

  const filteredWorks = useMemo(() => {
    const q = query.trim().toLowerCase();

    return works.filter((w) => {
      const matchesQuery =
        !q ||
        w.titulo.toLowerCase().includes(q) ||
        (w.descripcion || "").toLowerCase().includes(q) ||
        (w.artista?.nombre || "").toLowerCase().includes(q);

      const matchesFilter =
        filter === "todos" ||
        (filter === "disponibles" && Number(w.stock ?? 0) > 0) ||
        (filter === "agotados" && Number(w.stock ?? 0) <= 0);

      return matchesQuery && matchesFilter;
    });
  }, [works, query, filter]);

  const featuredWork = useMemo(() => {
    return works.find((w) => getImageUrl(w.imagenUrl || w.imagen)) || works[0];
  }, [works]);

  const addToCart = (w: Work) => {
    const safePrice = toPrice(w.precio);
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

    window.setTimeout(() => {
      setToast(null);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f5f5] text-neutral-950">
        <Shell className="py-10">
          <div className="rounded-[34px] border border-neutral-200 bg-white p-8 shadow-sm">
            <p className="text-sm animate-pulse text-neutral-500">
              Cargando tienda...
            </p>
          </div>
        </Shell>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4f5f5] text-neutral-950">
        <Shell className="py-10">
          <div className="rounded-[34px] border border-neutral-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold text-red-500">{error}</p>

            <button
              type="button"
              onClick={() => void loadWorks()}
              className="mt-4 rounded-full bg-neutral-950 px-5 py-3 text-sm font-black text-white hover:bg-emerald-600 transition"
            >
              Reintentar
            </button>
          </div>
        </Shell>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f5] text-neutral-950">
      <Shell className="pt-6 pb-10">
        <div className="relative overflow-hidden rounded-[38px] bg-neutral-950 text-white shadow-sm">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:p-10">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
                Crisálida Market
              </p>

              <h1 className="mt-4 max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tight">
                Tienda de arte contemporáneo
              </h1>

              <p className="mt-5 max-w-2xl text-sm sm:text-base text-white/65">
                Explora obras originales, prints y piezas disponibles de la
                Colectiva Crisálida. Una tienda visual, limpia y pensada para
                coleccionar arte.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <a
                  href="#catalogo"
                  className="rounded-full bg-white px-6 py-4 text-center text-sm font-black text-neutral-950 hover:bg-emerald-400 transition"
                >
                  Ver catálogo
                </a>

                <Link
                  to="/carrito"
                  className="rounded-full border border-white/25 px-6 py-4 text-center text-sm font-black text-white hover:bg-white hover:text-neutral-950 transition"
                >
                  Ver carrito ({cartCount})
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/10 backdrop-blur">
                {featuredWork ? (
                  <>
                    <div className="relative aspect-[4/5] bg-black/20">
                      <WorkImage
                        src={getImageUrl(featuredWork.imagenUrl || featuredWork.imagen)}
                        title={featuredWork.titulo}
                      />

                      <div className="absolute left-4 top-4 rounded-full bg-white px-4 py-2 text-xs font-black text-neutral-950">
                        Destacado
                      </div>
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                        {featuredWork.artista?.nombre ?? "Artista Crisálida"}
                      </p>

                      <h2 className="mt-2 text-2xl font-black text-white line-clamp-2">
                        {featuredWork.titulo}
                      </h2>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        <p className="text-2xl font-black text-white">
                          {toPrice(featuredWork.precio).toFixed(2)} Bs
                        </p>

                        <Link
                          to={`/obra/${featuredWork.id}`}
                          className="rounded-full bg-white px-5 py-3 text-sm font-black text-neutral-950 hover:bg-emerald-400 transition"
                        >
                          Ver obra
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-sm text-white/60">
                    No hay obra destacada.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Shell>

      <Shell className="pb-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Obras originales", "Piezas únicas disponibles"],
            ["Prints y encargos", "Consulta disponibilidad"],
            ["Compra segura", "Carrito local y pedido simple"],
            ["Arte boliviano", "Creado por artistas de Crisálida"],
          ].map(([title, text]) => (
            <div
              key={title}
              className="rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <p className="text-base font-black text-neutral-950">{title}</p>
              <p className="mt-1 text-sm text-neutral-500">{text}</p>
            </div>
          ))}
        </div>
      </Shell>

      <Shell className="pb-10">
        <div className="rounded-[34px] border border-neutral-200 bg-white p-5 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                Catálogo
              </p>

              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-neutral-950">
                Obras disponibles
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                Busca, filtra y agrega tus piezas favoritas al carrito.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full lg:w-[360px] rounded-full border border-neutral-300 bg-neutral-50 px-5 py-4 text-sm text-neutral-950 outline-none focus:border-neutral-950"
                placeholder="Buscar por obra, artista o técnica..."
              />

              <Link
                to="/carrito"
                className="relative rounded-full bg-neutral-950 px-6 py-4 text-center text-sm font-black text-white hover:bg-emerald-600 transition whitespace-nowrap"
              >
                Carrito ({cartCount})
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { label: "Todos", value: "todos" as const },
              { label: "Disponibles", value: "disponibles" as const },
              { label: "Agotados", value: "agotados" as const },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-full px-5 py-2.5 text-sm font-black transition ${
                  filter === item.value
                    ? "bg-neutral-950 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => void loadWorks()}
              className="rounded-full px-5 py-2.5 text-sm font-black bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
            >
              Actualizar
            </button>
          </div>
        </div>
      </Shell>

      <Shell data-id="catalogo" className="pb-16">
        {works.length === 0 ? (
          <div className="rounded-[34px] border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
            Todavía no hay obras disponibles.
          </div>
        ) : filteredWorks.length === 0 ? (
          <div className="rounded-[34px] border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
            No se encontraron obras con ese filtro.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredWorks.map((w) => {
              const safePrice = toPrice(w.precio);
              const imageUrl = getImageUrl(w.imagenUrl || w.imagen);
              const isOutOfStock = Number(w.stock ?? 0) <= 0;

              return (
                <article
                  key={w.id}
                  className="group overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div className="relative">
                    <WorkImage src={imageUrl} title={w.titulo} />

                    <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black text-neutral-950 shadow-sm">
                      Stock: {Number(w.stock ?? 0)}
                    </div>

                    <div className="absolute right-3 top-3 rounded-full bg-black px-3 py-1.5 text-[11px] font-black text-white shadow-sm">
                      Bs {safePrice.toFixed(2)}
                    </div>

                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px]">
                        <span className="rounded-full bg-white px-5 py-3 text-sm font-black text-neutral-950">
                          Sin stock
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex min-h-[260px] flex-col p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700 line-clamp-1">
                      {w.artista?.nombre ?? "Artista Crisálida"}
                    </p>

                    <h3 className="mt-2 text-xl font-black leading-tight text-neutral-950 line-clamp-2">
                      {w.titulo}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-neutral-500 line-clamp-3">
                      {w.descripcion || "Obra disponible en Crisálida Market."}
                    </p>

                    <div className="mt-5 rounded-[22px] bg-neutral-50 p-4">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                            Precio
                          </p>

                          <p className="mt-1 text-2xl font-black text-neutral-950">
                            {safePrice.toFixed(2)} Bs
                          </p>
                        </div>

                        <p
                          className={`rounded-full px-3 py-1 text-[11px] font-black ${
                            isOutOfStock
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isOutOfStock ? "Agotado" : "Disponible"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-5 flex gap-3">
                      <Link
                        to={`/obra/${w.id}`}
                        className="flex-1 rounded-full border border-neutral-300 px-4 py-3 text-center text-sm font-black text-neutral-950 hover:bg-neutral-950 hover:text-white transition"
                      >
                        Ver detalle
                      </Link>

                      <button
                        type="button"
                        onClick={() => addToCart(w)}
                        disabled={isOutOfStock}
                        className="flex-1 rounded-full bg-neutral-950 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
                      >
                        {isOutOfStock ? "Sin stock" : "Agregar"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Shell>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-neutral-200 bg-white px-5 py-3 text-xs font-black text-emerald-700 shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}