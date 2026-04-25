import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Artista, Obra } from "../services/types";
import { fetchArtistas, fetchObras } from "../services/api";
import ObraCard from "../components/ObraCard";
import { motion } from "framer-motion";

const API_URL = "http://localhost:3000";

export default function PerfilArtista() {
  const { id } = useParams<{ id: string }>();
  const [artista, setArtista] = useState<Artista | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);

  useEffect(() => {
    if (!id) return;

    fetchArtistas().then((data: Artista[]) => {
      const encontrado = data.find((a) => a.id === Number(id));
      setArtista(encontrado ?? null);
    });

    fetchObras().then((data: Obra[]) => {
      setObras(data.filter((o) => o.artista.id === Number(id)));
    });
  }, [id]);

  if (!artista) {
    return (
      <div className="bg-negroSuave min-h-screen text-blancoPuro px-6 py-10">
        <p>Cargando artista...</p>
      </div>
    );
  }

  const imageUrl = artista.foto
    ? `${API_URL}/uploads/${artista.foto}`
    : "/placeholder.jpg";

  return (
    <div className="bg-negroSuave min-h-screen text-blancoPuro px-6 py-10">
      <motion.div
        className="flex flex-col md:flex-row gap-6 items-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <img
          src={imageUrl}
          className="w-40 h-40 rounded-full object-cover border-4 border-verdeEsmeralda"
          alt={artista.nombre}
        />

        <div>
          <h1 className="text-4xl font-bold text-verdeEsmeralda">
            {artista.nombre}
          </h1>
          <p className="text-gray-300 mt-2">{artista.descripcion}</p>
        </div>
      </motion.div>

      <motion.h2
        className="text-3xl font-bold mt-12 mb-6 text-verdeEsmeralda"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Obras del artista
      </motion.h2>

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
    </div>
  );
}
