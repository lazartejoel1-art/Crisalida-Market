import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { buildImageUrl } from "../services/api";

type Evento = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  fecha?: string | null;
  lugar?: string | null;
  flyer?: string | null;
  flyerUrl?: string | null;
  activo?: boolean;
};

const API =
  import.meta.env.VITE_API_URL || "https://crisalida-market.onrender.com";

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/eventos/activos`)
      .then((res) => res.json())
      .then((data) => {
        setEventos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setEventos([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen px-6 py-10 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-2 text-verdeEsmeralda">
          Eventos y exposiciones
        </h1>

        <p className="text-gray-400 mb-8">
          Descubre las actividades, muestras y exposiciones de Crisálida.
        </p>

        {loading ? (
          <p>Cargando eventos...</p>
        ) : eventos.length === 0 ? (
          <p className="text-gray-400">No hay eventos disponibles.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {eventos.map((evento) => {
              const img = buildImageUrl(evento.flyerUrl || evento.flyer);

              return (
                <motion.div
                  key={evento.id}
                  className="bg-[#0e1624] border border-gray-800 rounded-xl overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Link to={`/eventos/${evento.id}`}>
                    {img ? (
                      <img
                        src={img}
                        alt={evento.titulo}
                        className="w-full h-64 object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 flex items-center justify-center text-gray-500">
                        Sin imagen
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="font-bold text-lg">
                        {evento.titulo}
                      </h3>

                      <p className="text-xs text-verdeEsmeralda mt-1">
                        {evento.fecha || "Fecha por confirmar"}
                      </p>

                      <p className="text-xs text-gray-400">
                        {evento.lugar || "Lugar por confirmar"}
                      </p>

                      <p className="text-sm text-gray-400 mt-2 line-clamp-3">
                        {evento.descripcion || "Sin descripción"}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}