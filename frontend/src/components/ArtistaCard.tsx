import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { Artista } from "../services/types";
import { buildImageUrl } from "../services/api";

interface Props {
  artista: Artista;
}

export default function ArtistaCard({ artista }: Props) {
  const imageUrl = buildImageUrl(artista.fotoUrl || artista.foto);

  return (
    <Link to={`/artistas/${artista.id}`}>
      <motion.div
        className="bg-blancoPuro rounded-xl overflow-hidden shadow-md cursor-pointer flex flex-col"
        whileHover={{ scale: 1.04, y: -5 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        <div className="h-52 w-full bg-gray-200 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={artista.nombre}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              Sin foto
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1 justify-between">
          <div>
            <h3 className="text-lg font-bold text-negroSuave truncate">
              {artista.nombre}
            </h3>

            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {artista.descripcion}
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}