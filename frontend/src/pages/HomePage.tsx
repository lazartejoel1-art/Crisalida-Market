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
      <div className="w-full h-full flex items-center justify-center bg-white/5 text-xs text-white/45">
        Sin imagen
      </div>
    );
  }

  return (
    <>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-white/10" />}

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
    <Shell className="pb-10">
      <div
        className="relative overflow-hidden rounded-[34px] p-5 sm:p-7"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02))",
          border: "1px solid var(--c-border)",
        }}
      >
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.24em]"
              style={{ color: "var(--c-accent)" }}
            >
              Agenda Crisálida
            </p>

            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
              Eventos y exposiciones
            </h2>

            <p className="mt-1 text-sm" style={{ color: "var(--c-muted)" }}>
              Flyers, inauguraciones y actividades artísticas destacadas.
            </p>
          </div>

          <Link
            to="/contacto"
            className="text-sm font-semibold underline underline-offset-4"
            style={{ color: "var(--c-accent)" }}
          >
            Consultar próximos eventos →
          </Link>
        </div>

        {loadingEventos ? (
          <div
            className="relative rounded-3xl p-8 text-sm"
            style={{
              background: "var(--c-panel)",
              border: "1px solid var(--c-border)",
              color: "var(--c-muted)",
            }}
          >
            Cargando eventos...
          </div>
        ) : !activeEvento || !activeFlyer ? (
          <div
            className="relative rounded-3xl p-8 text-sm"
            style={{
              background: "var(--c-panel)",
              border: "1px solid var(--c-border)",
              color: "var(--c-muted)",
            }}
          >
            Próximamente anunciaremos nuevos eventos.
          </div>
        ) : (
          <div className="relative grid lg:grid-cols-12 gap-5">
            <Link
              to={`/eventos/${activeEvento.id}`}
              className="lg:col-span-7 group rounded-[30px] overflow-hidden block"
              style={{
                background: "var(--c-panel)",
                border: "1px solid var(--c-border)",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeEvento.id}
                  className="relative aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto lg:h-[520px] overflow-hidden"
                  initial={{ opacity: 0, scale: 1.015 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <SafeImage
                    src={activeFlyer}
                    alt={activeEvento.titulo}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "var(--c-accent)" }}
                    >
                      {activeEvento.fecha || "Fecha por confirmar"}
                    </p>

                    <h3 className="mt-1 text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                      {activeEvento.titulo}
                    </h3>

                    <p className="mt-2 text-sm text-white/75 line-clamp-2">
                      {activeEvento.lugar || "Lugar por confirmar"}
                    </p>

                    <p className="mt-4 text-xs text-white/70">
                      Click para ver detalle del evento
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </Link>

            <div className="lg:col-span-5 grid gap-3">
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
                    className="text-left rounded-3xl p-3 flex gap-3 items-center transition"
                    style={{
                      background: isActive
                        ? "rgba(255,255,255,0.075)"
                        : "var(--c-panel)",
                      border: isActive
                        ? "1px solid var(--c-accent)"
                        : "1px solid var(--c-border)",
                    }}
                  >
                    <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden bg-white/5 shrink-0">
                      <SafeImage
                        src={flyerUrl}
                        alt={evento.titulo}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <p
                        className="text-[11px] font-semibold"
                        style={{ color: "var(--c-accent)" }}
                      >
                        {idx === 0 ? "Destacado" : "Evento"}
                      </p>

                      <h4 className="text-sm sm:text-base font-bold text-white line-clamp-2">
                        {evento.titulo}
                      </h4>

                      <p
                        className="mt-1 text-xs line-clamp-1"
                        style={{ color: "var(--c-muted)" }}
                      >
                        {evento.fecha || "Fecha por confirmar"}
                      </p>

                      <p
                        className="mt-1 text-xs line-clamp-1"
                        style={{ color: "rgba(255,255,255,0.55)" }}
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
      </div>
    </Shell>
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
      <div className="flex gap-4 overflow-x-auto px-4 sm:px-0 pb-4 snap-x snap-mandatory scroll-smooth">
        {works.map((w) => {
          const imageUrl = getWorkImage(w);
          if (!imageUrl) return null;

          return (
            <button
              key={w.id}
              type="button"
              onClick={() => onOpen(w.id)}
              className="min-w-[82%] sm:min-w-[360px] lg:min-w-[320px] snap-start rounded-[28px] overflow-hidden text-left select-none"
              style={{
                background: "var(--c-panel)",
                border: "1px solid var(--c-border)",
              }}
            >
              <div className="relative w-full aspect-[4/5] overflow-hidden">
                <SafeImage
                  src={imageUrl}
                  alt={w.titulo}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-3">
                  <div className="bg-black/45 backdrop-blur px-3 py-2 rounded-2xl border border-white/10">
                    <p
                      className="text-[11px] font-semibold"
                      style={{ color: "var(--c-accent)" }}
                    >
                      {w.artista?.nombre ?? "Colectiva Crisálida"}
                    </p>

                    <p className="text-sm font-bold leading-tight text-white">
                      {w.titulo}
                    </p>
                  </div>

                  <div className="bg-black/45 backdrop-blur px-3 py-2 rounded-2xl border border-white/10 text-right">
                    <p className="text-[10px] text-white/70">Bs</p>

                    <p className="text-sm font-extrabold text-white">
                      {toNumber(w.precio).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 flex items-center justify-between">
                <p className="text-xs text-white/70 line-clamp-1">
                  {w.descripcion ?? "—"}
                </p>

                <span className="text-[11px] text-white/55">
                  Stock: {Number(w.stock ?? 0)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

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

  const goToWork = (id: number) => navigate(`/obra/${id}`);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--c-bg)", color: "var(--c-text)" }}
    >
      <main className="flex-1">
        <Shell className="pt-8 pb-10">
          <div className="grid lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-8">
              <div
                className="relative overflow-hidden rounded-3xl aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto lg:h-[66vh] lg:min-h-[460px] lg:max-h-[720px]"
                style={{
                  background: "var(--c-panel)",
                  border: "1px solid var(--c-border)",
                }}
              >
                {loading ? (
                  <div
                    className="h-full flex items-center justify-center text-sm animate-pulse"
                    style={{ color: "var(--c-muted)" }}
                  >
                    Cargando obras...
                  </div>
                ) : !active || !activeImage ? (
                  <div
                    className="h-full flex items-center justify-center text-sm"
                    style={{ color: "var(--c-muted)" }}
                  >
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

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                        <p
                          className="text-xs font-semibold tracking-wide"
                          style={{ color: "var(--c-accent)" }}
                        >
                          {active.artista?.nombre ?? "Colectiva Crisálida"}
                        </p>

                        <div className="mt-1 flex items-end justify-between gap-6">
                          <div className="max-w-[70%]">
                            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                              {active.titulo}
                            </h1>

                            {active.descripcion ? (
                              <p className="mt-2 text-sm text-white/80 line-clamp-2">
                                {active.descripcion}
                              </p>
                            ) : null}
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-white/70">Precio</p>

                            <p className="text-xl sm:text-2xl font-extrabold">
                              {toNumber(active.precio).toFixed(2)} Bs
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex items-center gap-2">
                          {works.slice(0, Math.min(works.length, 6)).map((w) => {
                            const isActive = w.id === active.id;

                            return (
                              <div
                                key={w.id}
                                className="h-1.5 rounded-full transition-all"
                                style={{
                                  width: isActive ? 34 : 12,
                                  background: isActive
                                    ? "var(--c-accent)"
                                    : "rgba(255,255,255,0.25)",
                                }}
                              />
                            );
                          })}
                        </div>

                        <p className="mt-3 text-[11px] text-white/70">
                          Click para ver la obra completa
                        </p>
                      </div>
                    </motion.button>
                  </AnimatePresence>
                )}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div
                className="rounded-3xl p-6 h-full"
                style={{
                  background: "var(--c-panel)",
                  border: "1px solid var(--c-border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">
                    Tu viaje con Crisálida comienza ahora
                  </p>

                  <span className="text-xs" style={{ color: "var(--c-accent)" }}>
                    Online Gallery
                  </span>
                </div>

                <p className="mt-2 text-sm" style={{ color: "var(--c-muted)" }}>
                  Explora piezas, entra a la galería o compra en la Tienda.
                </p>

                <div className="mt-5 grid gap-3">
                  <Link
                    to="/museo"
                    className="rounded-2xl px-4 py-4 border hover:opacity-95 transition"
                    style={{
                      borderColor: "var(--c-border)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <p className="text-xs" style={{ color: "var(--c-accent)" }}>
                      Galería
                    </p>

                    <p className="text-sm font-bold text-white">
                      Ver obras completas
                    </p>

                    <p className="text-xs mt-1" style={{ color: "var(--c-muted)" }}>
                      Navega como exposición.
                    </p>
                  </Link>

                  <Link
                    to="/tienda"
                    className="rounded-2xl px-4 py-4 border hover:opacity-95 transition"
                    style={{
                      borderColor: "var(--c-border)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <p className="text-xs" style={{ color: "var(--c-accent)" }}>
                      Tienda
                    </p>

                    <p className="text-sm font-bold text-white">
                      Comprar prints / obras
                    </p>

                    <p className="text-xs mt-1" style={{ color: "var(--c-muted)" }}>
                      Ordena y paga.
                    </p>
                  </Link>

                  <Link
                    to="/artistas"
                    className="rounded-2xl px-4 py-4 border hover:opacity-95 transition"
                    style={{
                      borderColor: "var(--c-border)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <p className="text-xs" style={{ color: "var(--c-accent)" }}>
                      Artistas
                    </p>

                    <p className="text-sm font-bold text-white">
                      Conoce la colectiva
                    </p>

                    <p className="text-xs mt-1" style={{ color: "var(--c-muted)" }}>
                      Biografías y estilo.
                    </p>
                  </Link>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => void loadWorks()}
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{ background: "var(--c-accent)", color: "#07110a" }}
                  >
                    Actualizar
                  </button>

                  <Link
                    to="/contacto"
                    className="px-4 py-2 rounded-lg font-semibold border"
                    style={{ borderColor: "var(--c-border)", color: "white" }}
                  >
                    Contacto
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Shell>

        <EventosProSection />

        <Shell className="pb-10">
          <div
            className="rounded-3xl p-6 sm:p-8"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--c-border)",
            }}
          >
            <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  Encuentra tu obra ideal
                </h2>

                <p className="mt-1 text-sm" style={{ color: "var(--c-muted)" }}>
                  Busca por título o artista.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-[520px]">
                <input
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    background: "var(--c-panel)",
                    border: "1px solid var(--c-border)",
                    color: "white",
                  }}
                  placeholder="Ej: Metamorfosis, Antonella, Grabado..."
                />

                <button
                  type="button"
                  className="px-5 py-3 rounded-xl font-semibold"
                  style={{ background: "var(--c-accent)", color: "#07110a" }}
                  onClick={() => navigate("/museo")}
                >
                  Ir a la galería
                </button>
              </div>
            </div>
          </div>
        </Shell>

        <Shell className="pb-12">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Obras en movimiento
              </h3>

              <p className="text-sm mt-1" style={{ color: "var(--c-muted)" }}>
                Desliza las obras y explora la colección.
              </p>
            </div>

            <Link
              to="/museo"
              className="text-sm font-semibold underline underline-offset-4"
              style={{ color: "var(--c-accent)" }}
            >
              Ver todo en Galería →
            </Link>
          </div>

          {loading ? (
            <div
              className="rounded-3xl p-8 text-sm"
              style={{
                background: "var(--c-panel)",
                border: "1px solid var(--c-border)",
                color: "var(--c-muted)",
              }}
            >
              Cargando galería...
            </div>
          ) : works.length === 0 ? (
            <div
              className="rounded-3xl p-8 text-sm"
              style={{
                background: "var(--c-panel)",
                border: "1px solid var(--c-border)",
                color: "var(--c-muted)",
              }}
            >
              No hay obras con imagen todavía. Sube obras desde Admin.
            </div>
          ) : (
            <WorksCarousel works={cascadeWorks} onOpen={goToWork} />
          )}
        </Shell>

        <Shell className="pb-14">
          <div
            className="rounded-3xl p-7 sm:p-10 flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between"
            style={{
              background: "var(--c-panel)",
              border: "1px solid var(--c-border)",
            }}
          >
            <div className="max-w-2xl">
              <h4 className="text-xl sm:text-2xl font-extrabold text-white">
                Compra piezas y prints exclusivos de Crisálida
              </h4>

              <p className="mt-2 text-sm" style={{ color: "var(--c-muted)" }}>
                Un bloque tipo tienda para darle fuerza comercial a la página.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                to="/tienda"
                className="px-5 py-3 rounded-xl font-semibold"
                style={{ background: "var(--c-accent)", color: "#07110a" }}
              >
                Ir a la Tienda
              </Link>

              <Link
                to="/contacto"
                className="px-5 py-3 rounded-xl font-semibold border"
                style={{ borderColor: "var(--c-border)", color: "white" }}
              >
                Pedidos personalizados
              </Link>
            </div>
          </div>
        </Shell>
      </main>

      <footer
        className="border-t"
        style={{ borderColor: "var(--c-border)", background: "var(--c-panel)" }}
      >
        <Shell className="py-5">
          <div className="text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
            <p style={{ color: "var(--c-muted)" }}>
              © 2025 Colectiva de Arte Crisálida. Todos los derechos reservados.
            </p>

            <p style={{ color: "rgba(255,255,255,0.55)" }}>By Joel Lazarte</p>
          </div>
        </Shell>
      </footer>
    </div>
  );
}