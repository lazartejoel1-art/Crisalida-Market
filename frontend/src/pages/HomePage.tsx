import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { buildImageUrl, fetchObras } from "../services/api";

type Work = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  precio: number | string;
  imagen?: string | null;
  imagenUrl?: string | null;
  stock: number;
  artista?: {
    id: number;
    nombre: string;
  };
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
};

const API =
  import.meta.env.VITE_API_URL || "https://crisalida-market.onrender.com";

function toNumber(v: number | string) {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function getWorkImage(work: Work): string | null {
  return buildImageUrl(work.imagenUrl || work.imagen);
}

function SafeImage({
  src,
  alt,
  className = "",
  eager = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-xs text-neutral-400 dark:bg-white/5 dark:text-white/35">
        Sin imagen
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-neutral-200 dark:bg-white/10" />
      )}

      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`${className} ${loaded ? "opacity-100" : "opacity-0"}`}
        draggable={false}
      />
    </>
  );
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

function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
            {eyebrow}
          </p>
        ) : null}

        <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-3xl">
          {title}
        </h2>

        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-white/60 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function ProductCard({
  work,
  onOpen,
}: {
  work: Work;
  onOpen: (id: number) => void;
}) {
  const imageUrl = getWorkImage(work);

  return (
    <button
      type="button"
      onClick={() => onOpen(work.id)}
      className="group w-full overflow-hidden rounded-[26px] border border-neutral-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-neutral-900"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-white/5">
        <SafeImage
          src={imageUrl}
          alt={work.titulo}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.045]"
        />

        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black text-neutral-800 shadow-sm backdrop-blur dark:bg-black/70 dark:text-white">
          Stock: {Number(work.stock ?? 0)}
        </div>

        <div className="absolute right-3 top-3 rounded-full bg-neutral-950 px-3 py-1 text-[11px] font-black text-white shadow-sm dark:bg-emerald-400 dark:text-black">
          Bs {toNumber(work.precio).toFixed(2)}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <p className="line-clamp-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
          {work.artista?.nombre ?? "Colectiva Crisálida"}
        </p>

        <h3 className="mt-2 line-clamp-2 text-base font-black leading-tight text-neutral-950 dark:text-white sm:text-lg">
          {work.titulo}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm text-neutral-500 dark:text-white/55">
          {work.descripcion || "Obra disponible en Crisálida Market."}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm font-black text-neutral-950 dark:text-white">
            Ver detalle
          </span>

          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-white transition group-hover:bg-emerald-600 dark:bg-white dark:text-black dark:group-hover:bg-emerald-400">
            →
          </span>
        </div>
      </div>
    </button>
  );
}

function WorksCarousel({
  works,
  onOpen,
}: {
  works: Work[];
  onOpen: (id: number) => void;
}) {
  return (
    <div className="-mx-4 sm:mx-0">
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-5 sm:px-0">
        {works.map((work) => (
          <div
            key={work.id}
            className="min-w-[82%] snap-start sm:min-w-[330px] lg:min-w-[310px]"
          >
            <ProductCard work={work} onOpen={onOpen} />
          </div>
        ))}
      </div>
    </div>
  );
}

function EventosProSection() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [eventoIndex, setEventoIndex] = useState(0);

  useEffect(() => {
    let alive = true;

    async function loadEventos() {
      try {
        const res = await fetch(`${API}/eventos/activos`);
        if (!res.ok) throw new Error("No se pudieron cargar los eventos.");

        const data = (await res.json()) as Evento[];
        const clean = Array.isArray(data)
          ? data.filter((evento) => Boolean(evento.flyerUrl || evento.flyer))
          : [];

        if (alive) {
          setEventos(clean);
          setEventoIndex(0);
        }
      } catch (error) {
        console.error(error);
        if (alive) setEventos([]);
      } finally {
        if (alive) setLoadingEventos(false);
      }
    }

    void loadEventos();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (eventos.length <= 1) return;

    const timer = window.setInterval(() => {
      setEventoIndex((prev) => (prev + 1) % eventos.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [eventos.length]);

  const activeEvento = useMemo(() => {
    if (!eventos.length) return null;
    return eventos[Math.min(eventoIndex, eventos.length - 1)];
  }, [eventos, eventoIndex]);

  const activeFlyer = activeEvento
    ? buildImageUrl(activeEvento.flyerUrl || activeEvento.flyer)
    : null;

  const previewEventos = useMemo(() => {
    if (!eventos.length) return [];
    return [...eventos.slice(eventoIndex), ...eventos.slice(0, eventoIndex)].slice(
      0,
      4,
    );
  }, [eventos, eventoIndex]);

  return (
    <Shell className="py-12">
      <SectionTitle
        eyebrow="Agenda Crisálida"
        title="Eventos y exposiciones"
        description="Flyers, inauguraciones y actividades destacadas de la colectiva."
        action={
          <Link
            to="/contacto"
            className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-black text-neutral-950 transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:hover:bg-emerald-400/10"
          >
            Consultar eventos →
          </Link>
        }
      />

      {loadingEventos ? (
        <div className="rounded-[30px] border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-white/55">
          Cargando eventos...
        </div>
      ) : !activeEvento || !activeFlyer ? (
        <div className="rounded-[30px] border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-white/55">
          Próximamente anunciaremos nuevos eventos.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-12">
          <Link
            to={`/eventos/${activeEvento.id}`}
            className="group block overflow-hidden rounded-[34px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900 lg:col-span-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeEvento.id}
                className="relative aspect-[4/5] overflow-hidden sm:aspect-[16/9] lg:h-[540px] lg:aspect-auto"
                initial={{ opacity: 0, scale: 1.015 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.55, ease: "easeInOut" }}
              >
                <SafeImage
                  src={activeFlyer}
                  alt={activeEvento.titulo}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                    {activeEvento.fecha || "Fecha por confirmar"}
                  </p>

                  <h3 className="mt-2 max-w-3xl text-2xl font-black leading-tight text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)] sm:text-4xl">
                    {activeEvento.titulo}
                  </h3>

                  <p className="mt-3 line-clamp-2 text-sm text-white/85 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-base">
                    {activeEvento.lugar || "Lugar por confirmar"}
                  </p>

                  <p className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-neutral-950">
                    Ver detalle del evento
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </Link>

          <div className="grid gap-3 lg:col-span-4">
            {previewEventos.map((evento, idx) => {
              const flyerUrl = buildImageUrl(evento.flyerUrl || evento.flyer);
              const isActive = evento.id === activeEvento.id;

              return (
                <button
                  key={evento.id}
                  type="button"
                  onClick={() => {
                    const nextIndex = eventos.findIndex(
                      (item) => item.id === evento.id,
                    );
                    if (nextIndex >= 0) setEventoIndex(nextIndex);
                  }}
                  className={`flex items-center gap-3 rounded-[26px] border p-3 text-left shadow-sm transition ${
                    isActive
                      ? "border-emerald-300 bg-emerald-50 text-neutral-950 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-white"
                      : "border-neutral-200 bg-white text-neutral-950 hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10"
                  }`}
                >
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-[20px] bg-neutral-100 dark:bg-white/5 sm:h-32 sm:w-28">
                    <SafeImage
                      src={flyerUrl}
                      alt={evento.titulo}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                      {idx === 0 ? "Destacado" : "Evento"}
                    </p>

                    <h4 className="mt-1 line-clamp-2 text-sm font-black sm:text-base">
                      {evento.titulo}
                    </h4>

                    <p className="mt-1 line-clamp-1 text-xs text-neutral-500 dark:text-white/55">
                      {evento.fecha || "Fecha por confirmar"}
                    </p>

                    <p className="mt-1 line-clamp-1 text-xs text-neutral-400 dark:text-white/40">
                      {evento.lugar || "Lugar por confirmar"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Shell>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState("");

  const loadWorks = async () => {
    setLoading(true);

    try {
      const data = await fetchObras();

      const clean = (Array.isArray(data) ? data : []).filter((w) =>
        Boolean(w.imagenUrl || w.imagen),
      );

      setWorks(clean);
      setIndex(0);
    } catch (e) {
      console.error(e);
      setWorks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorks();
  }, []);

  useEffect(() => {
    if (!works.length) return;

    const t = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % works.length);
    }, 7000);

    return () => window.clearInterval(t);
  }, [works.length]);

  const active = useMemo(() => {
    if (!works.length) return null;
    return works[Math.min(index, works.length - 1)];
  }, [works, index]);

  const activeImage = active ? getWorkImage(active) : null;

  const cascadeWorks = useMemo(() => {
    if (!works.length) return [];
    const rotated = [...works.slice(index), ...works.slice(0, index)];
    return rotated.slice(0, 12);
  }, [works, index]);

  const filteredWorks = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return works.slice(0, 8);

    return works
      .filter((work) => {
        const title = work.titulo?.toLowerCase() || "";
        const artist = work.artista?.nombre?.toLowerCase() || "";
        const description = work.descripcion?.toLowerCase() || "";

        return title.includes(q) || artist.includes(q) || description.includes(q);
      })
      .slice(0, 8);
  }, [works, query]);

  const goToWork = (id: number) => navigate(`/obra/${id}`);

  const nextWork = () => {
    if (!works.length) return;
    setIndex((prev) => (prev + 1) % works.length);
  };

  const prevWork = () => {
    if (!works.length) return;
    setIndex((prev) => (prev - 1 + works.length) % works.length);
  };

  const handleHeroDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -55 || velocity < -450) {
      nextWork();
    }

    if (offset > 55 || velocity > 450) {
      prevWork();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f5f5] text-neutral-950 transition-colors duration-300 dark:bg-neutral-950 dark:text-white">
      <main className="flex-1">
        <Shell className="pt-6 pb-10">
          <div className="grid items-stretch gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="relative overflow-hidden rounded-[38px] border border-neutral-200 bg-white shadow-sm aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto lg:h-[68vh] lg:min-h-[480px] lg:max-h-[720px] dark:border-white/10 dark:bg-neutral-900">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-sm text-neutral-500 animate-pulse dark:text-white/55">
                    Cargando obras...
                  </div>
                ) : !active || !activeImage ? (
                  <div className="flex h-full items-center justify-center text-sm text-neutral-500 dark:text-white/55">
                    No hay obras con imagen aún. Sube obras desde Admin.
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.button
                      key={active.id}
                      type="button"
                      className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
                      onClick={() => goToWork(active.id)}
                      aria-label={`Abrir obra: ${active.titulo}`}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.18}
                      onDragEnd={handleHeroDragEnd}
                      initial={{ opacity: 0, x: 35 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -35 }}
                      transition={{ duration: 0.32, ease: "easeOut" }}
                    >
                      <motion.div className="absolute inset-0">
                        <SafeImage
                          src={activeImage}
                          alt={active.titulo}
                          eager
                          className="h-full w-full object-cover"
                        />
                      </motion.div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                      <div className="absolute left-5 top-5 sm:left-7 sm:top-7">
                        <span className="inline-flex rounded-full bg-white/95 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-neutral-950 shadow-sm">
                          Obra destacada
                        </span>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                        <div className="max-w-[88%] rounded-[24px] border border-white/15 bg-black/45 px-5 py-4 text-left shadow-lg backdrop-blur-md sm:max-w-xl sm:px-6 sm:py-5">
                          <p className="mb-2 max-w-full truncate text-[11px] font-black uppercase tracking-[0.16em] text-emerald-300">
                            {active.artista?.nombre ?? "Colectiva Crisálida"}
                          </p>

                          <h1 className="line-clamp-2 text-[22px] font-black leading-[1.08] tracking-tight text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.75)] sm:text-3xl lg:text-4xl">
                            {active.titulo}
                          </h1>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          {works.slice(0, Math.min(works.length, 8)).map((w) => {
                            const isActive = w.id === active.id;

                            return (
                              <span
                                key={w.id}
                                className={`h-1.5 rounded-full transition-all ${
                                  isActive
                                    ? "w-9 bg-emerald-400"
                                    : "w-3 bg-white/55 dark:bg-white/35"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </motion.button>
                  </AnimatePresence>
                )}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="h-full rounded-[38px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-7">
                <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 text-neutral-950 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-white">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                    Crisálida Market
                  </p>

                  <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
                    Tu viaje con Crisálida comienza ahora
                  </h2>

                  <p className="mt-3 text-sm text-neutral-600 dark:text-white/65">
                    Explora piezas, visita la galería o compra desde la tienda.
                  </p>
                </div>

                <div className="mt-4 grid gap-3">
                  <Link
                    to="/museo"
                    className="group rounded-[24px] border border-neutral-200 bg-neutral-50 px-5 py-4 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                      Galería
                    </p>

                    <p className="mt-1 text-base font-black text-neutral-950 dark:text-white">
                      Ver obras completas
                    </p>

                    <p className="mt-1 text-xs text-neutral-500 dark:text-white/55">
                      Navega como exposición.
                    </p>
                  </Link>

                  <Link
                    to="/tienda"
                    className="group rounded-[24px] border border-neutral-200 bg-neutral-50 px-5 py-4 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                      Tienda
                    </p>

                    <p className="mt-1 text-base font-black text-neutral-950 dark:text-white">
                      Comprar prints / obras
                    </p>

                    <p className="mt-1 text-xs text-neutral-500 dark:text-white/55">
                      Ordena y consulta disponibilidad.
                    </p>
                  </Link>

                  <Link
                    to="/artistas"
                    className="group rounded-[24px] border border-neutral-200 bg-neutral-50 px-5 py-4 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                      Artistas
                    </p>

                    <p className="mt-1 text-base font-black text-neutral-950 dark:text-white">
                      Conoce la colectiva
                    </p>

                    <p className="mt-1 text-xs text-neutral-500 dark:text-white/55">
                      Biografías, obras y estilos.
                    </p>
                  </Link>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void loadWorks()}
                    className="flex-1 rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                  >
                    Actualizar
                  </button>

                  <Link
                    to="/contacto"
                    className="flex-1 rounded-full border border-neutral-300 px-5 py-3 text-center text-sm font-black text-neutral-950 transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-white/10 dark:text-white dark:hover:bg-emerald-400/10"
                  >
                    Contacto
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Shell>

        <Shell className="pb-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Galería online", "Obras disponibles para explorar"],
              ["Compra directa", "Consulta piezas y prints"],
              ["Artistas locales", "Talento visual desde Bolivia"],
              ["Eventos", "Exposiciones y actividades"],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900"
              >
                <p className="text-base font-black text-neutral-950 dark:text-white">
                  {title}
                </p>

                <p className="mt-1 text-sm text-neutral-500 dark:text-white/55">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </Shell>

        <EventosProSection />

        <Shell className="pb-12">
          <div className="rounded-[34px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                  Buscar arte
                </p>

                <h2 className="mt-2 text-2xl font-black text-neutral-950 dark:text-white sm:text-3xl">
                  Encuentra tu obra ideal
                </h2>

                <p className="mt-2 text-sm text-neutral-500 dark:text-white/55">
                  Busca por título, artista o descripción.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-[620px]">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-full border border-neutral-300 bg-neutral-50 px-5 py-4 text-sm text-neutral-950 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-emerald-400"
                  placeholder="Ej: Metamorfosis, Antonella, Grabado..."
                />

                <button
                  type="button"
                  className="rounded-full bg-emerald-600 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                  onClick={() => navigate("/museo")}
                >
                  Ir a galería
                </button>
              </div>
            </div>

            {query.trim() ? (
              <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {filteredWorks.length > 0 ? (
                  filteredWorks.map((work) => (
                    <ProductCard key={work.id} work={work} onOpen={goToWork} />
                  ))
                ) : (
                  <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55 sm:col-span-2 lg:col-span-4">
                    No se encontraron obras con esa búsqueda.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </Shell>

        <Shell className="pb-12">
          <SectionTitle
            eyebrow="Colección"
            title="Obras en movimiento"
            description="Desliza horizontalmente y explora las piezas destacadas de Crisálida Market."
            action={
              <Link
                to="/museo"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
              >
                Ver todo →
              </Link>
            }
          />

          {loading ? (
            <div className="rounded-[30px] border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-white/55">
              Cargando galería...
            </div>
          ) : works.length === 0 ? (
            <div className="rounded-[30px] border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-white/55">
              No hay obras con imagen todavía. Sube obras desde Admin.
            </div>
          ) : (
            <WorksCarousel works={cascadeWorks} onOpen={goToWork} />
          )}
        </Shell>

        <Shell className="pb-14">
          <SectionTitle
            eyebrow="Tienda"
            title="Piezas recomendadas"
            description="Una vista tipo catálogo para que la página se sienta más comercial, limpia y moderna."
          />

          {loading ? (
            <div className="rounded-[30px] border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-white/55">
              Cargando piezas recomendadas...
            </div>
          ) : works.length === 0 ? (
            <div className="rounded-[30px] border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-white/55">
              No hay obras disponibles.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {works.slice(0, 8).map((work) => (
                <ProductCard key={work.id} work={work} onOpen={goToWork} />
              ))}
            </div>
          )}
        </Shell>

        <Shell className="pb-16">
          <div className="relative overflow-hidden rounded-[38px] border border-emerald-200 bg-emerald-50 p-7 text-neutral-950 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-white sm:p-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-white/40 blur-3xl dark:bg-white/5" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                  Crisálida Market
                </p>

                <h4 className="mt-3 text-2xl font-black leading-tight sm:text-4xl">
                  Compra piezas y prints exclusivos de la colectiva.
                </h4>

                <p className="mt-3 text-sm text-neutral-600 dark:text-white/65 sm:text-base">
                  Un bloque comercial más fuerte para que la página se sienta
                  como una tienda artística moderna.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/tienda"
                  className="rounded-full bg-emerald-600 px-6 py-4 text-center text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                >
                  Ir a la Tienda
                </Link>

                <Link
                  to="/contacto"
                  className="rounded-full border border-emerald-300 px-6 py-4 text-center text-sm font-black text-neutral-950 transition hover:bg-white dark:border-emerald-400/30 dark:text-white dark:hover:bg-white/10"
                >
                  Pedidos personalizados
                </Link>
              </div>
            </div>
          </div>
        </Shell>
      </main>

      <footer className="border-t border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900">
        <Shell className="py-6">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-neutral-500 dark:text-white/45 sm:flex-row">
            <p>
              © 2025 Colectiva de Arte Crisálida. Todos los derechos reservados.
            </p>

            <p>By Joel Lazarte</p>
          </div>
        </Shell>
      </footer>
    </div>
  );
}