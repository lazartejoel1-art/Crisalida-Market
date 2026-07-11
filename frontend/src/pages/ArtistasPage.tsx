import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { Artista } from "../services/types";
import { fetchArtistas } from "../services/api";
import ArtistaCard from "../components/ArtistaCard";

export default function ArtistasPage() {
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArtistas = () => {
    setLoading(true);
    setError(null);

    fetchArtistas()
      .then((data) => {
        setArtistas(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudieron cargar los artistas.");
        setLoading(false);
      });
  };

  useEffect(() => {
    // defer to avoid calling setState synchronously within the effect
    const id = window.setTimeout(() => {
      loadArtistas();
    }, 0);

    return () => clearTimeout(id);
  }, []);

  const scrollToArtists = () => {
    const section = document.getElementById("lista-artistas");

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f5] text-neutral-950 transition-colors duration-300 dark:bg-neutral-950 dark:text-white">
      <section className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16 py-8 lg:py-10">
        <div className="mx-auto w-full max-w-[1480px]">
          <motion.div
            className="relative overflow-hidden rounded-[38px] border border-emerald-200 bg-emerald-50 p-6 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-400/10 sm:p-8 lg:p-10"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" />
            <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-white/70 blur-3xl dark:bg-white/5" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
                  Colectiva Crisálida
                </p>

                <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-neutral-950 dark:text-white sm:text-5xl lg:text-6xl">
                  Artistas de Crisálida
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-white/65 sm:text-base">
                  Conoce a los creadores que forman parte de la colectiva:
                  pintura, dibujo, arte digital, cerámica, grabado y nuevas
                  propuestas visuales.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={loadArtistas}
                  className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                >
                  Actualizar
                </button>

                <button
                  type="button"
                  onClick={scrollToArtists}
                  className="rounded-full border border-emerald-300 bg-white/60 px-6 py-3 text-sm font-black text-neutral-950 transition hover:bg-white dark:border-emerald-400/30 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Ver artistas
                </button>
              </div>
            </div>
          </motion.div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <motion.button
              type="button"
              onClick={scrollToArtists}
              className="group text-left rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg dark:border-white/10 dark:bg-neutral-900 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <p className="text-base font-black text-neutral-950 dark:text-white">
                Arte local
              </p>

              <p className="mt-1 text-sm text-neutral-500 dark:text-white/55">
                Talento visual desde Bolivia
              </p>

              <p className="mt-3 text-xs font-black text-emerald-700 opacity-0 transition group-hover:opacity-100 dark:text-emerald-300">
                Ver perfiles →
              </p>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
            >
              <Link
                to="/eventos"
                className="group block h-full rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg dark:border-white/10 dark:bg-neutral-900 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10"
              >
                <p className="text-base font-black text-neutral-950 dark:text-white">
                  Colectiva activa
                </p>

                <p className="mt-1 text-sm text-neutral-500 dark:text-white/55">
                  Exposiciones y proyectos
                </p>

                <p className="mt-3 text-xs font-black text-emerald-700 opacity-0 transition group-hover:opacity-100 dark:text-emerald-300">
                  Ver eventos →
                </p>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              <Link
                to="/museo"
                className="group block h-full rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg dark:border-white/10 dark:bg-neutral-900 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10"
              >
                <p className="text-base font-black text-neutral-950 dark:text-white">
                  Identidad visual
                </p>

                <p className="mt-1 text-sm text-neutral-500 dark:text-white/55">
                  Estilos diversos y auténticos
                </p>

                <p className="mt-3 text-xs font-black text-emerald-700 opacity-0 transition group-hover:opacity-100 dark:text-emerald-300">
                  Ver galería →
                </p>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
            >
              <Link
                to="/tienda"
                className="group block h-full rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg dark:border-white/10 dark:bg-neutral-900 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10"
              >
                <p className="text-base font-black text-neutral-950 dark:text-white">
                  Crisálida Market
                </p>

                <p className="mt-1 text-sm text-neutral-500 dark:text-white/55">
                  Obras disponibles en tienda
                </p>

                <p className="mt-3 text-xs font-black text-emerald-700 opacity-0 transition group-hover:opacity-100 dark:text-emerald-300">
                  Ir a tienda →
                </p>
              </Link>
            </motion.div>
          </div>

          <section
            id="lista-artistas"
            className="mt-8 rounded-[38px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-7"
          >
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                  Directorio artístico
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-3xl">
                  Perfiles de artistas
                </h2>

                <p className="mt-2 text-sm text-neutral-500 dark:text-white/55">
                  Explora los perfiles y conoce el trabajo de cada integrante.
                </p>
              </div>

              <div className="rounded-full bg-emerald-100 px-5 py-2 text-sm font-black text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">
                {artistas.length} artistas
              </div>
            </div>

            {loading && (
              <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-8 text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/55">
                <p className="animate-pulse">Cargando artistas...</p>
              </div>
            )}

            {error && (
              <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 shadow-sm dark:border-red-400/20 dark:bg-red-400/10">
                <p className="text-sm font-semibold text-red-600 dark:text-red-300">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadArtistas}
                  className="mt-4 rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!loading && !error && artistas.length === 0 && (
              <div className="rounded-[28px] border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
                Todavía no hay artistas registrados.
              </div>
            )}

            {!loading && !error && artistas.length > 0 && (
              <motion.div
                className="
                  grid
                  gap-5
                  grid-cols-1
                  sm:grid-cols-2
                  md:grid-cols-3
                  xl:grid-cols-4
                  2xl:grid-cols-5
                "
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.08,
                    },
                  },
                }}
              >
                {artistas.map((artista) => (
                  <motion.div
                    key={artista.id}
                    className="overflow-hidden rounded-[26px] border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-neutral-950"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.35 }}
                  >
                    <ArtistaCard artista={artista} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
