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

function Shell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`w-full px-4 sm:px-6 lg:px-10 2xl:px-16 ${className}`}>
      <div className="mx-auto w-full max-w-[1480px]">{children}</div>
    </section>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[34px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900 ${className}`}
    >
      {children}
    </div>
  );
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
      <div className="min-h-screen bg-[#f4f5f5] text-neutral-950 dark:bg-neutral-950 dark:text-white">
        <Shell className="py-10">
          <Panel className="p-8">
            <p className="animate-pulse text-sm text-neutral-500 dark:text-white/55">
              Cargando evento...
            </p>
          </Panel>
        </Shell>
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="min-h-screen bg-[#f4f5f5] text-neutral-950 dark:bg-neutral-950 dark:text-white">
        <Shell className="py-10">
          <Panel className="p-8">
            <p className="mb-4 text-sm font-semibold text-red-500">
              {error ?? "Evento no encontrado."}
            </p>

            <Link
              to="/eventos"
              className="text-sm font-black text-emerald-700 hover:underline dark:text-emerald-300"
            >
              ← Volver a eventos
            </Link>
          </Panel>
        </Shell>
      </div>
    );
  }

  const flyer = getEventoImageUrl(evento.flyerUrl || evento.flyer);

  const artistas = Array.isArray(evento.artistasInvitados)
    ? evento.artistasInvitados
    : [];

  return (
    <div className="min-h-screen bg-[#f4f5f5] text-neutral-950 transition-colors duration-300 dark:bg-neutral-950 dark:text-white">
      <Shell className="py-8 lg:py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-500 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/10 dark:bg-neutral-900 dark:text-white/55 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"
        >
          ← Volver
        </button>

        <Panel className="overflow-hidden">
          <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="relative bg-neutral-100 dark:bg-white/5">
              {flyer ? (
                <div className="flex h-full min-h-[360px] items-center justify-center overflow-hidden lg:min-h-[560px]">
                  <img
                    src={flyer}
                    alt={evento.titulo}
                    className="h-full max-h-[820px] w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex min-h-[420px] items-center justify-center text-sm text-neutral-400 dark:text-white/35">
                  Sin flyer
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent xl:hidden" />
            </div>

            <div className="relative overflow-hidden border-t border-neutral-200 bg-emerald-50 p-6 dark:border-white/10 dark:bg-emerald-400/10 sm:p-8 lg:p-10 xl:border-l xl:border-t-0">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" />
              <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-white/70 blur-3xl dark:bg-white/5" />

              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                  Evento Crisálida
                </p>

                <p className="mt-5 text-sm font-black text-emerald-700 dark:text-emerald-300">
                  {evento.fecha || "Fecha por confirmar"}
                </p>

                <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-neutral-950 dark:text-white sm:text-5xl lg:text-6xl">
                  {evento.titulo}
                </h1>

                <p className="mt-4 text-base font-semibold text-neutral-600 dark:text-white/65">
                  {evento.lugar || "Lugar por confirmar"}
                </p>

                <div className="mt-8 rounded-[28px] border border-emerald-200 bg-white/70 p-5 dark:border-emerald-400/20 dark:bg-white/5">
                  <h2 className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                    Sobre el evento
                  </h2>

                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-600 dark:text-white/65 sm:text-base">
                    {evento.descripcion ||
                      "Este evento pertenece a la colectiva Crisálida."}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#artistas-invitados"
                    className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                  >
                    Ver artistas invitados
                  </a>

                  <Link
                    to="/eventos"
                    className="rounded-full border border-emerald-300 bg-white/60 px-6 py-3 text-sm font-black text-neutral-950 transition hover:bg-white dark:border-emerald-400/30 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  >
                    Más eventos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {artistas.length > 0 && (
          <section id="artistas-invitados" className="mt-12">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                  Participantes
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
                  Artistas invitados
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-neutral-500 dark:text-white/55">
                  Conoce a los artistas que forman parte de este evento y sus
                  obras registradas.
                </p>
              </div>

              <div className="w-fit rounded-full bg-emerald-100 px-5 py-2 text-sm font-black text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">
                {artistas.length} artistas
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {artistas.map((artista, index) => {
                const imageUrl = getEventoImageUrl(artista.imagenUrl);

                return (
                  <button
                    key={`${artista.nombre}-${index}`}
                    type="button"
                    onClick={() => setSelectedArtist(artista)}
                    className="group overflow-hidden rounded-[32px] border border-neutral-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-xl dark:border-white/10 dark:bg-neutral-900 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={artista.nombre}
                        className="mx-auto h-36 w-36 rounded-full border border-emerald-200 object-cover shadow-sm dark:border-emerald-400/20"
                      />
                    ) : (
                      <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-xs text-neutral-400 dark:border-white/10 dark:bg-white/5 dark:text-white/35">
                        Sin imagen
                      </div>
                    )}

                    <h3 className="mt-5 text-xl font-black text-neutral-950 dark:text-white">
                      {artista.nombre}
                    </h3>

                    <p className="mt-2 text-sm font-black text-emerald-700 dark:text-emerald-300">
                      {artista.especialidad || "Artista invitado"}
                    </p>

                    <p className="mt-4 text-xs font-black text-neutral-400 transition group-hover:text-emerald-700 dark:text-white/40 dark:group-hover:text-emerald-300">
                      Ver perfil y obras →
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {selectedArtist && (
          <Panel className="mt-12 overflow-hidden">
            <div className="relative border-b border-neutral-200 bg-emerald-50 p-6 dark:border-white/10 dark:bg-emerald-400/10 sm:p-8 lg:p-10">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" />

              <button
                type="button"
                onClick={() => setSelectedArtist(null)}
                className="relative mb-6 rounded-full border border-emerald-300 bg-white/70 px-4 py-2 text-xs font-black text-neutral-700 transition hover:bg-white hover:text-emerald-700 dark:border-emerald-400/20 dark:bg-white/5 dark:text-white/65 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"
              >
                ← Cerrar perfil
              </button>

              <div className="relative grid gap-8 lg:grid-cols-[260px_1fr] lg:items-start">
                {getEventoImageUrl(selectedArtist.imagenUrl) ? (
                  <img
                    src={getEventoImageUrl(selectedArtist.imagenUrl) ?? ""}
                    alt={selectedArtist.nombre}
                    className="h-[260px] w-[260px] rounded-[34px] border border-emerald-200 object-cover shadow-sm dark:border-emerald-400/20"
                  />
                ) : (
                  <div className="flex h-[260px] w-[260px] items-center justify-center rounded-[34px] border border-neutral-200 bg-white/70 text-sm text-neutral-400 dark:border-white/10 dark:bg-white/5 dark:text-white/35">
                    Sin imagen
                  </div>
                )}

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                    Artista invitado
                  </p>

                  <h2 className="mt-3 text-4xl font-black leading-tight text-neutral-950 dark:text-white sm:text-5xl">
                    {selectedArtist.nombre}
                  </h2>

                  <p className="mt-3 text-lg font-black text-emerald-700 dark:text-emerald-300">
                    {selectedArtist.especialidad || "Artista invitado"}
                  </p>

                  <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-neutral-600 dark:text-white/65 sm:text-base">
                    {selectedArtist.descripcion || "Participante del evento."}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                  Obras
                </p>

                <h3 className="mt-2 text-3xl font-black text-neutral-950 dark:text-white">
                  Obras de {selectedArtist.nombre}
                </h3>
              </div>

              {!selectedArtist.obras || selectedArtist.obras.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-neutral-300 bg-neutral-50 p-8 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
                  Este artista invitado aún no tiene obras registradas en este
                  evento.
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {selectedArtist.obras.map((obra, index) => {
                    const obraImg = getEventoImageUrl(obra.imagenUrl);

                    return (
                      <article
                        key={`${obra.titulo}-${index}`}
                        className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl dark:border-white/10 dark:bg-neutral-950 dark:hover:border-emerald-400/40"
                      >
                        {obraImg ? (
                          <div className="flex h-[420px] w-full items-center justify-center overflow-hidden bg-neutral-100 dark:bg-white/5">
                            <img
                              src={obraImg}
                              alt={obra.titulo}
                              className="h-full w-full object-contain p-2"
                            />
                          </div>
                        ) : (
                          <div className="flex h-[420px] w-full items-center justify-center text-sm text-neutral-400 dark:text-white/35">
                            Sin imagen
                          </div>
                        )}

                        <div className="p-5">
                          <h4 className="text-2xl font-black text-neutral-950 dark:text-white">
                            {obra.titulo}
                          </h4>

                          <p className="mt-2 text-sm font-black text-emerald-700 dark:text-emerald-300">
                            {obra.tecnica || "Técnica no especificada"}
                            {obra.anio ? ` · ${obra.anio}` : ""}
                          </p>

                          <p className="mt-5 text-sm leading-relaxed text-neutral-500 dark:text-white/55">
                            {obra.descripcion || "Sin descripción."}
                          </p>

                          {obra.precio && (
                            <p className="mt-5 text-xl font-black text-neutral-950 dark:text-white">
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
          </Panel>
        )}
      </Shell>
    </div>
  );
}