import { useEffect, useState } from "react";
import { buildImageUrl } from "../services/api";

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

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/eventos`) // 🔥 usamos este para asegurar que cargue
      .then((res) => res.json())
      .then((data) => {
        const filtrados = Array.isArray(data)
          ? data.filter((e) => e.activo !== false)
          : [];

        setEventos(filtrados);
        setLoading(false);
      })
      .catch(() => {
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
              <div
                key={evento.id}
                className="bg-[#0e1624] border border-gray-800 rounded-xl overflow-hidden"
              >
                {img ? (
                  <img
                    src={img}
                    alt={evento.titulo}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Sin flyer
                  </div>
                )}

                <div className="p-4">
                  <h3 className="font-bold">{evento.titulo}</h3>
                  <p className="text-sm text-verdeEsmeralda">
                    {evento.fecha}
                  </p>
                  <p className="text-xs text-gray-400">
                    {evento.lugar}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}