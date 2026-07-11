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
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`w-full px-4 sm:px-6 lg:px-10 2xl:px-16 ${className}`}
    >
      <div className="mx-auto w-full max-w-[1480px]">{children}</div>
    </section>
  );
}

function WorkImage({ src, title }: { src: string | null; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center bg-neutral-100 text-sm text-neutral-400 dark:bg-white/5 dark:text-white/35">
        Sin imagen
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100 dark:bg-white/5">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-neutral-200 dark:bg-white/10" />
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

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

      <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80 backdrop-blur">
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
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const loadWorks = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchObras();
      setWorks(Array.isArray(data) ? data : []);
      setFeaturedIndex(0);
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

  const featuredWorks = useMemo(() => {
    return works.filter((w) => Boolean(getImageUrl(w.imagenUrl || w.imagen)));
  }, [works]);

  useEffect(() => {
    if (featuredWorks.length <= 1) return;

    const timer = window.setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredWorks.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [featuredWorks.length]);

  const featuredWork = useMemo(() => {
    if (featuredWorks.length > 0) {
      return featuredWorks[Math.min(featuredIndex, featuredWorks.length - 1)];
    }

    return works[0];
  }, [featuredWorks, featuredIndex, works]);

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

  const goToCatalog = () => {
    const catalog = document.getElementById("catalogo");

    if (catalog) {
      catalog.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleOriginales = () => {
    setFilter("disponibles");
    setQuery("");
    window.setTimeout(goToCatalog, 100);
  };

  const handleCompraSegura = () => {
    const catalog = document.getElementById("catalogo");

    if (catalog) {
      catalog.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    setToast("Compra segura: agrega obras al carrito y confirma tu pedido 🛒");

    window.setTimeout(() => {
      setToast(null);
    }, 2200);
  };

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
      <div className="min-h-screen bg-[#f4f5f5] text-neutral-950 dark:bg-neutral-950 dark:text-white">
        <Shell className="py-10">
          <div className="rounded-[34px] border border-neutral-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <p className="text-sm animate-pulse text-neutral-500 dark:text-white/55">
              Cargando tienda...
            </p>
          </div>
        </Shell>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4f5f5] text-neutral-950 dark:bg-neutral-950 dark:text-white">
        <Shell className="py-10">
          <div className="rounded-[34px] border border-neutral-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <p className="text-sm font-semibold text-red-500">{error}</p>

            <button
              type="button"
              onClick={() => void loadWorks()}
              className="mt-4 rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
            >
              Reintentar
            </button>
          </div>
        </Shell>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f5] text-neutral-950 transition-colors duration-300 dark:bg-neutral-950 dark:text-white">
      <Shell className="pt-6 pb-10">
        <div className="relative overflow-hidden rounded-[38px] border border-emerald-200 bg-emerald-50 text-neutral-950 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-white">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-white/70 blur-3xl dark:bg-white/5" />

          <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:p-10">
            <div className="flex flex-col justify-center lg:col-span-7">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
                Crisálida Market
              </p>

              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.98] tracking-tight text-neutral-950 dark:text-white sm:text-5xl lg:text-6xl">
                Tienda de arte contemporáneo
              </h1>

              <p className="mt-5 max-w-2xl text-sm text-neutral-600 dark:text-white/65 sm:text-base">
                Explora obras originales, prints y piezas disponibles de la
                Colectiva Crisálida. Una tienda visual, limpia y pensada para
                coleccionar arte.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={goToCatalog}
                  className="rounded-full bg-emerald-600 px-6 py-4 text-center text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                >
                  Ver catálogo
                </button>

                <Link
                  to="/carrito"
                  className="rounded-full border border-emerald-300 bg-white/60 px-6 py-4 text-center text-sm font-black text-neutral-950 transition hover:bg-white dark:border-emerald-400/30 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Ver carrito ({cartCount})
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-[32px] border border-emerald-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
                {featuredWork ? (
                  <>
                    <div className="relative aspect-[4/5] bg-neutral-100 dark:bg-white/5">
                      <WorkImage
                        src={getImageUrl(
                          featuredWork.imagenUrl || featuredWork.imagen,
                        )}
                        title={featuredWork.titulo}
                      />

                      <div className="absolute left-4 top-4 rounded-full bg-white px-4 py-2 text-xs font-black text-neutral-950 shadow-sm">
                        Destacado
                      </div>

                      {featuredWorks.length > 1 && (
                        <div className="absolute bottom-4 left-4 flex gap-1.5 rounded-full bg-black/35 px-3 py-2 backdrop-blur">
                          {featuredWorks
                            .slice(0, Math.min(featuredWorks.length, 7))
                            .map((w, i) => (
                              <button
                                key={w.id}
                                type="button"
                                onClick={() => setFeaturedIndex(i)}
                                className={`h-1.5 rounded-full transition-all ${
                                  i === featuredIndex
                                    ? "w-7 bg-emerald-400"
                                    : "w-2 bg-white/55"
                                }`}
                                aria-label={`Ver obra destacada ${i + 1}`}
                              />
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                        {featuredWork.artista?.nombre ?? "Artista Crisálida"}
                      </p>

                      <h2 className="mt-2 line-clamp-2 text-2xl font-black text-neutral-950 dark:text-white">
                        {featuredWork.titulo}
                      </h2>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        <p className="text-2xl font-black text-neutral-950 dark:text-white">
                          {toPrice(featuredWork.precio).toFixed(2)} Bs
                        </p>

                        <Link
                          to={`/obra/${featuredWork.id}`}
                          className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                        >
                          Ver obra
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-sm text-neutral-500 dark:text-white/55">
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
          <button
            type="button"
            onClick={handleOriginales}
            className="group text-left rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg dark:border-white/10 dark:bg-neutral-900 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10"
          >
            <p className="text-base font-black text-neutral-950 dark:text-white">
              Obras originales
            </p>

            <p className="mt-1 text-sm text-neutral-500 dark:text-white/55">
              Piezas únicas disponibles
            </p>

            <p className="mt-3 text-xs font-black text-emerald-700 opacity-0 transition group-hover:opacity-100 dark:text-emerald-300">
              Ver disponibles →
            </p>
          </button>

          <Link
            to="/contacto"
            className="group block rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg dark:border-white/10 dark:bg-neutral-900 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10"
          >
            <p className="text-base font-black text-neutral-950 dark:text-white">
              Prints y encargos
            </p>

            <p className="mt-1 text-sm text-neutral-500 dark:text-white/55">
              Consulta disponibilidad
            </p>

            <p className="mt-3 text-xs font-black text-emerald-700 opacity-0 transition group-hover:opacity-100 dark:text-emerald-300">
              Contactar →
            </p>
          </Link>

          <button
            type="button"
            onClick={handleCompraSegura}
            className="group text-left rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg dark:border-white/10 dark:bg-neutral-900 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10"
          >
            <p className="text-base font-black text-neutral-950 dark:text-white">
              Compra segura
            </p>

            <p className="mt-1 text-sm text-neutral-500 dark:text-white/55">
              Carrito local y pedido simple
            </p>

            <p className="mt-3 text-xs font-black text-emerald-700 opacity-0 transition group-hover:opacity-100 dark:text-emerald-300">
              Ver cómo comprar →
            </p>
          </button>

          <Link
            to="/artistas"
            className="group block rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg dark:border-white/10 dark:bg-neutral-900 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10"
          >
            <p className="text-base font-black text-neutral-950 dark:text-white">
              Arte boliviano
            </p>

            <p className="mt-1 text-sm text-neutral-500 dark:text-white/55">
              Creado por artistas de Crisálida
            </p>

            <p className="mt-3 text-xs font-black text-emerald-700 opacity-0 transition group-hover:opacity-100 dark:text-emerald-300">
              Ver artistas →
            </p>
          </Link>
        </div>
      </Shell>

      <Shell className="pb-10">
        <div className="rounded-[34px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                Catálogo
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-3xl">
                Obras disponibles
              </h2>

              <p className="mt-2 text-sm text-neutral-500 dark:text-white/55">
                Busca, filtra y agrega tus piezas favoritas al carrito.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-full border border-neutral-300 bg-neutral-50 px-5 py-4 text-sm text-neutral-950 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-emerald-400 lg:w-[360px]"
                placeholder="Buscar por obra, artista o técnica..."
              />

              <Link
                to="/carrito"
                className="relative whitespace-nowrap rounded-full bg-emerald-600 px-6 py-4 text-center text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
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
                    ? "bg-emerald-600 text-white dark:bg-emerald-400 dark:text-black"
                    : "bg-neutral-100 text-neutral-600 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-white/5 dark:text-white/60 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => void loadWorks()}
              className="rounded-full bg-emerald-100 px-5 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20"
            >
              Actualizar
            </button>
          </div>
        </div>
      </Shell>

      <Shell id="catalogo" className="pb-16">
        {works.length === 0 ? (
          <div className="rounded-[34px] border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-white/55">
            Todavía no hay obras disponibles.
          </div>
        ) : filteredWorks.length === 0 ? (
          <div className="rounded-[34px] border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-white/55">
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
                  className="group overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-neutral-900"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div className="relative">
                    <WorkImage src={imageUrl} title={w.titulo} />

                    <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black text-neutral-950 shadow-sm">
                      Stock: {Number(w.stock ?? 0)}
                    </div>

                    <div className="absolute right-3 top-3 rounded-full bg-neutral-950 px-3 py-1.5 text-[11px] font-black text-white shadow-sm dark:bg-emerald-400 dark:text-black">
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
                    <p className="line-clamp-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                      {w.artista?.nombre ?? "Artista Crisálida"}
                    </p>

                    <h3 className="mt-2 line-clamp-2 text-xl font-black leading-tight text-neutral-950 dark:text-white">
                      {w.titulo}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-500 dark:text-white/55">
                      {w.descripcion || "Obra disponible en Crisálida Market."}
                    </p>

                    <div className="mt-5 rounded-[22px] bg-neutral-50 p-4 dark:bg-white/5">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400 dark:text-white/40">
                            Precio
                          </p>

                          <p className="mt-1 text-2xl font-black text-neutral-950 dark:text-white">
                            {safePrice.toFixed(2)} Bs
                          </p>
                        </div>

                        <p
                          className={`rounded-full px-3 py-1 text-[11px] font-black ${
                            isOutOfStock
                              ? "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300"
                          }`}
                        >
                          {isOutOfStock ? "Agotado" : "Disponible"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex gap-3 pt-5">
                      <Link
                        to={`/obra/${w.id}`}
                        className="flex-1 rounded-full border border-neutral-300 px-4 py-3 text-center text-sm font-black text-neutral-950 transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-white/10 dark:text-white dark:hover:bg-emerald-400/10"
                      >
                        Ver detalle
                      </Link>

                      <button
                        type="button"
                        onClick={() => addToCart(w)}
                        disabled={isOutOfStock}
                        className="flex-1 rounded-full bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300 dark:disabled:bg-white/10 dark:disabled:text-white/35"
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
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-neutral-200 bg-white px-5 py-3 text-xs font-black text-emerald-700 shadow-xl dark:border-white/10 dark:bg-neutral-900 dark:text-emerald-300">
          {toast}
        </div>
      )}
    </div>
  );
}