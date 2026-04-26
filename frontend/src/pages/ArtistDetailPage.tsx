import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_URL, buildImageUrl } from "../services/api";

type Work = {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number | string;
  imagen?: string | null;
  imagenUrl?: string | null;
  stock: number;
};

type ArtistDetail = {
  id: number;
  nombre: string;
  descripcion: string;
  foto?: string | null;
  fotoUrl?: string | null;
  origen?: string;
  instagram?: string;
  facebook?: string;
  web?: string;
  obras?: Work[];
};

export default function ArtistDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Artista no encontrado.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_URL}/artistas/${id}`);

        if (!res.ok) {
          throw new Error("No se pudo cargar el artista");
        }

        const data = (await res.json()) as ArtistDetail;
        setArtist(data);
      } catch (e) {
        console.error(e);
        setError("No se pudo cargar el artista. Intenta más tarde.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-sm text-gray-400 animate-pulse">
          Cargando artista...
        </p>
      </section>
    );
  }

  if (error || !artist) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-sm text-red-400 mb-3">
          {error ?? "Artista no encontrado."}
        </p>

        <Link
          to="/artistas"
          className="text-sm text-verdeEsmeralda hover:underline"
        >
          ← Volver a artistas
        </Link>
      </section>
    );
  }

  const obras = artist.obras ?? [];
  const artistImage = buildImageUrl(artist.fotoUrl || artist.foto);

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-xs text-gray-400 hover:text-verdeEsmeralda mb-4"
      >
        ← Volver
      </button>

      <div className="bg-[#050816] border border-gray-800 rounded-2xl p-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          {artistImage ? (
            <img
              src={artistImage}
              alt={artist.nombre}
              className="w-full aspect-square object-cover rounded-2xl border border-gray-800"
            />
          ) : (
            <div className="w-full aspect-square rounded-2xl border border-gray-800 flex items-center justify-center text-gray-500 text-sm">
              Sin foto
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold text-gray-100">{artist.nombre}</h1>

          <p className="text-sm text-gray-300 mt-2">
            {artist.descripcion || "Artista de la colectiva Crisálida."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {artist.origen && (
              <span className="px-3 py-1 rounded-full border border-gray-700 text-gray-200">
                📍 {artist.origen}
              </span>
            )}

            {artist.instagram && (
              <a
                className="px-3 py-1 rounded-full border border-gray-700 text-verdeEsmeralda hover:underline"
                href={artist.instagram}
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>
            )}

            {artist.facebook && (
              <a
                className="px-3 py-1 rounded-full border border-gray-700 text-verdeEsmeralda hover:underline"
                href={artist.facebook}
                target="_blank"
                rel="noreferrer"
              >
                Facebook
              </a>
            )}

            {artist.web && (
              <a
                className="px-3 py-1 rounded-full border border-gray-700 text-verdeEsmeralda hover:underline"
                href={artist.web}
                target="_blank"
                rel="noreferrer"
              >
                Web
              </a>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-verdeEsmeralda mt-8 mb-4">
        🖼 Obras de {artist.nombre}
      </h2>

      {obras.length === 0 ? (
        <div className="bg-[#050816] border border-gray-800 rounded-2xl p-6 text-sm text-gray-300">
          Este artista aún no tiene obras registradas.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {obras.map((w) => {
            const price =
              typeof w.precio === "number" ? w.precio : Number(w.precio ?? 0);

            const safePrice = Number.isFinite(price) ? price : 0;
            const imageUrl = buildImageUrl(w.imagenUrl || w.imagen);

            return (
              <article
                key={w.id}
                className="bg-[#050816] border border-gray-800 rounded-2xl overflow-hidden flex flex-col"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={w.titulo}
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <div className="h-44 flex items-center justify-center text-gray-500 text-sm">
                    Sin imagen
                  </div>
                )}

                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-gray-100">{w.titulo}</p>

                    <p className="text-sm font-bold text-gray-100">
                      {safePrice.toFixed(2)} Bs
                    </p>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-3">
                    {w.descripcion}
                  </p>

                  <div className="mt-auto flex gap-2">
                    <Link
                      to={`/obra/${w.id}`}
                      className="flex-1 text-center text-xs px-3 py-2 rounded-lg border border-gray-700 text-gray-200 hover:border-verdeEsmeralda hover:text-verdeEsmeralda"
                    >
                      Ver detalle
                    </Link>
                  </div>

                  <p className="text-[11px] text-gray-500">
                    Stock: <span className="text-gray-300">{w.stock}</span>
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}