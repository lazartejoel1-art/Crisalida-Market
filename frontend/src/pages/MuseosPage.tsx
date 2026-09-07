import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { buildImageUrl, fetchObras } from "../services/api";

type Work = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  imagen?: string | null;
  imagenUrl?: string | null;
  stock?: number;
  precio?: number | string;
  artista?: {
    nombre: string;
  };
};

type AreaTecnica =
  | "Todas"
  | "Dibujo"
  | "Pintura"
  | "Escultura"
  | "Grabado"
  | "Cerámica"
  | "Fotografía"
  | "Ilustración"
  | "Collage"
  | "Muralismo"
  | "Arte digital"
  | "Instalación"
  | "Performance"
  | "Videoarte"
  | "Arte conceptual"
  | "Técnicas mixtas"
  | "Sin técnica";

const AREAS_TECNICAS: AreaTecnica[] = [
  "Todas",
  "Dibujo",
  "Pintura",
  "Escultura",
  "Grabado",
  "Cerámica",
  "Fotografía",
  "Ilustración",
  "Collage",
  "Muralismo",
  "Arte digital",
  "Instalación",
  "Performance",
  "Videoarte",
  "Arte conceptual",
  "Técnicas mixtas",
  "Sin técnica",
];

function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  return buildImageUrl(imagePath);
}

function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function extraerTecnica(descripcion?: string | null): string {
  if (!descripcion) return "Sin técnica";

  const match =
    descripcion.match(/técnica\s*[:.]?\s*([^\n.]+)/i) ||
    descripcion.match(/tecnica\s*[:.]?\s*([^\n.]+)/i);

  if (!match?.[1]) return "Sin técnica";

  return match[1].trim();
}

function clasificarAreaTecnica(descripcion?: string | null): AreaTecnica {
  const tecnicaOriginal = extraerTecnica(descripcion);

  if (!tecnicaOriginal || tecnicaOriginal === "Sin técnica") {
    return "Sin técnica";
  }

  const tecnica = normalizarTexto(tecnicaOriginal);

  if (
    tecnica.includes("oleo") ||
    tecnica.includes("acrilico") ||
    tecnica.includes("acuarela") ||
    tecnica.includes("tempera") ||
    tecnica.includes("gouache") ||
    tecnica.includes("pintura") ||
    tecnica.includes("lienzo") ||
    tecnica.includes("tela")
  ) {
    return "Pintura";
  }

  if (
    tecnica.includes("grafito") ||
    tecnica.includes("lapiz") ||
    tecnica.includes("carboncillo") ||
    tecnica.includes("tinta") ||
    tecnica.includes("boligrafo") ||
    tecnica.includes("dibujo") ||
    tecnica.includes("pastel") ||
    tecnica.includes("sanguina")
  ) {
    return "Dibujo";
  }

  if (
    tecnica.includes("ceramica") ||
    tecnica.includes("arcilla") ||
    tecnica.includes("barro") ||
    tecnica.includes("esmalt") ||
    tecnica.includes("rollito") ||
    tecnica.includes("rollitos") ||
    tecnica.includes("modelado en ceramica")
  ) {
    return "Cerámica";
  }

  if (
    tecnica.includes("escultura") ||
    tecnica.includes("modelado") ||
    tecnica.includes("tallado") ||
    tecnica.includes("yeso") ||
    tecnica.includes("madera") ||
    tecnica.includes("metal") ||
    tecnica.includes("ensamblaje")
  ) {
    return "Escultura";
  }

  if (
    tecnica.includes("grabado") ||
    tecnica.includes("xilografia") ||
    tecnica.includes("linoleo") ||
    tecnica.includes("linograbado") ||
    tecnica.includes("aguafuerte") ||
    tecnica.includes("punta seca") ||
    tecnica.includes("serigrafia")
  ) {
    return "Grabado";
  }

  if (
    tecnica.includes("fotografia") ||
    tecnica.includes("foto") ||
    tecnica.includes("impresion fotografica")
  ) {
    return "Fotografía";
  }

  if (
    tecnica.includes("ilustracion") ||
    tecnica.includes("ilustración") ||
    tecnica.includes("editorial") ||
    tecnica.includes("comic") ||
    tecnica.includes("cómic")
  ) {
    return "Ilustración";
  }

  if (tecnica.includes("collage")) {
    return "Collage";
  }

  if (
    tecnica.includes("mural") ||
    tecnica.includes("muralismo") ||
    tecnica.includes("pared")
  ) {
    return "Muralismo";
  }

  if (
    tecnica.includes("digital") ||
    tecnica.includes("arte digital") ||
    tecnica.includes("tablet") ||
    tecnica.includes("procreate") ||
    tecnica.includes("photoshop") ||
    tecnica.includes("vector")
  ) {
    return "Arte digital";
  }

  if (tecnica.includes("instalacion") || tecnica.includes("instalación")) {
    return "Instalación";
  }

  if (tecnica.includes("performance") || tecnica.includes("accion")) {
    return "Performance";
  }

  if (
    tecnica.includes("videoarte") ||
    tecnica.includes("video arte") ||
    tecnica.includes("audiovisual")
  ) {
    return "Videoarte";
  }

  if (
    tecnica.includes("conceptual") ||
    tecnica.includes("arte conceptual") ||
    tecnica.includes("idea")
  ) {
    return "Arte conceptual";
  }

  if (
    tecnica.includes("mixta") ||
    tecnica.includes("mixto") ||
    tecnica.includes("tecnicas mixtas") ||
    tecnica.includes("técnicas mixtas") ||
    tecnica.includes("mixed media")
  ) {
    return "Técnicas mixtas";
  }

  return "Técnicas mixtas";
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

function GalleryImage({ src, alt }: { src: string | null; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 text-sm text-neutral-400 dark:bg-white/5 dark:text-white/35">
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
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.045] ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        draggable={false}
      />
    </>
  );
}

export default function MuseoPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTechnique, setSelectedTechnique] =
    useState<AreaTecnica>("Todas");
  const [query, setQuery] = useState("");

  const navigate = useNavigate();

  const loadWorks = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchObras();

      const clean = (Array.isArray(data) ? data : []).filter((w) =>
        Boolean(w.imagenUrl || w.imagen),
      );

      setWorks(clean);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las obras de Crisálida.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorks();
  }, []);

  const techniqueCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    AREAS_TECNICAS.forEach((area) => {
      counts[area] = 0;
    });

    works.forEach((work) => {
      const area = clasificarAreaTecnica(work.descripcion);
      counts[area] = (counts[area] ?? 0) + 1;
      counts.Todas = (counts.Todas ?? 0) + 1;
    });

    return counts;
  }, [works]);

  const filteredWorks = useMemo(() => {
    const q = normalizarTexto(query.trim());

    return works.filter((work) => {
      const tecnicaReal = extraerTecnica(work.descripcion);
      const area = clasificarAreaTecnica(work.descripcion);

      const matchesTechnique =
        selectedTechnique === "Todas" || area === selectedTechnique;

      const searchable = normalizarTexto(
        [
          work.titulo,
          work.artista?.nombre ?? "",
          work.descripcion ?? "",
          tecnicaReal,
          area,
        ].join(" "),
      );

      const matchesQuery = !q || searchable.includes(q);

      return matchesTechnique && matchesQuery;
    });
  }, [works, selectedTechnique, query]);

  return (
    <div className="min-h-screen bg-[#f4f5f5] text-neutral-950 transition-colors duration-300 dark:bg-neutral-950 dark:text-white">
      <Shell className="py-6 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[32px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-400/10 sm:p-6 lg:p-7"
        >
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-white/70 blur-3xl dark:bg-white/5" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
                Galería Crisálida
              </p>

              <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-neutral-950 dark:text-white sm:text-4xl lg:text-5xl">
                Galería virtual
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-white/65 sm:text-base">
                Explora la colección por área artística, técnica, artista o
                título. Una vista limpia para recorrer las obras de Crisálida.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadWorks()}
              className="w-fit rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
            >
              Actualizar galería
            </button>
          </div>
        </motion.div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <p className="text-sm font-black text-neutral-950 dark:text-white">
              Obras
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-white/55">
              {works.length} piezas registradas
            </p>
          </div>

          <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <p className="text-sm font-black text-neutral-950 dark:text-white">
              Áreas
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-white/55">
              {AREAS_TECNICAS.length - 2} categorías artísticas
            </p>
          </div>

          <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <p className="text-sm font-black text-neutral-950 dark:text-white">
              Filtro actual
            </p>
            <p className="mt-1 line-clamp-1 text-sm text-neutral-500 dark:text-white/55">
              {selectedTechnique}
            </p>
          </div>

          <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <p className="text-sm font-black text-neutral-950 dark:text-white">
              Resultado
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-white/55">
              {filteredWorks.length} obras visibles
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[30px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                Clasificación por técnica
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-3xl">
                Explora por área artística
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-neutral-500 dark:text-white/55">
                Las obras se ordenan automáticamente según la técnica registrada
                en su ficha.
              </p>
            </div>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar obra, artista o técnica..."
              className="w-full rounded-full border border-neutral-300 bg-neutral-50 px-5 py-3.5 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-emerald-400 lg:w-[380px]"
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
            {AREAS_TECNICAS.map((technique) => {
              const active = selectedTechnique === technique;
              const count = techniqueCounts[technique] ?? 0;
              const hasWorks = count > 0 || technique === "Todas";

              return (
                <button
                  key={technique}
                  type="button"
                  onClick={() => setSelectedTechnique(technique)}
                  className={`min-h-[48px] rounded-2xl border px-3 py-2 text-left transition ${
                    active
                      ? "border-emerald-500 bg-emerald-600 text-white shadow-sm dark:bg-emerald-400 dark:text-black"
                      : hasWorks
                        ? "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"
                        : "border-neutral-200 bg-neutral-50 text-neutral-400 opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white/35"
                  }`}
                >
                  <span className="block truncate text-[12px] font-black leading-tight">
                    {technique}
                  </span>

                  <span
                    className={`mt-1 block text-[10px] font-bold ${
                      active
                        ? "text-white/85 dark:text-black/70"
                        : "text-neutral-400 dark:text-white/35"
                    }`}
                  >
                    {count} obras
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Shell>

      <Shell className="pb-16">
        {loading && (
          <div className="rounded-[34px] border border-neutral-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <p className="animate-pulse text-sm text-neutral-500 dark:text-white/55">
              Cargando obras...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-[34px] border border-red-200 bg-red-50 p-8 shadow-sm dark:border-red-400/20 dark:bg-red-400/10">
            <p className="text-sm font-semibold text-red-600 dark:text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadWorks()}
              className="mt-4 rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && works.length === 0 && (
          <div className="rounded-[34px] border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-white/55">
            Todavía no hay obras disponibles en la galería.
          </div>
        )}

        {!loading && !error && works.length > 0 && filteredWorks.length === 0 && (
          <div className="rounded-[34px] border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-white/55">
            No se encontraron obras con ese filtro.
          </div>
        )}

        {!loading && !error && filteredWorks.length > 0 && (
          <motion.div
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.06,
                },
              },
            }}
          >
            {filteredWorks.map((w) => {
              const imageUrl = getImageUrl(w.imagenUrl || w.imagen);
              const tecnica = extraerTecnica(w.descripcion);
              const area = clasificarAreaTecnica(w.descripcion);

              return (
                <motion.button
                  key={w.id}
                  type="button"
                  onClick={() => navigate(`/obra/${w.id}`)}
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.35 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative aspect-[3/4] overflow-hidden rounded-[34px] border border-neutral-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl dark:border-white/10 dark:bg-neutral-900 dark:hover:border-emerald-400/40"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <GalleryImage src={imageUrl} alt={w.titulo} />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  <div className="absolute left-4 top-4 z-20 flex max-w-[85%] flex-wrap gap-2">
                    <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-neutral-950 shadow-sm">
                      {area}
                    </span>

                    {tecnica !== area && tecnica !== "Sin técnica" && (
                      <span className="rounded-full bg-emerald-400/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-black shadow-sm">
                        {tecnica}
                      </span>
                    )}
                  </div>

                  <div className="pointer-events-none absolute bottom-3 right-3 z-20 text-[10px] uppercase tracking-widest text-white/40">
                    Crisálida · Galería
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 z-20 p-5">
                    <p className="max-w-full truncate text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
                      {w.artista?.nombre ?? "Crisálida"}
                    </p>

                    <h3 className="mt-2 line-clamp-2 text-2xl font-black leading-tight text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)]">
                      {w.titulo}
                    </h3>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-neutral-950 opacity-0 transition group-hover:opacity-100">
                        Ver obra →
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </Shell>
    </div>
  );
}