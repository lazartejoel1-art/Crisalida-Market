import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Obra } from "../services/types";
import { fetchObras } from "../services/api";
import ObraCard from "../components/ObraCard";

export default function Tienda() {
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
    <div className="bg-negroSuave min-h-screen text-blancoPuro px-6 py-10">
      <motion.h2
        className="text-3xl font-bold mb-6 text-verdeEsmeralda"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Catálogo Completo
      </motion.h2>

      {loading && <p>Cargando obras...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && (
        <motion.div
          className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
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
    </div>
  );
}
