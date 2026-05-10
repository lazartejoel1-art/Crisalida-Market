import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Artista } from "../services/types";
import { fetchArtistas } from "../services/api";
import ArtistaCard from "../components/ArtistaCard";

export default function ArtistasPage() {
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArtistas()
      .then((data) => {
        setArtistas(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudieron cargar los artistas.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-negroSuave min-h-screen text-blancoPuro px-3 lg:px-5 py-10 w-full">
      <motion.h2
        className="text-4xl font-black mb-8 text-verdeEsmeralda tracking-tight"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Artistas de Crisálida
      </motion.h2>

      {loading && (
        <p className="text-gray-400 animate-pulse">
          Cargando artistas...
        </p>
      )}

      {error && (
        <p className="text-red-400">
          {error}
        </p>
      )}

      {!loading && !error && (
        <motion.div
          className="
            grid
            gap-5
            grid-cols-2
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
    </div>
  );
}