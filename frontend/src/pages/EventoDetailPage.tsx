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
    <div
      className="min-h-screen px-6 py-10"
      style={{ background: "var(--c-bg)", color: "var(--c-text)" }}
    >
      <div className="max-w-6xl mx-auto">
        <p
          className="text-xs font-semibold uppercase tracking-[0.24em]"
          style={{ color: "var(--c-accent)" }}
        >
          Agenda Crisálida
        </p>

        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white mb-3">
          Eventos y exposiciones
        </h1>

        <p className="text-sm mb-8" style={{ color: "var(--c-muted)" }}>
          Descubre las actividades, muestras y exposiciones de Crisálida.
        </p>

        {loading ? (
          <div
            className="rounded-3xl p-8 text-sm"
            style={{
              background: "var(--c-panel)",
              border: "1px solid var(--c-border)",
              color: "var(--c-muted)",
            }}
          >
            Cargando eventos...
          </div>
        ) : eventos.length === 0 ? (
          <div
            className="rounded-3xl p-8 text-sm"
            style={{
              background: "var(--c-panel)",
              border: "1px solid var(--c-border)",
              color: "var(--c-muted)",
            }}
          >
            No hay eventos disponibles.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {eventos.map((evento) => {
              const img = buildImageUrl(evento.flyerUrl || evento.flyer);

              return (
                <Link
                  key={evento.id}
                  to={`/eventos/${evento.id}`}
                  className="group rounded-[28px] overflow-hidden transition hover:scale-[1.01]"
                  style={{
                    background: "var(--c-panel)",
                    border: "1px solid var(--c-border)",
                  }}
                >
                  {img ? (
                    <img
                      src={img}
                      alt={evento.titulo}
                      className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="h-72 flex items-center justify-center text-sm"
                      style={{ color: "var(--c-muted)" }}
                    >
                      Sin flyer
                    </div>
                  )}

                  <div className="p-5">
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "var(--c-accent)" }}
                    >
                      {evento.fecha || "Fecha por confirmar"}
                    </p>

                    <h3 className="mt-2 text-lg font-extrabold text-white line-clamp-2">
                      {evento.titulo}
                    </h3>

                    <p className="mt-1 text-xs" style={{ color: "var(--c-muted)" }}>
                      {evento.lugar || "Lugar por confirmar"}
                    </p>

                    <p
                      className="mt-3 text-sm line-clamp-3"
                      style={{ color: "rgba(255,255,255,0.62)" }}
                    >
                      {evento.descripcion || "Ver más detalles del evento."}
                    </p>

                    <p
                      className="mt-4 text-xs font-semibold underline underline-offset-4"
                      style={{ color: "var(--c-accent)" }}
                    >
                      Ver detalle →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}