import { MouseEvent, TouchEvent, useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { buildImageUrl, fetchObraById } from "../services/api";

type WorkDetail = {
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

type FichaTecnica = {
  descripcionLimpia: string;
  tecnica: string;
  dimensiones: string;
  anio: string;
};

const CART_KEY = "crisalida_cart";

function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  return buildImageUrl(imagePath);
}

function readCart(): CartItem[] {
  try {
    const cartRaw = localStorage.getItem(CART_KEY);
    const parsed = cartRaw ? JSON.parse(cartRaw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("crisalida_cart_updated"));
}

function toPrice(value: number | string) {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function extraerCampo(texto: string, etiquetas: string[]): string {
  for (const etiqueta of etiquetas) {
    const regex = new RegExp(
      `${etiqueta}\\s*[:.]?\\s*([^\\.\\n]+(?:\\s*[xX×]\\s*[^\\.\\n]+)?)`,
      "i",
    );

    const match = texto.match(regex);

    if (match?.[1]) return match[1].trim();
  }

  return "";
}

function limpiarDescripcion(texto: string): string {
  return texto
    .replace(/t[ée]cnica\s*[:.]?\s*[^.\n]+\.?/gi, "")
    .replace(/dimensiones?\s*[:.]?\s*[^.\n]+\.?/gi, "")
    .replace(/medidas?\s*[:.]?\s*[^.\n]+\.?/gi, "")
    .replace(/tamañ[oa]\s*[:.]?\s*[^.\n]+\.?/gi, "")
    .replace(/año\s*[:.]?\s*[^.\n]+\.?/gi, "")
    .replace(/realizado\s+en\s+\d{4}\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function obtenerFichaTecnica(descripcion: string): FichaTecnica {
  const tecnica = extraerCampo(descripcion, ["técnica", "tecnica"]);

  const dimensiones = extraerCampo(descripcion, [
    "dimensión",
    "dimensiones",
    "medida",
    "medidas",
    "tamaño",
    "tamano",
  ]);

  const anioMatch =
    descripcion.match(/año\s*[:.]?\s*(\d{4})/i) ||
    descripcion.match(/realizado\s+en\s+(\d{4})/i) ||
    descripcion.match(/\b(20\d{2}|19\d{2})\b/);

  return {
    descripcionLimpia:
      limpiarDescripcion(descripcion) || "Obra perteneciente a Crisálida.",
    tecnica: tecnica || "No especificada",
    dimensiones: dimensiones || "No especificadas",
    anio: anioMatch?.[1] || "No especificado",
  };
}

function Shell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`w-full px-4 sm:px-6 lg:px-10 2xl:px-16 ${className}`}>
      <div className="mx-auto w-full max-w-[1480px]">{children}</div>
    </section>
  );
}

function InfoPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[30px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export default function WorkDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [obra, setObra] = useState<WorkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (!id) {
      setError("Obra no encontrada.");
      setLoading(false);
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchObraById(id);

        if (!isMounted) return;

        setObra(data);
      } catch (err) {
        console.error(err);

        if (!isMounted) return;

        setError("No se pudo cargar la obra. Inténtalo más tarde.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const ficha = useMemo(() => {
    return obtenerFichaTecnica(obra?.descripcion ?? "");
  }, [obra?.descripcion]);

  const updateZoomPosition = (
    clientX: number,
    clientY: number,
    element: HTMLDivElement,
  ) => {
    const rect = element.getBoundingClientRect();

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setZoomPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    updateZoomPosition(event.clientX, event.clientY, event.currentTarget);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;

    setZoomActive(true);
    updateZoomPosition(touch.clientX, touch.clientY, event.currentTarget);
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;

    updateZoomPosition(touch.clientX, touch.clientY, event.currentTarget);
  };

  const handleAddToCart = () => {
    if (!obra) return;

    const safePrice = toPrice(obra.precio);
    const imageUrl = getImageUrl(obra.imagenUrl || obra.imagen);

    const cart = readCart();
    const existingIndex = cart.findIndex((item) => item.id === obra.id);

    if (existingIndex >= 0) {
      cart[existingIndex] = {
        ...cart[existingIndex],
        cantidad: cart[existingIndex].cantidad + 1,
      };
    } else {
      cart.push({
        id: obra.id,
        titulo: obra.titulo,
        precio: safePrice,
        cantidad: 1,
        imagenUrl: imageUrl,
        artistaNombre: obra.artista?.nombre,
      });
    }

    saveCart(cart);
    setAddedMessage("Obra agregada al carrito 🛒");
    setTimeout(() => setAddedMessage(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f5f5] text-neutral-950 dark:bg-neutral-950 dark:text-white">
        <Shell className="py-10">
          <InfoPanel>
            <p className="text-sm animate-pulse text-neutral-500 dark:text-white/55">
              Cargando obra...
            </p>
          </InfoPanel>
        </Shell>
      </div>
    );
  }

  if (error || !obra) {
    return (
      <div className="min-h-screen bg-[#f4f5f5] text-neutral-950 dark:bg-neutral-950 dark:text-white">
        <Shell className="py-10">
          <InfoPanel>
            <p className="mb-4 text-sm font-semibold text-red-500">
              {error ?? "Obra no encontrada."}
            </p>

            <Link
              to="/tienda"
              className="text-sm font-black text-emerald-700 hover:underline dark:text-emerald-300"
            >
              ← Volver a la tienda
            </Link>
          </InfoPanel>
        </Shell>
      </div>
    );
  }

  const safePrice = toPrice(obra.precio);
  const imageUrl = getImageUrl(obra.imagenUrl || obra.imagen);
  const isOutOfStock = Number(obra.stock ?? 0) <= 0;

  return (
    <div className="min-h-screen bg-[#f4f5f5] text-neutral-950 transition-colors duration-300 dark:bg-neutral-950 dark:text-white">
      <Shell className="py-8 lg:py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-500 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/10 dark:bg-neutral-900 dark:text-white/55 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"
        >
          ← Volver
        </button>

        <div className="grid w-full items-start gap-6 xl:grid-cols-[1.15fr_0.85fr] lg:gap-8">
          <div
            className="group relative h-fit w-full cursor-zoom-in select-none overflow-hidden rounded-[34px] border border-neutral-200 bg-white shadow-sm touch-none dark:border-white/10 dark:bg-neutral-900"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onMouseEnter={() => setZoomActive(true)}
            onMouseLeave={() => setZoomActive(false)}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setZoomActive(false)}
            onClick={() => setZoomActive((prev) => !prev)}
          >
            {imageUrl ? (
              <>
                <div className="relative w-full overflow-hidden bg-neutral-100 dark:bg-white/5">
                  <img
                    src={imageUrl}
                    alt={obra.titulo}
                    loading="eager"
                    decoding="async"
                    className={`block h-auto max-h-none w-full object-contain transition-transform duration-300 ${
                      zoomActive ? "scale-[2.35]" : "scale-100"
                    }`}
                    style={{
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    }}
                    draggable={false}
                  />
                </div>

                <div className="absolute left-4 top-4 z-30 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/85 backdrop-blur-sm">
                  {zoomActive ? "Zoom activo" : "Toca para ampliar"}
                </div>
              </>
            ) : (
              <div className="flex min-h-[320px] items-center justify-center text-sm text-neutral-400 dark:text-white/35">
                Sin imagen
              </div>
            )}

            <div className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-black/45 px-3 py-1 text-[10px] uppercase tracking-widest text-white/60 backdrop-blur">
              Crisálida · Arte
            </div>
          </div>

          <div className="space-y-5">
            <InfoPanel className="border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-400/10">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
                Obra de arte · Crisálida
              </p>

              <h1 className="text-3xl font-black leading-tight text-neutral-950 dark:text-white sm:text-4xl">
                {obra.titulo}
              </h1>

              <div className="mt-4 text-sm text-neutral-600 dark:text-white/65">
                {obra.artista?.nombre && obra.artista?.id ? (
                  <>
                    Por{" "}
                    <Link
                      to={`/artistas/${obra.artista.id}`}
                      className="font-black text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
                    >
                      {obra.artista.nombre}
                    </Link>
                  </>
                ) : obra.artista?.nombre ? (
                  <>
                    Por{" "}
                    <span className="font-black text-emerald-700 dark:text-emerald-300">
                      {obra.artista.nombre}
                    </span>
                  </>
                ) : (
                  "Artista de Crisálida"
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-end justify-between gap-4 rounded-[24px] bg-white/70 p-4 dark:bg-white/5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400 dark:text-white/40">
                    Precio
                  </p>

                  <p className="mt-1 text-3xl font-black text-emerald-700 dark:text-emerald-300">
                    {safePrice.toFixed(2)} Bs
                  </p>
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-black ${
                    isOutOfStock
                      ? "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300"
                  }`}
                >
                  {isOutOfStock ? "Sin stock" : `Stock: ${obra.stock}`}
                </span>
              </div>
            </InfoPanel>

            <InfoPanel>
              <h2 className="mb-3 text-lg font-black text-emerald-700 dark:text-emerald-300">
                Descripción
              </h2>

              <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600 dark:text-white/65 sm:text-base">
                {ficha.descripcionLimpia}
              </p>
            </InfoPanel>

            <InfoPanel>
              <h2 className="mb-4 text-lg font-black text-emerald-700 dark:text-emerald-300">
                Ficha técnica
              </h2>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-white/40">
                    Técnica
                  </p>

                  <p className="mt-1 font-black text-neutral-950 dark:text-white">
                    {ficha.tecnica}
                  </p>
                </div>

                <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-white/40">
                    Dimensiones
                  </p>

                  <p className="mt-1 font-black text-neutral-950 dark:text-white">
                    {ficha.dimensiones}
                  </p>
                </div>

                <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-white/40">
                    Año
                  </p>

                  <p className="mt-1 font-black text-neutral-950 dark:text-white">
                    {ficha.anio}
                  </p>
                </div>

                <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-white/40">
                    Stock disponible
                  </p>

                  <p className="mt-1 font-black text-neutral-950 dark:text-white">
                    {obra.stock}
                  </p>
                </div>
              </div>
            </InfoPanel>

            <InfoPanel>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={obra.stock <= 0}
                  className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300 dark:disabled:bg-white/10 dark:disabled:text-white/35"
                >
                  {obra.stock > 0 ? "Agregar al carrito" : "Sin stock"}
                </button>

                <Link
                  to="/carrito"
                  className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-black text-neutral-950 transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-white/10 dark:text-white dark:hover:bg-emerald-400/10"
                >
                  Ver carrito →
                </Link>
              </div>

              {addedMessage && (
                <p className="mt-4 rounded-full bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">
                  {addedMessage}
                </p>
              )}
            </InfoPanel>
          </div>
        </div>
      </Shell>
    </div>
  );
}