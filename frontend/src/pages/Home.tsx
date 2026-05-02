import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Obra } from "../services/types";
import { buildImageUrl, fetchObras } from "../services/api";
import ObraCard from "../components/ObraCard";

type Evento = {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha?: string;
  lugar?: string;
  flyer?: string | null;
  flyerUrl?: string | null;
  activo?: boolean;
};

const API =
  import.meta.env.VITE_API_URL || "https://crisalida-market.onrender.com";

export default function Home() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
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

    fetch(`${API}/eventos/activos`)
      .then((res) => res.json())
      .then((data) => {
        setEventos(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("No se pudieron cargar los eventos", err);
        setEventos([]);
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

      {/* EVENTOS */}
      <section className="px-6 pb-12 max-w-6xl mx-auto">
        <div className="bg-[#0e1624] border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-2xl font-semibold text-verdeEsmeralda">
                Eventos y exposiciones
              </h3>
              <p className="text-sm text-gray-400">
                Flyers, inauguraciones y actividades recientes de Crisálida.
              </p>
            </div>
          </div>

          {eventos.length === 0 ? (
            <p className="text-sm text-gray-400">
              Próximamente anunciaremos nuevos eventos.
            </p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {eventos.map((evento) => {
                const flyerUrl = buildImageUrl(evento.flyerUrl || evento.flyer);

                return (
                  <motion.div
                    key={evento.id}
                    className="min-w-[240px] max-w-[240px] bg-[#0b1220] border border-gray-800 rounded-xl overflow-hidden"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {flyerUrl ? (
                      <img
                        src={flyerUrl}
                        alt={evento.titulo}
                        className="w-full h-72 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-72 flex items-center justify-center text-sm text-gray-500">
                        Sin flyer
                      </div>
                    )}

                    <div className="p-3">
                      <h4 className="font-bold text-gray-100 line-clamp-1">
                        {evento.titulo}
                      </h4>

                      <p className="text-xs text-verdeEsmeralda mt-1">
                        {evento.fecha || "Fecha por confirmar"}
                      </p>

                      <p className="text-xs text-gray-400">
                        {evento.lugar || "Lugar por confirmar"}
                      </p>

                      {evento.descripcion && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-3">
                          {evento.descripcion}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
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