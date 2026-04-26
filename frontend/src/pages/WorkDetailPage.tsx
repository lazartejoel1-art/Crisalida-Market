import { MouseEvent, TouchEvent, useEffect, useState } from "react";
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

const CART_KEY = "crisalida_cart";

function getImageUrl(imagePath: string | null | undefined): string | null {
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
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [id]);

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

    const precioNum =
      typeof obra.precio === "number"
        ? obra.precio
        : Number(obra.precio ?? 0);

    const safePrice = Number.isFinite(precioNum) ? precioNum : 0;
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
      <section className="max-w-5xl mx-auto px-4 py-10">
        <p className="text-sm text-gray-400 animate-pulse">Cargando obra...</p>
      </section>
    );
  }

  if (error || !obra) {
    return (
      <section className="max-w-5xl mx-auto px-4 py-10">
        <p className="text-sm text-red-400 mb-4">
          {error ?? "Obra no encontrada."}
        </p>
        <Link
          to="/tienda"
          className="text-sm text-verdeEsmeralda hover:underline"
        >
          ← Volver a la tienda
        </Link>
      </section>
    );
  }

  const price =
    typeof obra.precio === "number"
      ? obra.precio
      : Number(obra.precio ?? 0);

  const safePrice = Number.isFinite(price) ? price : 0;
  const imageUrl = getImageUrl(obra.imagenUrl || obra.imagen);

  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-xs text-gray-400 hover:text-verdeEsmeralda mb-4"
      >
        ← Volver
      </button>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div
          className="relative bg-[#050816] border border-gray-800 rounded-2xl overflow-hidden select-none min-h-[320px] cursor-zoom-in group touch-none"
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
              <img
                src={imageUrl}
                alt={obra.titulo}
                className={`w-full h-full object-cover pointer-events-none transition-transform duration-300 ${
                  zoomActive ? "scale-[5.8]" : "scale-100"
                }`}
                style={{
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }}
                draggable={false}
              />
              <div className="absolute top-3 left-3 z-30 text-[10px] text-white/70 bg-black/40 border border-white/10 rounded-full px-3 py-1 backdrop-blur-sm">
                {zoomActive
                  ? "Zoom activo"
                  : "desliza para ampliar"}
              </div>
            </>
          ) : (
            <div className="min-h-[320px] flex items-center justify-center text-gray-500 text-sm">
              Sin imagen
            </div>
          )}

          <div className="absolute inset-0 z-10 pointer-events-none" />

          <div className="absolute bottom-3 right-3 text-[10px] text-white/40 uppercase tracking-widest pointer-events-none">
            Crisálida · Arte
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-verdeEsmeralda mb-2">
            Obra de arte · Crisálida
          </p>

          <h1 className="text-2xl font-bold text-gray-100 mb-2">
            {obra.titulo}
          </h1>

          <p className="text-sm text-gray-400 mb-2">
            {obra.artista?.nombre ? (
              <>
                Por{" "}
                <span className="text-verdeEsmeralda font-medium">
                  {obra.artista.nombre}
                </span>
              </>
            ) : (
              "Artista de Crisálida"
            )}
          </p>

          <p className="text-3xl font-bold text-verdeEsmeralda mb-3">
            {safePrice.toFixed(2)} Bs
          </p>

          <p className="text-sm text-gray-300 mb-4">{obra.descripcion}</p>

          <p className="text-xs text-gray-400 mb-4">
            Stock disponible:{" "}
            <span className="text-gray-200 font-medium">{obra.stock}</span>
          </p>

          <div className="flex flex-wrap gap-3 items-center mb-4">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={obra.stock <= 0}
              className="px-4 py-2 rounded-lg bg-verdeEsmeralda text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {obra.stock > 0 ? "Agregar al carrito" : "Sin stock"}
            </button>

            <Link
              to="/carrito"
              className="text-sm text-gray-300 hover:text-verdeEsmeralda"
            >
              Ver carrito →
            </Link>
          </div>

          {addedMessage && (
            <p className="text-xs text-verdeEsmeralda">{addedMessage}</p>
          )}
        </div>
      </div>
    </section>
  );
}