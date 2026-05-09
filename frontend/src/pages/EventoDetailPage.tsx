import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_URL, buildImageUrl } from "../services/api";

type ArtistaInvitadoEvento = {
  nombre: string;
  especialidad?: string;
  descripcion?: string;
  imagenUrl?: string;
};

type Evento = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  fecha?: string | null;
  lugar?: string | null;
  flyer?: string | null;
  flyerUrl?: string | null;
  activo?: boolean;
  artistasInvitados?: ArtistaInvitadoEvento[];
};

export default function EventoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Evento no encontrado.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_URL}/eventos/${id}`);

        if (!res.ok) {
          throw new Error("No se pudo cargar el evento");
        }

        const data = (await res.json()) as Evento;
        setEvento(data);
      } catch (e) {
        console.error(e);
        setError("No se pudo cargar el evento.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-sm text-gray-400 animate-pulse">
          Cargando evento...
        </p>
      </section>
    );
  }

  if (error || !evento) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-sm text-red-400 mb-3">
          {error ?? "Evento no encontrado."}
        </p>

        <Link
          to="/eventos"
          className="text-sm text-verdeEsmeralda hover:underline"
        >
          ← Volver a eventos
        </Link>
      </section>
    );
  }

  const flyer = buildImageUrl(evento.flyerUrl || evento.flyer);

  return (
    <section className="max-w-6xl mx-auto px-4 py-10 text-white">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-xs text-gray-400 hover:text-verdeEsmeralda mb-4"
      >
        ← Volver
      </button>

      <div className="bg-[#050816] border border-gray-800 rounded-2xl overflow-hidden">
        {flyer ? (
          <img
            src={flyer}
            alt={evento.titulo}
            className="w-full h-[420px] object-cover"
          />
        ) : (
          <div className="w-full h-[420px] flex items-center justify-center text-gray-500">
            Sin flyer
          </div>
        )}

        <div className="p-6">
          <p className="text-sm text-verdeEsmeralda">
            {evento.fecha || "Fecha por confirmar"}
          </p>

          <h1 className="text-3xl font-bold mt-2">
            {evento.titulo}
          </h1>

          <p className="text-sm text-gray-400 mt-2">
            {evento.lugar || "Lugar por confirmar"}
          </p>

          <div className="mt-6">
            <h2 className="text-xl font-bold text-verdeEsmeralda mb-3">
              Sobre el evento
            </h2>

            <p className="text-gray-300 whitespace-pre-line leading-relaxed">
              {evento.descripcion ||
                "Este evento pertenece a la colectiva Crisálida."}
            </p>
          </div>
        </div>
      </div>

      {Array.isArray(evento.artistasInvitados) &&
        evento.artistasInvitados.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-verdeEsmeralda mb-5">
              Artistas invitados
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {evento.artistasInvitados.map((artista, index) => {
                const imageUrl = buildImageUrl(artista.imagenUrl);

                return (
                  <div
                    key={`${artista.nombre}-${index}`}
                    className="bg-[#050816] border border-gray-800 rounded-2xl overflow-hidden"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={artista.nombre}
                        className="w-full h-64 object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 flex items-center justify-center text-gray-500 text-sm">
                        Sin imagen
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="font-bold text-lg text-white">
                        {artista.nombre}
                      </h3>

                      <p className="text-sm text-verdeEsmeralda mt-1">
                        {artista.especialidad || "Artista invitado"}
                      </p>

                      <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                        {artista.descripcion ||
                          "Participante del evento."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </section>
  );
}