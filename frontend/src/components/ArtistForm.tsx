import { FormEvent, useEffect, useRef, useState } from "react";

export type NewArtist = {
  nombre: string;
  descripcion: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  correo?: string;
  web?: string;
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
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [correo, setCorreo] = useState("");
  const [web, setWeb] = useState("");
  const [fotoUrlInput, setFotoUrlInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeDescription = () => {
    const element = descriptionRef.current;

    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${Math.max(element.scrollHeight, 180)}px`;
  };

  useEffect(() => {
    if (initialValues) {
      setNombre(initialValues.nombre);
      setDescripcion(initialValues.descripcion);
      setInstagram(initialValues.instagram || "");
      setFacebook(initialValues.facebook || "");
      setTiktok(initialValues.tiktok || "");
      setCorreo(initialValues.correo || "");
      setWeb(initialValues.web || "");
      setFotoUrlInput(initialValues.fotoUrl || "");
      setFile(null);
    } else {
      setNombre("");
      setDescripcion("");
      setInstagram("");
      setFacebook("");
      setTiktok("");
      setCorreo("");
      setWeb("");
      setFotoUrlInput("");
      setFile(null);
    }
  }, [initialValues]);

  useEffect(() => {
    resizeDescription();
  }, [descripcion]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const newArtist: NewArtist = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        instagram: instagram.trim(),
        facebook: facebook.trim(),
        tiktok: tiktok.trim(),
        correo: correo.trim(),
        web: web.trim(),
        foto: file || undefined,
        fotoUrl: fotoUrlInput.trim(),
      };

      onSave(newArtist);

      if (mode === "create") {
        setNombre("");
        setDescripcion("");
        setInstagram("");
        setFacebook("");
        setTiktok("");
        setCorreo("");
        setWeb("");
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
          ref={descriptionRef}
          className="w-full min-h-[180px] px-3 py-3 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm leading-relaxed resize-y overflow-hidden"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción o biografía del artista..."
          rows={7}
        />
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          Escribe solo la biografía del artista. Las redes sociales van en el panel separado de abajo para evitar enlaces duplicados o incorrectos.
        </p>
      </div>

      <div className="rounded-xl border border-gray-800 bg-[#0b1220] p-4 space-y-3">
        <h3 className="text-sm font-bold text-verdeEsmeralda">
          Redes sociales y contacto
        </h3>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Instagram</label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@usuario o enlace de Instagram"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Facebook</label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="Nombre, usuario o enlace de Facebook"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">TikTok</label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              placeholder="@usuario o enlace de TikTok"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Correo</label>
            <input
              type="email"
              className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="artista@email.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-300 text-sm mb-1">Web / enlace opcional</label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded bg-[#050816] border border-gray-700 text-gray-200 focus:ring-2 focus:ring-verdeEsmeralda text-sm"
              value={web}
              onChange={(e) => setWeb(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
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
            Imagen desde tu PC o celular
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
