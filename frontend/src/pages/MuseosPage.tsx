import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

type Work = {
  id: number;
  titulo: string;
  imagenUrl: string;
  artista?: {
    nombre: string;
  };
};

export default function MuseoPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3000/obras")
      .then((r) => r.json())
      .then((data) => {
        setWorks(
          (Array.isArray(data) ? data : []).filter(
            (w) => w.imagenUrl && w.imagenUrl.length > 0
          )
        );
      })
      .catch((e) => console.error(e));
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
        {/* ================= HEADER ================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            Museo Crisálida
          </h1>
          <p className="mt-2 max-w-3xl" style={{ color: "var(--c-muted)" }}>
            Galería virtual. Cada obra respira, ocupa su espacio y dialoga con
            las demás.
          </p>
        </motion.div>

        {/* ================= GALERÍA ================= */}
        <div
          className="
            grid
            gap-6
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
          "
        >
          {works.map((w) => (
            <motion.button
              key={w.id}
              onClick={() => navigate(`/obra/${w.id}`)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-3xl aspect-[3/4] select-none"
              style={{
                background: "var(--c-panel)",
                border: "1px solid var(--c-border)",
              }}
              onContextMenu={(e) => e.preventDefault()} // ❌ clic derecho
              onDragStart={(e) => e.preventDefault()} // ❌ arrastrar
            >
              {/* IMAGEN PROTEGIDA */}
              <img
                src={w.imagenUrl}
                alt={w.titulo}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                draggable={false}
              />

              {/* Overlay visual */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Overlay protector invisible (anti interacción directa) */}
              <div className="absolute inset-0 z-10 pointer-events-auto" />

              {/* Marca de agua académica */}
              <div className="absolute bottom-3 right-3 text-[10px] text-white/40 uppercase tracking-widest pointer-events-none">
                Crisálida · Museo
              </div>

              {/* Texto */}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                <p
                  className="text-xs font-semibold"
                  style={{ color: "var(--c-accent)" }}
                >
                  {w.artista?.nombre ?? "Crisálida"}
                </p>
                <h3 className="text-lg font-bold leading-tight">
                  {w.titulo}
                </h3>
              </div>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}
