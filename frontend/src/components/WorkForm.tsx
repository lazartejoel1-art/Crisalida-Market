import { FormEvent, useEffect, useMemo, useState } from "react";

export type NewWork = {
  titulo: string;
  descripcion: string;
  precio: number;
  stock: number;
  artistaId: number;
  imagen?: File;
  imagenUrl?: string;
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

function getInitialArtistId(artists: ArtistOption[], initialValues?: NewWork) {
  return initialValues?.artistaId ?? artists[0]?.id ?? 0;
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
    initialValues?.descripcion ?? "",
  );
  const [precio, setPrecio] = useState<number>(initialValues?.precio ?? 0);
  const [imagenUrlInput, setImagenUrlInput] = useState(
    initialValues?.imagenUrl ?? "",
  );
  const [stock, setStock] = useState<number>(initialValues?.stock ?? 1);
  const [artistaId, setArtistaId] = useState<number>(defaultArtistId);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (initialValues) {
        setTitulo(initialValues.titulo ?? "");
        setDescripcion(initialValues.descripcion ?? "");
        setPrecio(Number(initialValues.precio ?? 0));
        setImagenUrlInput(initialValues.imagenUrl ?? "");
        setStock(Number(initialValues.stock ?? 1));
        setArtistaId(initialValues.artistaId ?? artists[0]?.id ?? 0);
        setFile(null);
        setPreviewUrl(initialValues.imagenUrl ?? "");
      } else {
        setTitulo("");
        setDescripcion("");
        setPrecio(0);
        setImagenUrlInput("");
        setStock(1);
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

    const maxSizeMb = 10;
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (selectedFile.size > maxSizeBytes) {
      setMessage(`La imagen es muy pesada. Máximo ${maxSizeMb} MB.`);
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
      const imagenUrlLimpia = imagenUrlInput.trim();

      if (!tituloLimpio) {
        throw new Error("Falta el título de la obra.");
      }

      if (!Number.isFinite(precio) || precio <= 0) {
        throw new Error("El precio debe ser mayor a 0.");
      }

      if (!Number.isFinite(stock) || stock < 0) {
        throw new Error("El stock debe ser 0 o mayor.");
      }

      if (!Number.isFinite(artistaId) || artistaId <= 0) {
        throw new Error("Selecciona un artista.");
      }

      if (mode === "create" && !file && !imagenUrlLimpia) {
        throw new Error("Selecciona una imagen o pega una URL de imagen.");
      }

      await onSave({
        titulo: tituloLimpio,
        descripcion: descripcionLimpia,
        precio,
        imagen: file ?? undefined,
        imagenUrl: imagenUrlLimpia || undefined,
        stock,
        artistaId,
      });

      setMessage(
        mode === "create"
          ? "Obra enviada para guardar ✅"
          : "Cambios enviados para guardar ✅",
      );

      if (mode === "create") {
        setTitulo("");
        setDescripcion("");
        setPrecio(0);
        setImagenUrlInput("");
        setStock(1);
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

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#0e1624] p-6 mb-6 rounded-xl border border-gray-800 shadow-lg space-y-4"
    >
      <h2 className="text-lg font-bold text-verdeEsmeralda">
        {mode === "create" ? "➕ Agregar obra" : "✏️ Editar obra"}
      </h2>

      {message && (
        <div className="rounded-lg border border-gray-700 bg-[#050816] p-3 text-sm text-gray-200">
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-300 text-sm mb-1">Título</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Ej: Grabado 'Metamorfosis I'"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-1">Artista</label>
          <select
            className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
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
        <label className="block text-gray-300 text-sm mb-1">Descripción</label>
        <textarea
          className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm min-h-[90px]"
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          placeholder="Descripción conceptual de la obra..."
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-300 text-sm mb-1">Precio (Bs)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
            value={precio === 0 ? "" : precio}
            onChange={(event) =>
              setPrecio(event.target.value === "" ? 0 : Number(event.target.value))
            }
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-1">Stock</label>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
            value={stock}
            onChange={(event) => setStock(Number(event.target.value))}
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-1">
            URL de la imagen
          </label>
          <input
            type="url"
            className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
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
        <label className="block text-gray-300 text-sm mb-1">
          Imagen desde tu dispositivo
        </label>
        <input
          type="file"
          accept="image/*"
          className="w-full text-sm text-gray-200"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] ?? null;
            handleFileChange(selectedFile);
          }}
        />
        <p className="text-xs text-gray-500 mt-1">
          Funciona desde celular, tablet o PC. Usa JPG, PNG o WEBP.
        </p>
      </div>

      {previewUrl && (
        <div className="rounded-xl border border-gray-800 bg-[#050816] p-3">
          <p className="text-xs text-gray-400 mb-2">Vista previa</p>
          <img
            src={previewUrl}
            alt="Vista previa de la obra"
            className="w-full max-h-64 rounded-lg object-contain bg-black"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="bg-verdeEsmeralda text-white px-4 py-2 rounded hover:opacity-90 transition text-sm disabled:opacity-60"
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
            className="px-4 py-2 rounded border border-gray-600 text-gray-300 text-sm hover:bg-[#111827]"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}