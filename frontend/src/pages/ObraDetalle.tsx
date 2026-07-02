import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Obra } from "../services/types";
import { fetchObras } from "../services/api";
import { motion } from "framer-motion";

const API_URL = "http://localhost:3000";

function getImageUrl(obra: Obra) {
  const imagen = obra.imagenUrl || obra.imagen;

  if (!imagen) return "/placeholder.jpg";

  if (imagen.startsWith("http")) return imagen;

  if (imagen.startsWith("/uploads")) return `${API_URL}${imagen}`;

  return `${API_URL}/uploads/${imagen}`;
}

export default function ObraDetalle() {
  const { id } = useParams<{ id: string }>();
  const [obra, setObra] = useState<Obra | null>(null);
  const [imagenCargada, setImagenCargada] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetchObras().then((data: Obra[]) => {
      const encontrada = data.find((o) => o.id === Number(id));
      setObra(encontrada ?? null);
    });
  }, [id]);

  if (!obra) {
    return (
      <div className="bg-negroSuave min-h-screen text-blancoPuro px-6 py-10">
        <p>Cargando obra...</p>
      </div>
    );
  }

  return (
    <div className="bg-negroSuave min-h-screen text-blancoPuro px-4 md:px-6 py-8 md:py-10">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <motion.div
          className="w-full md:flex-1"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="w-full rounded-2xl overflow-hidden bg-black/30 shadow-lg">
            {!imagenCargada && (
              <div className="w-full h-64 md:h-96 animate-pulse bg-white/10 rounded-2xl" />
            )}

            <img
              src={getImageUrl(obra)}
              alt={obra.titulo}
              loading="lazy"
              decoding="async"
              onLoad={() => setImagenCargada(true)}
              className={`w-full h-auto max-h-[80vh] object-contain rounded-2xl transition-opacity duration-300 ${
                imagenCargada ? "opacity-100" : "opacity-0 absolute"
              }`}
            />
          </div>
        </motion.div>

        <motion.div
          className="w-full md:flex-1 flex flex-col justify-between"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-verdeEsmeralda">
              {obra.titulo}
            </h1>

            <p className="mt-3 text-gray-300">{obra.descripcion}</p>

            <p className="mt-2 text-sm text-gray-400">
              Artista: {obra.artista?.nombre}
            </p>
          </div>

          <div className="mt-6">
            <p className="text-2xl font-bold text-verdeEsmeralda">
              Bs. {obra.precio}
            </p>

            <p className="text-sm text-gray-400 mt-1">
              Stock disponible: {obra.stock}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
