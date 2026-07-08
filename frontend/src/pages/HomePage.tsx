import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
      <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-xs text-neutral-400">
        Sin imagen
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-neutral-200" />
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
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
            {eyebrow}
          </p>
        ) : null}

        <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-neutral-950">
          {title}
        </h2>

        {description ? (
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-neutral-600">
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
      className="group w-full text-left rounded-[26px] bg-white border border-neutral-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-[4/5] bg-neutral-100 overflow-hidden">
        <SafeImage
          src={imageUrl}
          alt={work.titulo}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.045]"
        />

        <div className="absolute left-3 top-3 rounded-full bg-white/90 backdrop-blur px-3 py-1 text-[11px] font-bold text-neutral-800 shadow-sm">
          Stock: {Number(work.stock ?? 0)}
        </div>

        <div className="absolute right-3 top-3 rounded-full bg-black text-white px-3 py-1 text-[11px] font-bold shadow-sm">
          Bs {toNumber(work.precio).toFixed(2)}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 line-clamp-1">
          {work.artista?.nombre ?? "Colectiva Crisálida"}
        </p>

        <h3 className="mt-2 text-base sm:text-lg font-black text-neutral-950 leading-tight line-clamp-2">
          {work.titulo}
        </h3>

        <p className="mt-2 text-sm text-neutral-500 line-clamp-2">
          {work.descripcion || "Obra disponible en Crisálida Market."}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-neutral-950">Ver detalle</span>

          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-white transition group-hover:bg-emerald-600">
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
      <div className="flex gap-4 overflow-x-auto px-4 sm:px-0 pb-5 snap-x snap-mandatory scroll-smooth">
        {works.map((work) => (
          <div
            key={work.id}
            className="min-w-[82%] sm:min-w-[330px] lg:min-w-[310px] snap-start"
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
            className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-bold text-neutral-950 hover:bg-neutral-950 hover:text-white transition"
          >
            Consultar eventos →
          </Link>
        }
      />

      {loadingEventos ? (
        <div className="rounded-[30px] border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm">
          Cargando eventos...
        </div>
      ) : !activeEvento || !activeFlyer ? (
        <div className="rounded-[30px] border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm">
          Próximamente anunciaremos nuevos eventos.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-12">
          <Link
            to={`/eventos/${activeEvento.id}`}
            className="group block overflow-hidden rounded-[34px] bg-white border border-neutral-200 shadow-sm lg:col-span-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeEvento.id}
                className="relative aspect-[4/5] sm:aspect-[16/9] lg:h-[540px] lg:aspect-auto overflow-hidden"
                initial={{ opacity: 0, scale: 1.015 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.55, ease: "easeInOut" }}
              >
                <SafeImage
                  src={activeFlyer}
                  alt={activeEvento.titulo}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                    {activeEvento.fecha || "Fecha por confirmar"}
                  </p>

                  <h3 className="mt-2 max-w-3xl text-2xl sm:text-4xl font-black text-white leading-tight">
                    {activeEvento.titulo}
                  </h3>

                  <p className="mt-3 text-sm sm:text-base text-white/75 line-clamp-2">
                    {activeEvento.lugar || "Lugar por confirmar"}
                  </p>

                  <p className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-neutral-950">
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
                  className={`text-left rounded-[26px] p-3 flex gap-3 items-center transition border shadow-sm ${
                    isActive
                      ? "bg-neutral-950 border-neutral-950 text-white"
                      : "bg-white border-neutral-200 text-neutral-950 hover:border-neutral-400"
                  }`}
                >
                  <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-[20px] overflow-hidden bg-neutral-100 shrink-0">
                    <SafeImage
                      src={flyerUrl}
                      alt={evento.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
                        isActive ? "text-emerald-300" : "text-emerald-700"
                      }`}
                    >
                      {idx === 0 ? "Destacado" : "Evento"}
                    </p>

                    <h4 className="mt-1 text-sm sm:text-base font-black line-clamp-2">
                      {evento.titulo}
                    </h4>

                    <p
                      className={`mt-1 text-xs line-clamp-1 ${
                        isActive ? "text-white/70" : "text-neutral-500"
                      }`}
                    >
                      {evento.fecha || "Fecha por confirmar"}
                    </p>

                    <p
                      className={`mt-1 text-xs line-clamp-1 ${
                        isActive ? "text-white/55" : "text-neutral-400"
                      }`}
                    >
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

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f5f5] text-neutral-950">
      <main className="flex-1">
        <Shell className="pt-5">
          <div className="rounded-[30px] bg-neutral-950 text-white overflow-hidden shadow-sm">
            <div className="flex flex-col gap-4 px-5 py-4 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
              <Link to="/" className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white text-neutral-950 flex items-center justify-center font-black">
                  C
                </div>

                <div>
                  <p className="text-sm font-black leading-none">
                    Crisálida Market
                  </p>
                  <p className="mt-1 text-[11px] text-white/55">
                    Arte · Galería · Tienda
                  </p>
                </div>
              </Link>

              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <Link
                  to="/museo"
                  className="rounded-full px-4 py-2 text-white/75 hover:bg-white hover:text-neutral-950 transition"
                >
                  Galería
                </Link>

                <Link
                  to="/tienda"
                  className="rounded-full px-4 py-2 text-white/75 hover:bg-white hover:text-neutral-950 transition"
                >
                  Tienda
                </Link>

                <Link
                  to="/artistas"
                  className="rounded-full px-4 py-2 text-white/75 hover:bg-white hover:text-neutral-950 transition"
                >
                  Artistas
                </Link>

                <Link
                  to="/contacto"
                  className="rounded-full bg-white px-4 py-2 font-bold text-neutral-950 hover:bg-emerald-400 transition"
                >
                  Contacto
                </Link>
              </div>
            </div>
          </div>
        </Shell>

        <Shell className="pt-6 pb-10">
          <div className="grid lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-8">
              <div className="relative overflow-hidden rounded-[38px] bg-white border border-neutral-200 shadow-sm aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto lg:h-[68vh] lg:min-h-[480px] lg:max-h-[720px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-sm animate-pulse text-neutral-500">
                    Cargando obras...
                  </div>
                ) : !active || !activeImage ? (
                  <div className="h-full flex items-center justify-center text-sm text-neutral-500">
                    No hay obras con imagen aún. Sube obras desde Admin.
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.button
                      key={active.id}
                      type="button"
                      className="absolute inset-0 text-left"
                      onClick={() => goToWork(active.id)}
                      aria-label={`Abrir obra: ${active.titulo}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <motion.div
                        className="absolute inset-0"
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        transition={{ duration: 0.7, ease: "easeInOut" }}
                      >
                        <SafeImage
                          src={activeImage}
                          alt={active.titulo}
                          eager
                          className="w-full h-full object-cover"
                        />
                      </motion.div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                      <div className="absolute left-5 top-5 sm:left-7 sm:top-7">
                        <span className="inline-flex rounded-full bg-white/95 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-neutral-950 shadow-sm">
                          Obra destacada
                        </span>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 lg:p-10">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                          {active.artista?.nombre ?? "Colectiva Crisálida"}
                        </p>

                        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                          <div className="max-w-3xl">
                            <h1 className="text-3xl sm:text-5xl font-black leading-[0.95] tracking-tight text-white">
                              {active.titulo}
                            </h1>

                            {active.descripcion ? (
                              <p className="mt-4 max-w-2xl text-sm sm:text-base text-white/78 line-clamp-2">
                                {active.descripcion}
                              </p>
                            ) : null}

                            <div className="mt-6 flex flex-wrap gap-3">
                              <span className="rounded-full bg-white px-5 py-3 text-sm font-black text-neutral-950">
                                Ver obra
                              </span>

                              <span className="rounded-full border border-white/25 bg-white/10 backdrop-blur px-5 py-3 text-sm font-bold text-white">
                                Stock: {Number(active.stock ?? 0)}
                              </span>
                            </div>
                          </div>

                          <div className="sm:text-right">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                              Precio
                            </p>

                            <p className="mt-1 text-3xl sm:text-4xl font-black text-white">
                              {toNumber(active.precio).toFixed(2)} Bs
                            </p>
                          </div>
                        </div>

                        <div className="mt-7 flex items-center gap-2">
                          {works.slice(0, Math.min(works.length, 6)).map((w) => {
                            const isActive = w.id === active.id;

                            return (
                              <div
                                key={w.id}
                                className={`h-1.5 rounded-full transition-all ${
                                  isActive
                                    ? "w-10 bg-emerald-400"
                                    : "w-3 bg-white/35"
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
              <div className="h-full rounded-[38px] bg-white border border-neutral-200 p-5 sm:p-7 shadow-sm">
                <div className="rounded-[28px] bg-neutral-950 text-white p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                    Online Gallery
                  </p>

                  <h2 className="mt-3 text-2xl sm:text-3xl font-black leading-tight">
                    Tu viaje con Crisálida comienza ahora
                  </h2>

                  <p className="mt-3 text-sm text-white/65">
                    Explora piezas, visita la galería o compra desde la tienda.
                  </p>
                </div>

                <div className="mt-4 grid gap-3">
                  <Link
                    to="/museo"
                    className="group rounded-[24px] border border-neutral-200 bg-neutral-50 px-5 py-4 hover:bg-neutral-950 transition"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 group-hover:text-emerald-300">
                      Galería
                    </p>

                    <p className="mt-1 text-base font-black text-neutral-950 group-hover:text-white">
                      Ver obras completas
                    </p>

                    <p className="mt-1 text-xs text-neutral-500 group-hover:text-white/60">
                      Navega como exposición.
                    </p>
                  </Link>

                  <Link
                    to="/tienda"
                    className="group rounded-[24px] border border-neutral-200 bg-neutral-50 px-5 py-4 hover:bg-neutral-950 transition"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 group-hover:text-emerald-300">
                      Tienda
                    </p>

                    <p className="mt-1 text-base font-black text-neutral-950 group-hover:text-white">
                      Comprar prints / obras
                    </p>

                    <p className="mt-1 text-xs text-neutral-500 group-hover:text-white/60">
                      Ordena y consulta disponibilidad.
                    </p>
                  </Link>

                  <Link
                    to="/artistas"
                    className="group rounded-[24px] border border-neutral-200 bg-neutral-50 px-5 py-4 hover:bg-neutral-950 transition"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 group-hover:text-emerald-300">
                      Artistas
                    </p>

                    <p className="mt-1 text-base font-black text-neutral-950 group-hover:text-white">
                      Conoce la colectiva
                    </p>

                    <p className="mt-1 text-xs text-neutral-500 group-hover:text-white/60">
                      Biografías, obras y estilos.
                    </p>
                  </Link>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => void loadWorks()}
                    className="flex-1 rounded-full bg-neutral-950 px-5 py-3 text-sm font-black text-white hover:bg-emerald-600 transition"
                  >
                    Actualizar
                  </button>

                  <Link
                    to="/contacto"
                    className="flex-1 rounded-full border border-neutral-300 px-5 py-3 text-center text-sm font-black text-neutral-950 hover:bg-neutral-950 hover:text-white transition"
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
                className="rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <p className="text-base font-black text-neutral-950">{title}</p>
                <p className="mt-1 text-sm text-neutral-500">{text}</p>
              </div>
            ))}
          </div>
        </Shell>

        <EventosProSection />

        <Shell className="pb-12">
          <div className="rounded-[34px] bg-white border border-neutral-200 p-5 sm:p-8 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                  Buscar arte
                </p>

                <h2 className="mt-2 text-2xl sm:text-3xl font-black text-neutral-950">
                  Encuentra tu obra ideal
                </h2>

                <p className="mt-2 text-sm text-neutral-500">
                  Busca por título, artista o descripción.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-[620px]">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-full border border-neutral-300 bg-neutral-50 px-5 py-4 text-sm text-neutral-950 outline-none focus:border-neutral-950"
                  placeholder="Ej: Metamorfosis, Antonella, Grabado..."
                />

                <button
                  type="button"
                  className="rounded-full bg-neutral-950 px-6 py-4 text-sm font-black text-white hover:bg-emerald-600 transition"
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
                  <div className="sm:col-span-2 lg:col-span-4 rounded-[24px] bg-neutral-50 border border-neutral-200 p-6 text-sm text-neutral-500">
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
                className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-5 py-3 text-sm font-black text-white hover:bg-emerald-600 transition"
              >
                Ver todo →
              </Link>
            }
          />

          {loading ? (
            <div className="rounded-[30px] border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm">
              Cargando galería...
            </div>
          ) : works.length === 0 ? (
            <div className="rounded-[30px] border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm">
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
            <div className="rounded-[30px] border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm">
              Cargando piezas recomendadas...
            </div>
          ) : works.length === 0 ? (
            <div className="rounded-[30px] border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm">
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
          <div className="relative overflow-hidden rounded-[38px] bg-neutral-950 p-7 sm:p-10 text-white shadow-sm">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                  Crisálida Market
                </p>

                <h4 className="mt-3 text-2xl sm:text-4xl font-black leading-tight">
                  Compra piezas y prints exclusivos de la colectiva.
                </h4>

                <p className="mt-3 text-sm sm:text-base text-white/65">
                  Un bloque comercial más fuerte para que la página se sienta
                  como una tienda artística moderna.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/tienda"
                  className="rounded-full bg-white px-6 py-4 text-center text-sm font-black text-neutral-950 hover:bg-emerald-400 transition"
                >
                  Ir a la Tienda
                </Link>

                <Link
                  to="/contacto"
                  className="rounded-full border border-white/25 px-6 py-4 text-center text-sm font-black text-white hover:bg-white hover:text-neutral-950 transition"
                >
                  Pedidos personalizados
                </Link>
              </div>
            </div>
          </div>
        </Shell>
      </main>

      <footer className="border-t border-neutral-200 bg-white">
        <Shell className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-500">
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