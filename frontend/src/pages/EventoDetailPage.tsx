import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

function Shell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`w-full px-4 sm:px-6 lg:px-10 2xl:px-16 ${className}`}>
      <div className="mx-auto w-full max-w-[1280px]">{children}</div>
    </section>
  );
}

export default function EventoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadEvento() {
      try {
        const res = await fetch(`${API}/eventos`);

        if (!res.ok) {
          throw new Error("No se pudo cargar el evento.");
        }

        const data = (await res.json()) as Evento[];
        const found = Array.isArray(data)
          ? data.find((item) => Number(item.id) === Number(id))
          : null;

        if (alive) setEvento(found ?? null);
      } catch (error) {
        console.error(error);
        if (alive) setEvento(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadEvento();

    return () => {
      alive = false;
    };
  }, [id]);

  const flyerUrl = evento ? buildImageUrl(evento.flyerUrl || evento.flyer) : null;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--c-bg)", color: "var(--c-text)" }}
    >
      <Shell className="py-8 sm:py-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 text-sm font-semibold underline underline-offset-4"
          style={{ color: "var(--c-accent)" }}
        >
          ← Volver
        </button>

        {loading ? (
          <div
            className="rounded-3xl p-8 text-sm"
            style={{
              background: "var(--c-panel)",
              border: "1px solid var(--c-border)",
              color: "var(--c-muted)",
            }}
          >
            Cargando evento...
          </div>
        ) : !evento ? (
          <div
            className="rounded-3xl p-8 text-sm"
            style={{
              background: "var(--c-panel)",
              border: "1px solid var(--c-border)",
              color: "var(--c-muted)",
            }}
          >
            No se encontró este evento.
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            <motion.div
              className="lg:col-span-7 rounded-[32px] overflow-hidden"
              style={{
                background: "var(--c-panel)",
                border: "1px solid var(--c-border)",
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              {flyerUrl ? (
                <img
                  src={flyerUrl}
                  alt={evento.titulo}
                  className="w-full max-h-[760px] object-cover"
                />
              ) : (
                <div
                  className="h-[520px] flex items-center justify-center text-sm"
                  style={{ color: "var(--c-muted)" }}
                >
                  Sin flyer
                </div>
              )}
            </motion.div>

            <motion.div
              className="lg:col-span-5 rounded-[32px] p-6 sm:p-8"
              style={{
                background: "var(--c-panel)",
                border: "1px solid var(--c-border)",
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-[0.25em]"
                style={{ color: "var(--c-accent)" }}
              >
                Evento / Exposición
              </p>

              <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold leading-tight text-white">
                {evento.titulo}
              </h1>

              <div className="mt-6 grid gap-3">
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.035)",
                    border: "1px solid var(--c-border)",
                  }}
                >
                  <p className="text-xs" style={{ color: "var(--c-muted)" }}>
                    Fecha
                  </p>
                  <p className="text-sm font-bold text-white">
                    {evento.fecha || "Fecha por confirmar"}
                  </p>
                </div>

                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.035)",
                    border: "1px solid var(--c-border)",
                  }}
                >
                  <p className="text-xs" style={{ color: "var(--c-muted)" }}>
                    Lugar
                  </p>
                  <p className="text-sm font-bold text-white">
                    {evento.lugar || "Lugar por confirmar"}
                  </p>
                </div>
              </div>

              <p
                className="mt-6 text-sm leading-7 whitespace-pre-line"
                style={{ color: "var(--c-muted)" }}
              >
                {evento.descripcion || "Pronto tendremos más detalles del evento."}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/museo"
                  className="px-5 py-3 rounded-xl font-semibold text-center"
                  style={{ background: "var(--c-accent)", color: "#07110a" }}
                >
                  Ver Galería
                </Link>

                <Link
                  to="/contacto"
                  className="px-5 py-3 rounded-xl font-semibold border text-center"
                  style={{
                    borderColor: "var(--c-border)",
                    color: "white",
                  }}
                >
                  Contactar
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </Shell>
    </div>
  );
}