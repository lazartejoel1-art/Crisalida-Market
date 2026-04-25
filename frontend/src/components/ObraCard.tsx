import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { Obra } from "../services/types";

interface Props {
  obra: Obra;
}

export default function ObraCard({ obra }: Props) {
  return (
    <Link to={`/obras/${obra.id}`}>
      <motion.div
        className="bg-blancoPuro rounded-xl overflow-hidden shadow-md cursor-pointer flex flex-col"
        whileHover={{ scale: 1.03, y: -5 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <div className="h-56 w-full bg-gray-200 overflow-hidden">
          <img
            src={obra.imagenUrl || `http://localhost:3000/${obra.imagen}`}
            alt={obra.titulo}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-negroSuave truncate">
              {obra.titulo}
            </h3>

            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {obra.descripcion}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-verdeEsmeralda font-bold text-lg">
              Bs. {obra.precio}
            </span>

            <span className="text-xs text-gray-500">
              {obra.artista?.nombre}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
