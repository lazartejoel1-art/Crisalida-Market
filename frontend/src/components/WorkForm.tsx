import { FormEvent, useEffect, useMemo, useState } from "react";

export type EstadoVenta = "DISPONIBLE" | "NO_DISPONIBLE" | "NO_VENTA";

export type NewWork = {
  titulo: string;
  descripcion: string;
  precio: number;
  stock: number;
  artistaId: number;
  imagen?: File;
  imagenUrl?: string;
  estadoVenta?: EstadoVenta;
};

type ArtistOption = {
  id: number;
  nombre: string;
};

interface WorkFormProps {
  onSave: (data: NewWork) => void | Promise<void>;
  artists: ArtistOption[];
  initialValues?: NewWork;
  mode?: "create" | "edit";
  onCancel?: () => void;
}

const MAX_IMAGE_SIZE_MB = 50;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

function getInitialArtistId(artists: ArtistOption[], initialValues?: NewWork) {
  return initialValues?.artistaId ?? artists[0]?.id ?? 0;
}

function extraerCampo(texto: string, etiqueta: string): string {
  const regex = new RegExp(`${etiqueta}\\s*[:.]?\\s*([^\\n]+)`, "i");
  const match = texto.match(regex);
  return match?.[1]?.trim() ?? "";
}

function limpiarDescripcion(texto: string): string {
  return texto
    .replace(/Técnica\s*[:.]?\s*[^\n]+/gi, "")
    .replace(/Tecnica\s*[:.]?\s*[^\n]+/gi, "")
    .replace(/Dimensiones\s*[:.]?\s*[^\n]+/gi, "")
    .replace(/Año\s*[:.]?\s*[^\n]+/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function resolveEstadoVenta(initialValues?: NewWork): EstadoVenta {
  if (initialValues?.estadoVenta) return initialValues.estadoVenta;

  const stock = Number(initialValues?.stock ?? 1);

  return stock > 0 ? "DISPONIBLE" : "NO_DISPONIBLE";
}

export default function WorkForm({
  onSave,
  artists,
  initialValues,
  mode = "create",
  onCancel,
}: WorkFormProps) {
  const defaultArtistId = useMemo(
    () => getInitialArtistId(artists, initialValues),
    [artists, initialValues],
  );

  const [titulo, setTitulo] = useState(initialValues?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(
    limpiarDescripcion(initialValues?.descripcion ?? ""),
  );
  const [tecnica, setTecnica] = useState(
    extraerCampo(initialValues?.descripcion ?? "", "Técnica") ||
      extraerCampo(initialValues?.descripcion ?? "", "Tecnica"),
  );
  const [dimensiones, setDimensiones] = useState(
    extraerCampo(initialValues?.descripcion ?? "", "Dimensiones"),
  );
  const [anio, setAnio] = useState(
    extraerCampo(initialValues?.descripcion ?? "", "Año"),
  );

  const [precio, setPrecio] = useState<number>(initialValues?.precio ?? 0);
  const [imagenUrlInput, setImagenUrlInput] = useState(
    initialValues?.imagenUrl ?? "",
  );
  const [stock, setStock] = useState<number>(initialValues?.stock ?? 1);
  const [estadoVenta, setEstadoVenta] = useState<EstadoVenta>(() =>
    resolveEstadoVenta(initialValues),
  );
  const [artistaId, setArtistaId] = useState<number>(defaultArtistId);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (initialValues) {
        setTitulo(initialValues.titulo ?? "");
        setDescripcion(limpiarDescripcion(initialValues.descripcion ?? ""));
        setTecnica(
          extraerCampo(initialValues.descripcion ?? "", "Técnica") ||
            extraerCampo(initialValues.descripcion ?? "", "Tecnica"),
        );
        setDimensiones(
          extraerCampo(initialValues.descripcion ?? "", "Dimensiones"),
        );
        setAnio(extraerCampo(initialValues.descripcion ?? "", "Año"));
        setPrecio(Number(initialValues.precio ?? 0));
        setImagenUrlInput(initialValues.imagenUrl ?? "");
        setStock(Number(initialValues.stock ?? 1));
        setEstadoVenta(resolveEstadoVenta(initialValues));
        setArtistaId(initialValues.artistaId ?? artists[0]?.id ?? 0);
        setFile(null);
        setPreviewUrl(initialValues.imagenUrl ?? "");
      } else {
        setTitulo("");
        setDescripcion("");
        setTecnica("");
        setDimensiones("");
        setAnio("");
        setPrecio(0);
        setImagenUrlInput("");
        setStock(1);
        setEstadoVenta("DISPONIBLE");
        setArtistaId(artists[0]?.id ?? 0);
        setFile(null);
        setPreviewUrl("");
      }

      setMessage(null);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [initialValues, artists]);

  const handleEstadoVentaChange = (nextEstado: EstadoVenta) => {
    setEstadoVenta(nextEstado);
    setMessage(null);

    if (nextEstado === "DISPONIBLE") {
      setStock((current) => (Number(current) > 0 ? Number(current) : 1));
      return;
    }

    setStock(0);
  };

  const handleStockChange = (nextStock: number) => {
    const safeStock = Number.isFinite(nextStock) ? Math.max(0, nextStock) : 0;

    setStock(safeStock);

    if (safeStock > 0 && estadoVenta !== "NO_VENTA") {
      setEstadoVenta("DISPONIBLE");
    }

    if (safeStock <= 0 && estadoVenta === "DISPONIBLE") {
      setEstadoVenta("NO_DISPONIBLE");
    }
  };

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setMessage(null);

    if (!selectedFile) {
      setPreviewUrl(imagenUrlInput);
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setMessage("Selecciona una imagen válida.");
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_IMAGE_SIZE_BYTES) {
      setMessage(`La imagen es muy pesada. Máximo ${MAX_IMAGE_SIZE_MB} MB.`);
      setFile(null);
      return;
    }

    const localPreview = URL.createObjectURL(selectedFile);
    setPreviewUrl(localPreview);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const tituloLimpio = titulo.trim();
      const descripcionLimpia = descripcion.trim();
      const tecnicaLimpia = tecnica.trim();
      const dimensionesLimpias = dimensiones.trim();
      const anioLimpio = anio.trim();
      const imagenUrlLimpia = imagenUrlInput.trim();

      const stockFinal =
        estadoVenta === "DISPONIBLE" ? Math.max(1, Number(stock)) : 0;

      if (!tituloLimpio) {
        throw new Error("Falta el título de la obra.");
      }

      if (!Number.isFinite(precio) || precio <= 0) {
        throw new Error("El precio debe ser mayor a 0.");
      }

      if (!Number.isFinite(stockFinal) || stockFinal < 0) {
        throw new Error("El stock debe ser 0 o mayor.");
      }

      if (!Number.isFinite(artistaId) || artistaId <= 0) {
        throw new Error("Selecciona un artista.");
      }

      if (mode === "create" && !file && !imagenUrlLimpia) {
        throw new Error("Selecciona una imagen o pega una URL de imagen.");
      }

      const descripcionFinal = [
        descripcionLimpia,
        tecnicaLimpia ? `Técnica: ${tecnicaLimpia}` : "",
        dimensionesLimpias ? `Dimensiones: ${dimensionesLimpias}` : "",
        anioLimpio ? `Año: ${anioLimpio}` : "",
        estadoVenta === "NO_VENTA" ? "Estado de venta: No está a la venta" : "",
      ]
        .filter(Boolean)
        .join("\n");

      await onSave({
        titulo: tituloLimpio,
        descripcion: descripcionFinal,
        precio,
        imagen: file ?? undefined,
        imagenUrl: imagenUrlLimpia || undefined,
        stock: stockFinal,
        artistaId,
        estadoVenta,
      });

      setMessage(
        mode === "create"
          ? "Obra enviada para guardar ✅"
          : "Cambios enviados para guardar ✅",
      );

      if (mode === "create") {
        setTitulo("");
        setDescripcion("");
        setTecnica("");
        setDimensiones("");
        setAnio("");
        setPrecio(0);
        setImagenUrlInput("");
        setStock(1);
        setEstadoVenta("DISPONIBLE");
        setArtistaId(artists[0]?.id ?? 0);
        setFile(null);
        setPreviewUrl("");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo guardar la obra.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const estadoCards: Array<{
    value: EstadoVenta;
    title: string;
    text: string;
    badge: string;
  }> = [
    {
      value: "DISPONIBLE",
      title: "Disponible",
      text: "Se puede mostrar y vender en la tienda.",
      badge: "Stock activo",
    },
    {
      value: "NO_DISPONIBLE",
      title: "No disponible",
      text: "Se muestra como agotada o sin disponibilidad.",
      badge: "Stock 0",
    },
    {
      value: "NO_VENTA",
      title: "No está a la venta",
      text: "Se muestra como obra de galería, sin venta activa.",
      badge: "Solo exposición",
    },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-5 rounded-[30px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6"
    >
      <div className="relative overflow-hidden rounded-[26px] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-400/20 dark:bg-emerald-400/10">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-400/25 blur-3xl" />

        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
            Gestión de obra
          </p>

          <h2 className="mt-2 text-2xl font-black text-neutral-950 dark:text-white">
            {mode === "create" ? "➕ Agregar obra" : "✏️ Editar obra"}
          </h2>

          <p className="mt-2 text-sm text-neutral-600 dark:text-white/60">
            Registra datos técnicos, disponibilidad, precio e imagen de la obra.
          </p>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm font-semibold text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-black text-neutral-700 dark:text-white/75">
            Título
          </label>

          <input
            type="text"
            className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-emerald-400"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Ej: Grabado 'Metamorfosis I'"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-black text-neutral-700 dark:text-white/75">
            Artista
          </label>

          <select
            className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-950 outline-none transition focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-emerald-400"
            value={artistaId}
            onChange={(event) => setArtistaId(Number(event.target.value))}
          >
            <option value={0}>Selecciona un artista</option>
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-black text-neutral-700 dark:text-white/75">
          Descripción
        </label>

        <textarea
          className="min-h-[120px] w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-emerald-400"
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          placeholder="Descripción conceptual de la obra..."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-black text-neutral-700 dark:text-white/75">
            Técnica
          </label>

          <input
            type="text"
            className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-emerald-400"
            value={tecnica}
            onChange={(event) => setTecnica(event.target.value)}
            placeholder="Ej: Óleo sobre lienzo"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-black text-neutral-700 dark:text-white/75">
            Dimensiones
          </label>

          <input
            type="text"
            className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-emerald-400"
            value={dimensiones}
            onChange={(event) => setDimensiones(event.target.value)}
            placeholder="Ej: 80 x 100 cm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-black text-neutral-700 dark:text-white/75">
            Año
          </label>

          <input
            type="text"
            className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-emerald-400"
            value={anio}
            onChange={(event) => setAnio(event.target.value)}
            placeholder="Ej: 2026"
          />
        </div>
      </div>

      <div className="rounded-[26px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="mb-4">
          <p className="text-sm font-black text-neutral-950 dark:text-white">
            Estado de venta
          </p>

          <p className="mt-1 text-xs text-neutral-500 dark:text-white/50">
            Esto controla si la obra se verá como disponible o bloqueada para
            compra. Sin tocar backend, se maneja mediante stock.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {estadoCards.map((item) => {
            const active = estadoVenta === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleEstadoVentaChange(item.value)}
                className={`rounded-[22px] border p-4 text-left transition ${
                  active
                    ? "border-emerald-400 bg-emerald-50 shadow-sm dark:border-emerald-400/40 dark:bg-emerald-400/10"
                    : "border-neutral-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-neutral-900 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-400/10"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-neutral-950 dark:text-white">
                    {item.title}
                  </p>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                      active
                        ? "bg-emerald-600 text-white dark:bg-emerald-400 dark:text-black"
                        : "bg-neutral-100 text-neutral-500 dark:bg-white/5 dark:text-white/45"
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-white/50">
                  {item.text}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-black text-neutral-700 dark:text-white/75">
            Precio (Bs)
          </label>

          <input
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-emerald-400"
            value={precio === 0 ? "" : precio}
            onChange={(event) =>
              setPrecio(
                event.target.value === "" ? 0 : Number(event.target.value),
              )
            }
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-black text-neutral-700 dark:text-white/75">
            Stock
          </label>

          <input
            type="number"
            min={0}
            inputMode="numeric"
            disabled={estadoVenta !== "DISPONIBLE"}
            className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-emerald-400"
            value={estadoVenta === "DISPONIBLE" ? stock : 0}
            onChange={(event) => handleStockChange(Number(event.target.value))}
          />

          {estadoVenta !== "DISPONIBLE" && (
            <p className="mt-1 text-xs text-neutral-400">
              El stock se guarda como 0 para bloquear la compra.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-black text-neutral-700 dark:text-white/75">
            URL de la imagen
          </label>

          <input
            type="url"
            className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-emerald-400"
            value={imagenUrlInput}
            onChange={(event) => {
              setImagenUrlInput(event.target.value);
              if (!file) setPreviewUrl(event.target.value);
            }}
            placeholder="https://..."
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-black text-neutral-700 dark:text-white/75">
          Imagen desde tu dispositivo
        </label>

        <input
          type="file"
          accept="image/*"
          className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-black file:text-white dark:text-white/65 dark:file:bg-emerald-400 dark:file:text-black"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] ?? null;
            handleFileChange(selectedFile);
          }}
        />

        <p className="mt-1 text-xs text-neutral-500 dark:text-white/45">
          Funciona desde celular, tablet o PC. Usa JPG, PNG o WEBP. Máximo{" "}
          {MAX_IMAGE_SIZE_MB} MB.
        </p>
      </div>

      {previewUrl && (
        <div className="rounded-[26px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/5">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-neutral-400">
            Vista previa
          </p>

          <img
            src={previewUrl}
            alt="Vista previa de la obra"
            className="max-h-64 w-full rounded-2xl bg-black object-contain"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
        >
          {submitting
            ? mode === "create"
              ? "Guardando..."
              : "Actualizando..."
            : mode === "create"
              ? "Guardar obra"
              : "Guardar cambios"}
        </button>

        {mode === "edit" && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-black text-neutral-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}