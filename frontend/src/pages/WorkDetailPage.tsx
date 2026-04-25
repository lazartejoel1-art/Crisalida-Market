import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

type WorkDetail = {
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

export default function WorkDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [obra, setObra] = useState<WorkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Obra no encontrada.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`http://localhost:3000/obras/${id}`, {
          signal: controller.signal,
        });

        if (res.status === 404) {
          setObra(null);
          setError("Esta obra ya no existe o fue retirada 🫧");
          return;
        }

        if (!res.ok) {
          throw new Error("No se pudo cargar la obra");
        }

        const data = (await res.json()) as WorkDetail;
        setObra(data);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error(err);
        setError("No se pudo cargar la obra. Inténtalo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [id]);

  const handleAddToCart = () => {
    if (!obra) return;

    const precioNum =
      typeof obra.precio === "number"
        ? obra.precio
        : Number(obra.precio ?? 0);

    const cartRaw = localStorage.getItem("crisalida_cart");
    const cart: CartItem[] = cartRaw ? JSON.parse(cartRaw) : [];

    const existingIndex = cart.findIndex((item) => item.id === obra.id);

    if (existingIndex >= 0) {
      cart[existingIndex].cantidad += 1;
    } else {
      cart.push({
        id: obra.id,
        titulo: obra.titulo,
        precio: precioNum,
        cantidad: 1,
        imagenUrl: obra.imagenUrl,
        artistaNombre: obra.artista?.nombre,
      });
    }

    localStorage.setItem("crisalida_cart", JSON.stringify(cart));
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
        <Link to="/tienda" className="text-sm text-verdeEsmeralda hover:underline">
          ← Volver a la tienda
        </Link>
      </section>
    );
  }

  const price =
    typeof obra.precio === "number"
      ? obra.precio
      : Number(obra.precio ?? 0);

  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      <button
        onClick={() => navigate(-1)}
        className="text-xs text-gray-400 hover:text-verdeEsmeralda mb-4"
      >
        ← Volver
      </button>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* ===================== IMAGEN PROTEGIDA ===================== */}
        <div
          className="relative bg-[#050816] border border-gray-800 rounded-2xl overflow-hidden select-none"
          onContextMenu={(e) => e.preventDefault()} // ❌ clic derecho
          onDragStart={(e) => e.preventDefault()} // ❌ arrastrar
        >
          {/* Imagen */}
          <img
            src={obra.imagenUrl}
            alt={obra.titulo}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />

          {/* Overlay protector invisible */}
          <div className="absolute inset-0 z-10" />

          {/* Watermark académico */}
          <div className="absolute bottom-3 right-3 text-[10px] text-white/40 uppercase tracking-widest pointer-events-none">
            Crisálida · Arte
          </div>
        </div>

        {/* ===================== INFO ===================== */}
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
            {price.toFixed(2)} Bs
          </p>

          <p className="text-sm text-gray-300 mb-4">{obra.descripcion}</p>

          <p className="text-xs text-gray-400 mb-4">
            Stock disponible:{" "}
            <span className="text-gray-200 font-medium">{obra.stock}</span>
          </p>

          <div className="flex gap-3 items-center mb-4">
            <button
              onClick={handleAddToCart}
              className="px-4 py-2 rounded-lg bg-verdeEsmeralda text-black text-sm font-semibold hover:opacity-90"
            >
              Agregar al carrito
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
