import { useEffect, useMemo, useState } from "react";
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
  tiktok?: string;
  correo?: string;
  web?: string;
  obras?: Work[];
};

type SocialLink = {
  label: string;
  value: string;
  href: string;
  icon: string;
};

function normalizeExternalUrl(value: string): string {
  const clean = value.trim();
  if (!clean) return "";
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  return `https://${clean}`;
}

function normalizeInstagram(value: string): string {
  const clean = value.trim().replace(/^@/, "");
  if (!clean) return "";
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  return `https://www.instagram.com/${clean}`;
}

function normalizeTikTok(value: string): string {
  const clean = value.trim().replace(/^@/, "");
  if (!clean) return "";
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  return `https://www.tiktok.com/@${clean}`;
}

function normalizeFacebook(value: string): string {
  const clean = value.trim();
  if (!clean) return "";
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  return `https://www.facebook.com/search/top?q=${encodeURIComponent(clean)}`;
}

function normalizeEmail(value: string): string {
  const clean = value.trim();
  return clean ? `mailto:${clean}` : "";
}

function uniqueLinks(links: SocialLink[]): SocialLink[] {
  const seenLabels = new Set<string>();

  return links.filter((link) => {
    const key = link.label.toLowerCase();

    if (seenLabels.has(key)) return false;

    seenLabels.add(key);
    return true;
  });
}

function buildArtistInfo(artist: ArtistDetail): {
  description: string;
  links: SocialLink[];
} {
  const description =
    artist.descripcion?.trim() || "Artista de la colectiva Crisálida.";

  const links: SocialLink[] = [];

  const pushLink = (link: SocialLink) => {
    if (link.value.trim() && link.href.trim()) {
      links.push(link);
    }
  };

  if (artist.instagram?.trim()) {
    pushLink({
      label: "Instagram",
      value: artist.instagram,
      href: normalizeInstagram(artist.instagram),
      icon: "📸",
    });
  }

  if (artist.facebook?.trim()) {
    pushLink({
      label: "Facebook",
      value: artist.facebook,
      href: normalizeFacebook(artist.facebook),
      icon: "📘",
    });
  }

  if (artist.tiktok?.trim()) {
    pushLink({
      label: "TikTok",
      value: artist.tiktok,
      href: normalizeTikTok(artist.tiktok),
      icon: "🎵",
    });
  }

  if (artist.correo?.trim()) {
    pushLink({
      label: "Correo",
      value: artist.correo,
      href: normalizeEmail(artist.correo),
      icon: "✉️",
    });
  }

  if (artist.web?.trim()) {
    pushLink({
      label: "Web",
      value: artist.web,
      href: normalizeExternalUrl(artist.web),
      icon: "🌐",
    });
  }

  return {
    description,
    links: uniqueLinks(links),
  };
}

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

  const artistInfo = useMemo(() => {
    if (!artist) {
      return {
        description: "",
        links: [] as SocialLink[],
      };
    }

    return buildArtistInfo(artist);
  }, [artist]);

  if (loading) {
    return (
      <section className="w-full min-h-screen px-6 lg:px-14 py-10 bg-gradient-to-b from-[#020617] via-[#040b1d] to-black">
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

      <div className="w-full bg-[#050816]/90 backdrop-blur-md border border-emerald-500/10 rounded-[2rem] p-8 lg:p-12 grid lg:grid-cols-[420px_1fr] gap-10 shadow-2xl shadow-black/40">
        <div className="md:col-span-1">
          {artistImage ? (
            <img
              src={artistImage}
              alt={artist.nombre}
              className="w-full h-full max-h-[700px] object-cover rounded-[2rem] border border-emerald-500/10 shadow-2xl"
            />
          ) : (
            <div className="w-full aspect-square rounded-2xl border border-gray-800 flex items-center justify-center text-gray-500 text-sm">
              Sin foto
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-verdeEsmeralda font-semibold">
              Artista Crisálida
            </p>

            <h1 className="text-5xl lg:text-7xl font-black text-white mt-3 tracking-tight leading-none">
              {artist.nombre}
            </h1>

            {artist.origen && (
              <p className="text-sm text-gray-400 mt-2">📍 {artist.origen}</p>
            )}
          </div>

          <div>
            <h2 className="text-sm font-bold text-verdeEsmeralda mb-2">
              Descripción
            </h2>

            <p className="text-[17px] lg:text-lg text-gray-300 whitespace-pre-line leading-[1.9] tracking-wide max-w-5xl">
              {artistInfo.description}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold text-verdeEsmeralda mb-3">
              Redes y contacto
            </h2>

            {artistInfo.links.length === 0 ? (
              <p className="text-xs text-gray-500">
                No hay redes sociales registradas.
              </p>
            ) : (
              <div className="flex flex-wrap gap-4 pt-2">
                {artistInfo.links.map((link) => (
                  <a
                    key={link.label}
                    className="px-5 py-3 rounded-full border border-emerald-400/20 bg-black/20 text-verdeEsmeralda hover:border-verdeEsmeralda hover:bg-verdeEsmeralda/10 text-xs font-semibold transition"
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.icon} {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-3xl font-black text-verdeEsmeralda mt-16 mb-8 tracking-wide">
        🖼 Obras de {artist.nombre}
      </h2>

      {obras.length === 0 ? (
        <div className="bg-[#050816] border border-gray-800 rounded-2xl p-6 text-sm text-gray-300">
          Este artista aún no tiene obras registradas.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
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