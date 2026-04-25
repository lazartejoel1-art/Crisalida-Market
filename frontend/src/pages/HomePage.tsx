import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

/**
 * HOME PAGE - Crisálida
 * ✅ Ahora usa CSS Variables:
 *  --c-bg, --c-panel, --c-border, --c-text, --c-muted, --c-soft, --c-accent
 * 👉 Eso permite que el ThemeMiniPanel cambie colores en TODA la web.
 */

type Work = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  precio: number | string;
  imagenUrl: string;
  stock: number;
  artista?: {
    id: number;
    nombre: string;
  };
};

function toNumber(v: number | string) {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
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

function WorksGrid({
  works,
  onOpen,
}: {
  works: Work[];
  onOpen: (id: number) => void;
}) {
  const metaById = useMemo(() => {
    const m = new Map<
      number,
      { r: number; x: number; y: number; d: number; s: number; t: number }
    >();

    works.forEach((w, idx) => {
      const seed = (w.id * 9301 + 49297) % 233280;
      const rnd = seed / 233280;

      const r = rnd * 12 - 6;
      const x = rnd * 10 - 5;
      const y = (((seed * 7) % 233280) / 233280) * 10 - 5;
      const d = 0.04 * (idx % 10);
      const s = 1 + (((seed * 13) % 233280) / 233280) * 0.02;
      const t = 7.2 + (idx % 3) * 0.7;

      m.set(w.id, { r, x, y, d, s, t });
    });

    return m;
  }, [works]);

  return (
    <motion.div
      layout
      className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <AnimatePresence mode="popLayout">
        {works.map((w) => {
          const meta = metaById.get(w.id) ?? {
            r: 0,
            x: 0,
            y: 0,
            d: 0,
            s: 1,
            t: 7,
          };

          return (
            <motion.button
              key={w.id}
              layout
              type="button"
              onClick={() => onOpen(w.id)}
              className="relative rounded-[28px] overflow-hidden text-left select-none"
              style={{
                background: "var(--c-panel)",
                border: "1px solid var(--c-border)",
              }}
              initial={{ opacity: 0, scale: 0.985, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.985, y: -18 }}
              transition={{ duration: 0.45, delay: meta.d }}
              whileHover={{ scale: 1.012 }}
              whileTap={{ scale: 0.988 }}
            >
              <motion.div
                className="relative w-full h-72 sm:h-80"
                animate={{
                  rotate: [meta.r, meta.r + 1.5, meta.r],
                  x: [meta.x, meta.x + 3, meta.x],
                  y: [meta.y, meta.y - 4, meta.y],
                  scale: [1, meta.s, 1],
                }}
                transition={{
                  duration: meta.t,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "mirror",
                }}
              >
                <img
                  src={w.imagenUrl}
                  alt={w.titulo}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                {/* brillo sutil (neutral) */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -inset-1 opacity-[0.10] blur-2xl bg-white/10" />
                  <div className="absolute inset-0 border border-white/10 rounded-[28px]" />
                </div>

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
              </motion.div>

              <div className="px-4 py-3 flex items-center justify-between">
                <p className="text-xs text-white/70 line-clamp-1">
                  {w.descripcion ?? "—"}
                </p>
                <span className="text-[11px] text-white/55">
                  Stock: {Number(w.stock ?? 0)}
                </span>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  const API = "http://localhost:3000";

  const fetchWorks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/obras`);
      const data = (await res.json()) as Work[];

      const clean = (Array.isArray(data) ? data : []).filter(
        (w) => typeof w.imagenUrl === "string" && w.imagenUrl.trim().length > 0
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
    void fetchWorks();
  }, []);

  useEffect(() => {
    if (!works.length) return;

    const t = setInterval(() => {
      setIndex((prev) => (prev + 1) % works.length);
    }, 3600);

    return () => clearInterval(t);
  }, [works.length]);

  const active = useMemo(() => {
    if (!works.length) return null;
    return works[Math.min(index, works.length - 1)];
  }, [works, index]);

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
                className="relative overflow-hidden rounded-3xl"
                style={{
                  background: "var(--c-panel)",
                  border: "1px solid var(--c-border)",
                  height: "66vh",
                  minHeight: 460,
                  maxHeight: 720,
                }}
              >
                {loading ? (
                  <div
                    className="h-full flex items-center justify-center text-sm"
                    style={{ color: "var(--c-muted)" }}
                  >
                    Cargando obras...
                  </div>
                ) : !active ? (
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
                      transition={{ duration: 0.45 }}
                    >
                      <motion.img
                        src={active.imagenUrl}
                        alt={active.titulo}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        initial={{ opacity: 0, scale: 1.03, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.99, y: -10 }}
                        transition={{ duration: 0.9, ease: "easeInOut" }}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                      <div
                        className="absolute inset-0 opacity-[0.10] pointer-events-none"
                        style={{
                          backgroundImage:
                            "radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)",
                          backgroundSize: "3px 3px",
                        }}
                      />

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
                          (Click para ver la obra completa)
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
                  Explora piezas, entra al Museo o compra en la Tienda.
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
                      Museo
                    </p>
                    <p className="text-sm font-bold text-white">
                      Ver obras completas (galería)
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
                    <p className="text-sm font-bold text-white">Conoce la colectiva</p>
                    <p className="text-xs mt-1" style={{ color: "var(--c-muted)" }}>
                      Biografías y estilo.
                    </p>
                  </Link>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => void fetchWorks()}
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
                  Busca por título o artista (esto es visual — si quieres, luego lo
                  conectamos con filtros reales).
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
                  Ir al Museo
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
                Un flujo continuo de piezas: sin botones, solo mirada.
              </p>
            </div>

            <Link
              to="/museo"
              className="text-sm font-semibold underline underline-offset-4"
              style={{ color: "var(--c-accent)" }}
            >
              Ver todo en Museo →
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
            <WorksGrid works={cascadeWorks} onOpen={goToWork} />
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
                Un bloque tipo “tienda” para darle fuerza comercial a la página.
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
