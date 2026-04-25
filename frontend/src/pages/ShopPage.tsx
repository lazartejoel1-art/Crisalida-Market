import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type ObraPublic = {
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

export default function ShopPage() {
  const [obras, setObras] = useState<ObraPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadObras = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("http://localhost:3000/obras");
      if (!res.ok) {
        throw new Error("Error al cargar obras");
      }

      const data = (await res.json()) as ObraPublic[];
      setObras(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las obras. Inténtalo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadObras();
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      {/* HEADER */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-verdeEsmeralda">
            Tienda de obras 🖼
          </h1>
          <p className="text-gray-400 text-sm">
            Obras originales de la colectiva Crisálida, listas para viajar a
            nuevos hogares.
          </p>
        </div>
      </header>

      {/* ESTADOS: CARGANDO / ERROR / VACÍO */}
      {loading && (
        <p className="text-gray-400 text-sm animate-pulse">
          Cargando obras...
        </p>
      )}

      {error && !loading && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      {!loading && !error && obras.length === 0 && (
        <div className="border border-dashed border-gray-700 rounded-xl p-6 text-center text-gray-400 text-sm">
          Todavía no hay obras publicadas.  
          Pídele al admin (tú 😎) que cree algunas desde el panel.
        </div>
      )}

      {/* GRID DE OBRAS */}
      <div className="grid gap-5 mt-4 sm:grid-cols-2 lg:grid-cols-3">
        {obras.map((obra) => {
          const rawPrice = obra.precio;
          const price =
            typeof rawPrice === "number"
              ? rawPrice
              : Number(rawPrice ?? 0);

          return (
            <Link
              key={obra.id}
              to={`/obras/${obra.id}`}
              className="group bg-[#050816] border border-gray-800 rounded-xl overflow-hidden hover:border-verdeEsmeralda/60 hover:-translate-y-1 transition-all duration-200 flex flex-col"
            >
              {/* Imagen */}
              {obra.imagenUrl && (
                <div className="h-44 overflow-hidden">
                  <img
                    src={obra.imagenUrl}
                    alt={obra.titulo}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                  />
                </div>
              )}

              {/* Info */}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div>
                  <p className="text-sm text-verdeEsmeralda">
                    {obra.artista?.nombre ?? "Artista Crisálida"}
                  </p>
                  <h2 className="font-semibold text-gray-100 text-[0.95rem]">
                    {obra.titulo}
                  </h2>
                </div>

                <p className="text-xs text-gray-400 line-clamp-3">
                  {obra.descripcion}
                </p>

                <div className="mt-auto flex items-center justify-between text-sm pt-2">
                  <span className="font-bold text-gray-100">
                    {price.toFixed(2)} Bs
                  </span>
                  <span className="text-xs text-gray-400">
                    Stock: {obra.stock}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
