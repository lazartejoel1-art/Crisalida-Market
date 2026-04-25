import { useEffect, useState, FormEvent } from "react";

export type NewWork = {
  titulo: string
  descripcion: string
  precio: number
  stock: number
  artistaId: number
  imagen?: File
  imagenUrl?: string
}

type ArtistOption = {
  id: number;
  nombre: string;
};

interface WorkFormProps {
  onSave: (data: NewWork) => void;
  artists: ArtistOption[];
  initialValues?: NewWork;
  mode?: "create" | "edit";
  onCancel?: () => void;
}

export default function WorkForm({
  onSave,
  artists,
  initialValues,
  mode = "create",
  onCancel,
}: WorkFormProps) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState<number>(0);
  const [imagenUrlInput, setImagenUrlInput] = useState("");
  const [stock, setStock] = useState<number>(1);
  const [artistaId, setArtistaId] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setTitulo(initialValues.titulo);
      setDescripcion(initialValues.descripcion);
      setPrecio(initialValues.precio);
      setImagenUrlInput(initialValues.imagenUrl || "");
      setStock(initialValues.stock);
      setArtistaId(initialValues.artistaId);
      setFile(null);
    } else {
      setTitulo("");
      setDescripcion("");
      setPrecio(0);
      setImagenUrlInput("");
      setStock(1);
      setArtistaId(artists[0]?.id ?? 0);
      setFile(null);
    }
  }, [initialValues, artists]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let finalImageUrl = imagenUrlInput;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("http://localhost:3000/obras/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          console.error("Error subiendo imagen de obra");
        } else {
          const data = (await res.json()) as { url?: string };
          finalImageUrl = data.url || finalImageUrl;
        }
      }

      const newWork: NewWork = {
        titulo,
        descripcion,
        precio,
        imagen: file || undefined,
        imagenUrl: finalImageUrl,
        stock,
        artistaId,
      };

      onSave(newWork);
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

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-300 text-sm mb-1">Título</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Grabado 'Metamorfosis I'"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-1">Artista</label>
          <select
            className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
            value={artistaId}
            onChange={(e) => setArtistaId(Number(e.target.value))}
          >
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-1">Descripción</label>
        <textarea
          className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
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
            className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
            value={precio === 0 ? "" : precio}
            onChange={(e) =>
              setPrecio(e.target.value === "" ? 0 : Number(e.target.value))
            }
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-1">Stock</label>
          <input
            type="number"
            min={0}
            className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-1">
            URL de la imagen
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
            value={imagenUrlInput}
            onChange={(e) => setImagenUrlInput(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-1">
          Imagen desde tu PC
        </label>
        <input
          type="file"
          accept="image/*"
          className="w-full text-sm text-gray-200"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
          }}
        />
        <p className="text-xs text-gray-500 mt-1">
          Si eliges una nueva imagen, se reemplazará la anterior.
        </p>
      </div>

      <div className="flex gap-3">
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