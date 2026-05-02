import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
    fetch(`${API}/eventos`)
      .then((res) => res.json())
      .then((data) => {
        const filtrados = Array.isArray(data)
          ? data.filter((evento) => evento.activo !== false)
          : [];

        setEventos(filtrados);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error al cargar eventos:", error);
        setEventos([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen px-6 py-10 text-white">
      <h1 className="text-3xl font-bold text-verdeEsmeralda mb-6">
        Eventos y exposiciones
      </h1>

      {loading ? (
        <p>Cargando eventos...</p>
      ) : eventos.length === 0 ? (
        <p>No hay eventos disponibles.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {eventos.map((evento) => {
            const img = buildImageUrl(evento.flyerUrl || evento.flyer);

            return (
              <Link
                key={evento.id}
                to={`/eventos/${evento.id}`}
                className="block bg-[#0e1624] border border-gray-800 rounded-xl overflow-hidden hover:border-verdeEsmeralda/60 hover:scale-[1.01] transition"
              >
                {img ? (
                  <img
                    src={img}
                    alt={evento.titulo}
                    className="w-full h-64 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Sin flyer
                  </div>
                )}

                <div className="p-4">
                  <h3 className="font-bold">{evento.titulo}</h3>

                  <p className="text-sm text-verdeEsmeralda">
                    {evento.fecha || "Fecha por confirmar"}
                  </p>

                  <p className="text-xs text-gray-400">
                    {evento.lugar || "Lugar por confirmar"}
                  </p>

                  <p className="mt-3 text-sm text-gray-400 line-clamp-3">
                    {evento.descripcion || "Ver más información del evento."}
                  </p>

                  <span className="inline-block mt-4 text-sm text-verdeEsmeralda font-semibold">
                    Más información →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}