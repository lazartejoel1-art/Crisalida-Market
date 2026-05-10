import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_URL, buildImageUrl } from "../services/api";

type ObraArtistaInvitado = {
  titulo: string;
  tecnica?: string;
  anio?: string;
  descripcion?: string;
  imagenUrl?: string;
  precio?: string;
};

type ArtistaInvitadoEvento = {
  nombre: string;
  especialidad?: string;
  descripcion?: string;
  imagenUrl?: string;
  obras?: ObraArtistaInvitado[];
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

function getEventoImageUrl(image?: string | null): string | null {
  if (!image || String(image).trim() === "") return null;

  if (image.startsWith("data:image")) return image;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;

  return buildImageUrl(image);
}

export default function EventoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [selectedArtist, setSelectedArtist] =
    useState<ArtistaInvitadoEvento | null>(null);
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
      <section className="w-full min-h-screen px-3 lg:px-6 py-10 bg-gradient-to-b from-[#020617] via-[#040b1d] to-black">
        <p className="text-sm text-gray-400 animate-pulse">
          Cargando evento...
        </p>
      </section>
    );
  }

  if (error || !evento) {
    return (
      <section className="w-full min-h-screen px-3 lg:px-6 py-10 bg-gradient-to-b from-[#020617] via-[#040b1d] to-black">
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

  const flyer = getEventoImageUrl(evento.flyerUrl || evento.flyer);

  const artistas = Array.isArray(evento.artistasInvitados)
    ? evento.artistasInvitados
    : [];

  return (
    <section className="w-full min-h-screen px-3 lg:px-6 py-10 bg-gradient-to-b from-[#020617] via-[#040b1d] to-black text-white">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-xs text-gray-400 hover:text-verdeEsmeralda mb-5"
      >
        ← Volver
      </button>

      <div className="w-full bg-[#050816]/95 border border-emerald-500/10 rounded-[2rem] overflow-hidden shadow-2xl">
        {flyer ? (
          <div className="w-full bg-[#020617] flex items-center justify-center overflow-hidden">
            <img
              src={flyer}
              alt={evento.titulo}
              className="w-full max-h-[800px] object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-[420px] flex items-center justify-center text-gray-500">
            Sin flyer
          </div>
        )}

        <div className="p-6 lg:p-10">
          <p className="text-sm text-verdeEsmeralda font-semibold tracking-wide">
            {evento.fecha || "Fecha por confirmar"}
          </p>

          <h1 className="text-4xl lg:text-6xl font-black mt-3 tracking-tight">
            {evento.titulo}
          </h1>

          <p className="text-gray-400 mt-3 text-lg">
            {evento.lugar || "Lugar por confirmar"}
          </p>

          <div className="mt-8">
            <h2 className="text-2xl font-bold text-verdeEsmeralda mb-4">
              Sobre el evento
            </h2>

            <p className="text-gray-300 whitespace-pre-line leading-[2] text-[17px]">
              {evento.descripcion ||
                "Este evento pertenece a la colectiva Crisálida."}
            </p>
          </div>
        </div>
      </div>

      {artistas.length > 0 && (
        <div className="mt-14">
          <h2 className="text-3xl font-black text-verdeEsmeralda mb-8">
            Artistas invitados
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
            {artistas.map((artista, index) => {
              const imageUrl = getEventoImageUrl(artista.imagenUrl);

              return (
                <button
                  key={`${artista.nombre}-${index}`}
                  type="button"
                  onClick={() => setSelectedArtist(artista)}
                  className="bg-[#050816]/90 border border-gray-800 rounded-[2rem] p-6 text-center hover:border-verdeEsmeralda/60 hover:-translate-y-1 transition duration-300"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={artista.nombre}
                      className="w-36 h-36 rounded-full object-cover mx-auto border border-emerald-500/20"
                    />
                  ) : (
                    <div className="w-36 h-36 rounded-full mx-auto border border-gray-700 flex items-center justify-center text-gray-500 text-xs">
                      Sin imagen
                    </div>
                  )}

                  <h3 className="font-black text-xl text-white mt-5">
                    {artista.nombre}
                  </h3>

                  <p className="text-sm text-verdeEsmeralda mt-2">
                    {artista.especialidad || "Artista invitado"}
                  </p>

                  <p className="text-xs text-gray-400 mt-4">
                    Ver perfil y obras →
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedArtist && (
        <div className="mt-16 bg-[#050816]/95 border border-emerald-500/10 rounded-[2rem] p-6 lg:p-10 shadow-2xl">
          <button
            type="button"
            onClick={() => setSelectedArtist(null)}
            className="text-xs text-gray-400 hover:text-verdeEsmeralda mb-6"
          >
            ← Cerrar perfil
          </button>

          <div className="grid lg:grid-cols-[260px_1fr] gap-10 items-start">
            {getEventoImageUrl(selectedArtist.imagenUrl) ? (
              <img
                src={getEventoImageUrl(selectedArtist.imagenUrl) ?? ""}
                alt={selectedArtist.nombre}
                className="w-full max-w-[260px] rounded-[2rem] object-cover border border-emerald-500/10"
              />
            ) : (
              <div className="w-[260px] h-[260px] rounded-[2rem] border border-gray-700 flex items-center justify-center text-gray-500 text-sm">
                Sin imagen
              </div>
            )}

            <div>
              <h2 className="text-5xl font-black text-white">
                {selectedArtist.nombre}
              </h2>

              <p className="text-verdeEsmeralda mt-3 text-lg">
                {selectedArtist.especialidad || "Artista invitado"}
              </p>

              <p className="text-gray-300 mt-6 whitespace-pre-line leading-[2] text-[17px]">
                {selectedArtist.descripcion ||
                  "Participante del evento."}
              </p>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="text-3xl font-black text-verdeEsmeralda mb-8">
              Obras de {selectedArtist.nombre}
            </h3>

            {!selectedArtist.obras || selectedArtist.obras.length === 0 ? (
              <p className="text-sm text-gray-400">
                Este artista invitado aún no tiene obras registradas en este
                evento.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                {selectedArtist.obras.map((obra, index) => {
                  const obraImg = getEventoImageUrl(obra.imagenUrl);

                  return (
                    <article
                      key={`${obra.titulo}-${index}`}
                      className="bg-[#0e1624] border border-gray-800 rounded-[2rem] overflow-hidden hover:border-verdeEsmeralda/30 transition"
                    >
                      {obraImg ? (
                        <div className="w-full h-[420px] bg-[#020617] flex items-center justify-center overflow-hidden">
                          <img
                            src={obraImg}
                            alt={obra.titulo}
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-[420px] flex items-center justify-center text-gray-500 text-sm">
                          Sin imagen
                        </div>
                      )}

                      <div className="p-5">
                        <h4 className="font-black text-2xl text-white">
                          {obra.titulo}
                        </h4>

                        <p className="text-sm text-verdeEsmeralda mt-2">
                          {obra.tecnica || "Técnica no especificada"}
                          {obra.anio ? ` · ${obra.anio}` : ""}
                        </p>

                        <p className="text-gray-400 mt-5 leading-relaxed text-[15px]">
                          {obra.descripcion || "Sin descripción."}
                        </p>

                        {obra.precio && (
                          <p className="text-xl font-black text-white mt-5">
                            {obra.precio} Bs
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}