import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Obra } from "../services/types";
import { fetchObras } from "../services/api";
import ObraCard from "../components/ObraCard";

export default function Home() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchObras()
      .then((data) => {
        setObras(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudieron cargar las obras.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-negroSuave min-h-screen text-blancoPuro">
      {/* HERO */}
      <section className="flex flex-col items-center text-center py-16 px-6">
        <motion.h2
          className="text-4xl md:text-6xl font-bold text-verdeEsmeralda"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Arte que transforma y conecta.
        </motion.h2>

        <motion.p
          className="mt-6 text-lg md:text-2xl max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Descubre obras originales creadas por artistas emergentes.
        </motion.p>
      </section>

      {/* LISTA DE OBRAS */}
      <section className="px-6 pb-16 max-w-6xl mx-auto">
        <h3 className="text-2xl font-semibold mb-4">Obras destacadas</h3>

        {loading && <p>Cargando obras...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && !error && (
          <motion.div
            className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {obras.map((obra) => (
              <motion.div
                key={obra.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <ObraCard obra={obra} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
