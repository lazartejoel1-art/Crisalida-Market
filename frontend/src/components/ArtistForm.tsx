import { useEffect, useState, FormEvent } from "react";

export type NewArtist = {
  nombre: string;
  descripcion: string;
  foto?: File;
  fotoUrl?: string;
};

interface ArtistFormProps {
  onSave: (data: NewArtist) => void;
  initialValues?: NewArtist;
  mode?: "create" | "edit";
  onCancel?: () => void;
}

export default function ArtistForm({
  onSave,
  initialValues,
  mode = "create",
  onCancel,
}: ArtistFormProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fotoUrlInput, setFotoUrlInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Rellenar formulario cuando cambie el artista en edición
  useEffect(() => {
    if (initialValues) {
      setNombre(initialValues.nombre);
      setDescripcion(initialValues.descripcion);
      setFotoUrlInput(initialValues.fotoUrl || "");
      setFile(null);
    } else {
      setNombre("");
      setDescripcion("");
      setFotoUrlInput("");
      setFile(null);
    }
  }, [initialValues]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let finalFotoUrl = fotoUrlInput;

      // Si el usuario seleccionó un archivo, lo subimos al backend
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(
          "http://localhost:3000/artistas/upload-image",
          {
            method: "POST",
            body: formData,
          },
        );

        if (!res.ok) {
          console.error("Error subiendo imagen");
        } else {
          const data = (await res.json()) as { url?: string };
          finalFotoUrl = data.url || finalFotoUrl;
        }
      }

      const newArtist: NewArtist = {
        nombre,
        descripcion,
        foto: file || undefined,
        fotoUrl: finalFotoUrl,
      };

      onSave(newArtist);

      // 🔥 LIMPIAR FORMULARIO SOLO AL CREAR
      if (mode === "create") {
        setNombre("");
        setDescripcion("");
        setFotoUrlInput("");
        setFile(null);
      }
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
        {mode === "create" ? "➕ Agregar artista" : "✏️ Editar artista"}
      </h2>

      <div>
        <label className="block text-gray-300 text-sm mb-1">Nombre</label>
        <input
          type="text"
          className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Antonella"
        />
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-1">Descripción</label>
        <textarea
          className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción breve del artista"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-gray-300 text-sm mb-1">
            URL de la foto (opcional)
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
            value={fotoUrlInput}
            onChange={(e) => setFotoUrlInput(e.target.value)}
            placeholder="https://..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Si no pones URL, se usará la imagen que subas desde tu PC.
          </p>
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
              ? "Guardar artista"
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