import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { buildImageUrl, fetchObras } from "../services/api";

type Work = {
  id: number;
  titulo: string;
  imagen?: string | null;
  imagenUrl?: string | null;
  artista?: {
    nombre: string;
  };
};

export default function MuseoPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadWorks = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchObras();

        const clean = (Array.isArray(data) ? data : []).filter((w) =>
          Boolean(w.imagenUrl || w.imagen)
        );

        setWorks(clean);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las obras de Crisálida.");
      } finally {
        setLoading(false);
      }
    };

    void loadWorks();
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--c-bg)",
        color: "var(--c-text)",
      }}
    >
      <section className="w-full px-6 lg:px-10 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            Galería Crisálida
          </h1>

          <p className="mt-2 max-w-3xl" style={{ color: "var(--c-muted)" }}>
            Galería virtual. Cada obra respira, ocupa su espacio y dialoga con
            las demás.
          </p>
        </motion.div>

        {loading && (
          <p
            className="text-sm animate-pulse"
            style={{ color: "var(--c-muted)" }}
          >
            Cargando obras...
          </p>
        )}

        {error && !loading && (
          <p className="text-sm text-red-400 mb-6">{error}</p>
        )}

        {!loading && !error && works.length === 0 && (
          <div
            className="rounded-2xl p-6 text-center text-sm"
            style={{
              border: "1px dashed var(--c-border)",
              color: "var(--c-muted)",
            }}
          >
            Todavía no hay obras disponibles en la galería.
          </div>
        )}

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {works.map((w) => {
            const imageUrl = buildImageUrl(w.imagenUrl || w.imagen);

            if (!imageUrl) return null;

            return (
              <motion.button
                key={w.id}
                type="button"
                onClick={() => navigate(`/obra/${w.id}`)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden rounded-3xl aspect-[3/4] select-none text-left"
                style={{
                  background: "var(--c-panel)",
                  border: "1px solid var(--c-border)",
                }}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              >
                <img
                  src={imageUrl}
                  alt={w.titulo}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                <div className="absolute bottom-3 right-3 text-[10px] text-white/40 uppercase tracking-widest pointer-events-none">
                  Crisálida · Museo
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "var(--c-accent)" }}
                  >
                    {w.artista?.nombre ?? "Crisálida"}
                  </p>

                  <h3 className="text-lg font-bold leading-tight text-white">
                    {w.titulo}
                  </h3>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
}