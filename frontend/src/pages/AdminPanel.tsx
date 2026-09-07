import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArtistForm, { NewArtist } from "../components/ArtistForm";
import WorkForm, { NewWork } from "../components/WorkForm";
import { buildImageUrl } from "../services/api";

/**
 * =========================================================
 * ✅ ADMIN PANEL - CRISÁLIDA
 * Panel admin:
 * - Dashboard
 * - Artistas
 * - Obras
 * - Pedidos
 * - Reportes
 * =========================================================
 */

type Artist = {
  id: number;
  nombre: string;
  descripcion: string;
  fotoUrl?: string | null;
  foto?: string | null;
};

type Work = {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number | string;
  imagen?: string | null;
  imagenUrl?: string | null;
  tecnica?: string | null;
  tecnicaEspecifica?: string | null;
  area?: string | null;
  categoria?: string | null;
  stock: number;
  artista?: {
    id: number;
    nombre: string;
  };
};

type ObraArtistaInvitado = {
  titulo: string;
  tecnica?: string;
  anio?: string;
  descripcion?: string;
  imagenUrl?: string;
  precio?: string;
};

type ArtistaInvitadoEvento = {
  nombre: string;
  especialidad?: string;
  descripcion?: string;
  imagenUrl?: string;
  obras?: ObraArtistaInvitado[];
};

type Evento = {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha?: string;
  lugar?: string;
  flyer?: string | null;
  flyerUrl?: string | null;
  activo?: boolean;
  artistasInvitados?: ArtistaInvitadoEvento[];
};

type PedidoItem = {
  obraId: number;
  titulo?: string;
  precio?: number | string;
  subtotal?: number | string;
  cantidad: number;
  imagen?: string | null;
  imagenUrl?: string | null;
  artistaNombre?: string;
};

type PedidoEstado =
  | "pendiente"
  | "pagado"
  | "entregado"
  | "cancelado"
  | string;

type Pedido = {
  id: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerNote?: string;
  metodoPago: "QR" | "EFECTIVO" | string;
  total: number | string;
  estado?: PedidoEstado;
  createdAt?: string;
  yaPago?: boolean;
  comprobante?: string;
  items: PedidoItem[];
};

type AnalyticsSummary = {
  totalVisits?: number;
  uniqueIps?: number;
  visitsToday?: number;
  last7Days?: Array<{ date: string; visits: number }>;
  totalVisitas?: number;
  ipsUnicas?: number;
  visitasHoy?: number;
  ultimos7Dias?: Array<{ date: string; visits: number }>;
};

type ClienteReporte = {
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  cantidadPedidos: number;
  totalComprado: number;
};

type ObraVendida = {
  obraId: number;
  titulo: string;
  artistaNombre: string;
  cantidadVendida: number;
  totalVendido: number;
  imagen?: string | null;
  imagenUrl?: string | null;
  tecnica?: string | null;
};

type ResumenReporte = {
  totalPedidos: number;
  totalIngresos: number;
  totalPedidosHoy: number;
  totalIngresosHoy: number;
  totalPedidosFiltrados?: number;
  totalIngresosFiltrados?: number;
  porMetodo: Record<string, number>;
  pedidosRecientes: Pedido[];
  pedidos: Pedido[];
  pedidosFiltrados?: Pedido[];
  clientes?: ClienteReporte[];
  obrasVendidas?: ObraVendida[];
  artistasMasVendidos?: ObraVendida[];
  artistasMenosVendidos?: ObraVendida[];
};

const API =
  import.meta.env.VITE_API_URL || "https://crisalida-market.onrender.com";

const EMPTY_REPORT: ResumenReporte = {
  totalPedidos: 0,
  totalIngresos: 0,
  totalPedidosHoy: 0,
  totalIngresosHoy: 0,
  totalPedidosFiltrados: 0,
  totalIngresosFiltrados: 0,
  porMetodo: {},
  pedidosRecientes: [],
  pedidos: [],
  pedidosFiltrados: [],
  clientes: [],
  obrasVendidas: [],
  artistasMasVendidos: [],
  artistasMenosVendidos: [],
};

function formatPrecio(precio: number | string | null | undefined): string {
  if (precio === null || precio === undefined || precio === "") return "0.00";

  if (typeof precio === "number") {
    return Number.isFinite(precio) ? precio.toFixed(2) : "0.00";
  }

  let value = String(precio).trim();
  value = value.replace(/[^\d.,-]/g, "");

  if (value.includes(",") && value.includes(".")) {
    const lastComma = value.lastIndexOf(",");
    const lastDot = value.lastIndexOf(".");
    const decimalIsComma = lastComma > lastDot;

    value = decimalIsComma
      ? value.replace(/\./g, "").replace(",", ".")
      : value.replace(/,/g, "");
  } else if (value.includes(",")) {
    value = value.replace(",", ".");
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toFixed(2) : "0.00";
}

function formatFecha(iso?: string): string {
  if (!iso) return "Sin fecha";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleString("es-BO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

function getAdminImageUrl(
  image?: string | null,
  fallbackImage?: string | null,
): string | null {
  const cleanImage = image && String(image).trim() !== "" ? image : null;
  const cleanFallback =
    fallbackImage && String(fallbackImage).trim() !== "" ? fallbackImage : null;

  return buildImageUrl(cleanImage || cleanFallback);
}

function normalizeArtistImage(artist: Artist): string | null {
  return getAdminImageUrl(artist.fotoUrl, artist.foto);
}

function enrichPedidoItemsWithImages(
  pedidos: Pedido[],
  obras: Work[],
): Pedido[] {
  return pedidos.map((pedido) => ({
    ...pedido,
    items: Array.isArray(pedido.items)
      ? pedido.items.map((item) => {
          const obra = obras.find((work) => Number(work.id) === Number(item.obraId));

          return {
            ...item,
            imagenUrl:
              item.imagenUrl || item.imagen || obra?.imagenUrl || obra?.imagen || null,
            imagen:
              item.imagen || item.imagenUrl || obra?.imagen || obra?.imagenUrl || null,
            titulo: item.titulo || obra?.titulo || `Obra #${item.obraId}`,
            artistaNombre: item.artistaNombre || obra?.artista?.nombre || "",
          };
        })
      : [],
  }));
}

function enrichObrasVendidasWithImages(
  obrasVendidas: ObraVendida[] | undefined,
  obras: Work[],
): ObraVendida[] {
  if (!Array.isArray(obrasVendidas)) return [];

  return obrasVendidas.map((obraVendida) => {
    const obra = obras.find((work) => Number(work.id) === Number(obraVendida.obraId));

    return {
      ...obraVendida,
      imagenUrl:
        obraVendida.imagenUrl ||
        obraVendida.imagen ||
        obra?.imagenUrl ||
        obra?.imagen ||
        null,
      imagen:
        obraVendida.imagen ||
        obraVendida.imagenUrl ||
        obra?.imagen ||
        obra?.imagenUrl ||
        null,
      titulo: obraVendida.titulo || obra?.titulo || `Obra #${obraVendida.obraId}`,
      artistaNombre:
        obraVendida.artistaNombre || obra?.artista?.nombre || "Crisálida",
    };
  });
}

function getEstadoBadgeClass(estado?: string): string {
  switch ((estado ?? "pendiente").toLowerCase()) {
    case "pagado":
      return "bg-blue-900/30 text-blue-300 border border-blue-800/40";
    case "entregado":
      return "bg-emerald-900/30 text-emerald-300 border border-emerald-800/40";
    case "cancelado":
      return "bg-red-900/30 text-red-300 border border-red-800/40";
    default:
      return "bg-yellow-900/30 text-yellow-300 border border-yellow-800/40";
  }
}

async function parseResponseError(res: Response): Promise<string> {
  const text = await res.text();

  if (!text) {
    return `Error HTTP ${res.status}.`;
  }

  try {
    const parsed = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) return parsed.message.join(" ");
    if (typeof parsed.message === "string") return parsed.message;
  } catch {
    return text;
  }

  return text;
}

function DashboardHome({
  artistsCount,
  worksCount,
  totalStock,
  outOfStockCount,
  latestWorks,
  onGoArtists,
  onGoWorks,
  onGoOrders,
  onEditWork,
}: {
  artistsCount: number;
  worksCount: number;
  totalStock: number;
  outOfStockCount: number;
  latestWorks: Work[];
  onGoArtists: () => void;
  onGoWorks: () => void;
  onGoOrders: () => void;
  onEditWork: (work: Work) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-verdeEsmeralda mb-2">
          Bienvenido a Crisálida Admin
        </h1>
        <p className="text-gray-300 text-sm">
          Desde aquí puedes administrar artistas, obras, pedidos y ver reportes.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400">Artistas</p>
          <p className="text-2xl font-extrabold text-gray-100">{artistsCount}</p>
        </div>

        <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400">Obras</p>
          <p className="text-2xl font-extrabold text-gray-100">{worksCount}</p>
        </div>

        <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400">Stock total</p>
          <p className="text-2xl font-extrabold text-gray-100">{totalStock}</p>
        </div>

        <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400">Obras sin stock</p>
          <p className="text-2xl font-extrabold text-gray-100">{outOfStockCount}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onGoArtists}
          className="px-4 py-2 rounded-lg bg-verdeEsmeralda text-black font-semibold hover:opacity-90 transition"
        >
          🎨 Administrar Artistas
        </button>

        <button
          onClick={onGoWorks}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white font-semibold hover:bg-white/15 transition"
        >
          🖼 Administrar Obras
        </button>

        <button
          onClick={onGoOrders}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white font-semibold hover:bg-white/15 transition"
        >
          📦 Gestionar Pedidos
        </button>
      </div>

      <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-100">Últimas obras</h2>
          <p className="text-xs text-gray-400">Click para editar rápido</p>
        </div>

        {latestWorks.length === 0 ? (
          <p className="text-sm text-gray-400">
            Aún no hay obras registradas. Ve a “Obras” para crear la primera.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestWorks.map((work) => {
              const imageUrl = getAdminImageUrl(work.imagenUrl, work.imagen);

              return (
                <button
                  key={work.id}
                  type="button"
                  onClick={() => onEditWork(work)}
                  className="text-left rounded-xl overflow-hidden border border-gray-800 bg-[#0b1220] hover:border-verdeEsmeralda/40 transition"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={work.titulo}
                      className="w-full h-32 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center text-xs text-gray-500">
                      Sin imagen
                    </div>
                  )}

                  <div className="p-3">
                    <p className="text-sm font-bold text-gray-100 line-clamp-1">
                      {work.titulo}
                    </p>
                    <p className="text-xs text-verdeEsmeralda line-clamp-1">
                      {work.artista?.nombre ?? "Crisálida"}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-gray-300">
                        {formatPrecio(work.precio)} Bs
                      </span>
                      <span className="text-gray-400">Stock: {work.stock}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ArtistsManager() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadArtists = useCallback(async (): Promise<Artist[]> => {
    const res = await fetch(`${API}/artistas`);
    const data = (await res.json()) as Artist[];
    return Array.isArray(data) ? data : [];
  }, []);

  useEffect(() => {
    let alive = true;

    void (async () => {
      try {
        const data = await loadArtists();
        if (alive) setArtists(data);
      } catch (error) {
        console.error("Error al cargar artistas", error);
        if (alive) setArtists([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [loadArtists]);

  const handleSave = async (formData: NewArtist) => {
    setMessage(null);

    try {
      const data = new FormData();
      data.append("nombre", formData.nombre);
      data.append("descripcion", formData.descripcion);

      if (formData.foto instanceof File) {
        data.append("foto", formData.foto, formData.foto.name);
      }

      const url = editingArtist
        ? `${API}/artistas/${editingArtist.id}`
        : `${API}/artistas`;

      const res = await fetch(url, {
        method: editingArtist ? "PATCH" : "POST",
        body: data,
      });

      if (!res.ok) {
        throw new Error(await parseResponseError(res));
      }

      setEditingArtist(null);
      setArtists(await loadArtists());
      setMessage("Artista guardado correctamente ✅");
    } catch (error) {
      console.error(error);
      setMessage(getErrorMessage(error));
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`${API}/artistas/${id}`, { method: "DELETE" });

    if (!res.ok) {
      setMessage("No se pudo eliminar el artista.");
      return;
    }

    setArtists(await loadArtists());
  };

  const initialValues: NewArtist | undefined = editingArtist
    ? {
        nombre: editingArtist.nombre,
        descripcion: editingArtist.descripcion,
        fotoUrl: editingArtist.fotoUrl ?? editingArtist.foto ?? undefined,
      }
    : undefined;

  return (
    <div className="w-full overflow-x-hidden">
      <ArtistForm
        onSave={handleSave}
        initialValues={initialValues}
        mode={editingArtist ? "edit" : "create"}
        onCancel={editingArtist ? () => setEditingArtist(null) : undefined}
      />

      {message && (
        <div className="mt-3 mb-4 rounded-lg border border-gray-800 bg-[#0e1624] p-3 text-sm text-gray-200">
          {message}
        </div>
      )}

      <h2 className="text-xl font-bold text-verdeEsmeralda mb-4">
        🎨 Lista de artistas
      </h2>

      {artists.length === 0 && (
        <p className="text-sm text-gray-400">
          Aún no hay artistas registrados. Agrega uno con el formulario de arriba.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 mt-2 w-full">
        {artists.map((artist) => {
          const imageUrl = normalizeArtistImage(artist);

          return (
            <div
              key={artist.id}
              className="bg-[#0e1624] border border-gray-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center min-w-0 flex-1">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={artist.nombre}
                    className="w-20 h-20 sm:w-12 sm:h-12 rounded-full object-cover shrink-0"
                  />
                )}

                <div className="min-w-0 w-full">
                  <p className="font-semibold text-gray-200 break-words">
                    {artist.nombre}
                  </p>
                  <p className="text-sm text-gray-400 leading-relaxed break-words line-clamp-4 sm:line-clamp-2">
                    {artist.descripcion}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end shrink-0">
                <button
                  onClick={() => setEditingArtist(artist)}
                  className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 flex-1 sm:flex-none"
                >
                  Editar
                </button>

                <button
                  onClick={() => void handleDelete(artist.id)}
                  className="text-xs px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 flex-1 sm:flex-none"
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ObrasManager({
  editingWork,
  onClearEditingWork,
}: {
  editingWork: Work | null;
  onClearEditingWork: () => void;
}) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [localEditingWork, setLocalEditingWork] = useState<Work | null>(null);
  const [savingWork, setSavingWork] = useState(false);
  const [workMessage, setWorkMessage] = useState<string | null>(null);

  const effectiveEditingWork = editingWork ?? localEditingWork;

  const fetchArtists = useCallback(async (): Promise<Artist[]> => {
    const res = await fetch(`${API}/artistas`);
    const data = (await res.json()) as Artist[];
    return Array.isArray(data) ? data : [];
  }, []);

  const fetchWorks = useCallback(async (): Promise<Work[]> => {
    const res = await fetch(`${API}/obras`);
    const data = (await res.json()) as Work[];
    return Array.isArray(data) ? data : [];
  }, []);

  useEffect(() => {
    let alive = true;

    void (async () => {
      try {
        const [loadedArtists, loadedWorks] = await Promise.all([
          fetchArtists(),
          fetchWorks(),
        ]);

        if (!alive) return;

        setArtists(loadedArtists);
        setWorks(loadedWorks);
      } catch (error) {
        console.error(error);

        if (!alive) return;

        setArtists([]);
        setWorks([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [fetchArtists, fetchWorks]);

  const handleSave = async (formData: NewWork) => {
    setSavingWork(true);
    setWorkMessage(null);

    try {
      const titulo = String(formData.titulo ?? "").trim();
      const descripcion = String(formData.descripcion ?? "").trim();
      const precio = Number(formData.precio);
      const stock = Number(formData.stock);
      const artistaId = Number(formData.artistaId);

      if (!titulo) throw new Error("Falta el título de la obra.");
      if (!Number.isFinite(precio) || precio <= 0) {
        throw new Error("El precio debe ser mayor a 0.");
      }
      if (!Number.isFinite(stock) || stock < 0) {
        throw new Error("El stock debe ser 0 o mayor.");
      }
      if (!Number.isFinite(artistaId) || artistaId <= 0) {
        throw new Error("Debes seleccionar un artista.");
      }
      if (!effectiveEditingWork && !(formData.imagen instanceof File)) {
        throw new Error("Debes seleccionar una imagen para crear la obra.");
      }

      const data = new FormData();
      data.append("titulo", titulo);
      data.append("descripcion", descripcion);
      data.append("precio", String(precio));
      data.append("stock", String(stock));
      data.append("artistaId", String(artistaId));

      if (formData.imagen instanceof File) {
        data.append("imagen", formData.imagen, formData.imagen.name);
      }

      const url = effectiveEditingWork
        ? `${API}/obras/${effectiveEditingWork.id}`
        : `${API}/obras`;

      const res = await fetch(url, {
        method: effectiveEditingWork ? "PATCH" : "POST",
        body: data,
      });

      if (!res.ok) {
        throw new Error(await parseResponseError(res));
      }

      setLocalEditingWork(null);
      onClearEditingWork();
      setWorks(await fetchWorks());
      setWorkMessage(
        effectiveEditingWork
          ? "Obra actualizada correctamente ✅"
          : "Obra creada correctamente ✅",
      );
    } catch (error) {
      console.error("Error al guardar obra:", error);
      setWorkMessage(getErrorMessage(error));
    } finally {
      setSavingWork(false);
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`${API}/obras/${id}`, { method: "DELETE" });

    if (!res.ok) {
      setWorkMessage("No se pudo eliminar la obra.");
      return;
    }

    setWorks(await fetchWorks());
  };

  const handleQuickStockUpdate = async (
    work: Work,
    nextStock: number,
    label: string,
  ) => {
    setWorkMessage(null);

    try {
      const data = new FormData();
      data.append("stock", String(nextStock));

      const res = await fetch(`${API}/obras/${work.id}`, {
        method: "PATCH",
        body: data,
      });

      if (!res.ok) {
        throw new Error(await parseResponseError(res));
      }

      setWorks(await fetchWorks());
      setWorkMessage(`Obra marcada como "${label}" ✅`);
    } catch (error) {
      console.error(error);
      setWorkMessage(getErrorMessage(error));
    }
  };

  const initialValues: NewWork | undefined = effectiveEditingWork
    ? {
        titulo: effectiveEditingWork.titulo,
        descripcion: effectiveEditingWork.descripcion,
        precio:
          typeof effectiveEditingWork.precio === "number"
            ? effectiveEditingWork.precio
            : Number(effectiveEditingWork.precio),
        imagenUrl: effectiveEditingWork.imagenUrl ?? effectiveEditingWork.imagen ?? undefined,
        stock: effectiveEditingWork.stock,
        artistaId: effectiveEditingWork.artista?.id ?? 0,
      }
    : undefined;

  const artistOptions = artists.map((artist) => ({
    id: artist.id,
    nombre: artist.nombre,
  }));

  return (
    <div>
      <WorkForm
        onSave={handleSave}
        artists={artistOptions}
        initialValues={initialValues}
        mode={effectiveEditingWork ? "edit" : "create"}
        onCancel={
          effectiveEditingWork
            ? () => {
                setLocalEditingWork(null);
                onClearEditingWork();
              }
            : undefined
        }
      />

      {savingWork && (
        <p className="mt-3 text-sm text-yellow-300">
          Guardando obra, espera unos segundos...
        </p>
      )}

      {workMessage && (
        <div className="mt-3 mb-4 rounded-lg border border-gray-800 bg-[#0e1624] p-3 text-sm text-gray-200">
          {workMessage}
        </div>
      )}

      <h2 className="text-xl font-bold text-verdeEsmeralda mb-4">
        🖼 Lista de obras
      </h2>

      {works.length === 0 && (
        <p className="text-sm text-gray-400">
          Aún no hay obras registradas. Agrega una con el formulario de arriba.
        </p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
        {works.map((work) => {
          const imageUrl = getAdminImageUrl(work.imagenUrl, work.imagen);

          return (
            <div
              key={work.id}
              className="bg-[#0e1624] border border-gray-800 p-4 rounded-lg flex flex-col gap-3"
            >
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={work.titulo}
                  className="w-full h-40 rounded-lg object-cover"
                  loading="lazy"
                />
              )}

              <div className="flex-1">
                <p className="font-semibold text-gray-200">{work.titulo}</p>
                <p className="text-xs text-verdeEsmeralda mb-1">
                  {work.artista?.nombre}
                </p>
                <p className="text-sm text-gray-400 line-clamp-3">
                  {work.descripcion}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-bold text-gray-100">
                  {formatPrecio(work.precio)} Bs
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    Number(work.stock ?? 0) > 0
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-red-500/15 text-red-700 dark:text-red-300"
                  }`}
                >
                  {Number(work.stock ?? 0) > 0 ? "Disponible" : "No disponible"}
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-neutral-400">
                  Estado rápido
                </p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() =>
                      void handleQuickStockUpdate(work, 1, "Disponible")
                    }
                    className="min-h-[44px] w-full rounded-2xl bg-emerald-600 px-2 py-2 text-[11px] font-black leading-tight text-white transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                  >
                    Disponible
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleQuickStockUpdate(work, 0, "No disponible")
                    }
                    className="min-h-[44px] w-full rounded-2xl border border-red-200 bg-red-50 px-2 py-2 text-[10px] font-black leading-tight text-red-600 transition hover:bg-red-100 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                  >
                    No disponible
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleQuickStockUpdate(work, 0, "No está a la venta")
                    }
                    className="min-h-[44px] w-full rounded-2xl border border-neutral-300 bg-white px-2 py-2 text-[10px] font-black leading-tight text-neutral-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"
                  >
                    No venta
                  </button>
                </div>

                <p className="mt-2 text-[11px] text-neutral-400">
                  Stock actual: {work.stock}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end shrink-0">
                <button
                  onClick={() => setLocalEditingWork(work)}
                  className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 flex-1 sm:flex-none"
                >
                  Editar
                </button>

                <button
                  onClick={() => void handleDelete(work.id)}
                  className="text-xs px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 flex-1 sm:flex-none"
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrdersManager() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const loadOrders = useCallback(async (): Promise<Pedido[]> => {
    const [pedidosRes, obrasRes] = await Promise.all([
      fetch(`${API}/pedidos`),
      fetch(`${API}/obras`),
    ]);

    const pedidosData = (await pedidosRes.json()) as Pedido[];
    const obrasData = (await obrasRes.json()) as Work[];

    const pedidos = Array.isArray(pedidosData) ? pedidosData : [];
    const obras = Array.isArray(obrasData) ? obrasData : [];

    return enrichPedidoItemsWithImages(pedidos, obras);
  }, []);

  useEffect(() => {
    let alive = true;

    void (async () => {
      try {
        const data = await loadOrders();

        if (!alive) return;

        const normalized = data.map((pedido) => ({
          ...pedido,
          estado: pedido.estado ?? "pendiente",
          items: Array.isArray(pedido.items) ? pedido.items : [],
          yaPago: pedido.yaPago ?? false,
          comprobante: pedido.comprobante ?? "",
          buyerPhone: pedido.buyerPhone ?? "",
        }));

        setOrders(normalized.sort((a, b) => Number(b.id) - Number(a.id)));
      } catch (error) {
        console.error(error);

        if (!alive) return;

        setOrders([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [loadOrders]);

  const updateOrderStateLocal = (id: number, estado: PedidoEstado) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, estado } : order)),
    );
  };

  const handleSetEstado = async (id: number, estado: PedidoEstado) => {
    const previous = orders.find((order) => order.id === id)?.estado ?? "pendiente";

    updateOrderStateLocal(id, estado);
    setSavingId(id);
    setInfoMsg(null);

    try {
      const res = await fetch(`${API}/pedidos/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });

      if (!res.ok) {
        throw new Error("No se pudo guardar el estado en backend.");
      }

      setInfoMsg(`Estado del pedido #${id} actualizado a "${estado}".`);
    } catch (error) {
      console.error(error);
      updateOrderStateLocal(id, previous);
      setInfoMsg(
        `No se pudo guardar el estado del pedido #${id}. Verifica el backend.`,
      );
    } finally {
      setSavingId(null);
      setTimeout(() => setInfoMsg(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-verdeEsmeralda mb-2">
          Gestión de pedidos 📦
        </h1>
        <p className="text-sm text-gray-300">
          Revisa los pedidos realizados, las obras incluidas y actualiza su estado.
        </p>
      </div>

      {infoMsg && (
        <div className="text-sm text-gray-200 bg-[#0e1624] border border-gray-800 rounded-xl p-3">
          {infoMsg}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400">Cargando pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-5 text-sm text-gray-400">
          Aún no hay pedidos registrados.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-[#0e1624] border border-gray-800 rounded-xl p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-gray-100">
                      Pedido #{order.id}
                    </h2>
                    <span
                      className={`text-[11px] px-2 py-1 rounded-full ${getEstadoBadgeClass(
                        order.estado,
                      )}`}
                    >
                      {order.estado ?? "pendiente"}
                    </span>
                  </div>

                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-gray-100">Cliente:</span>{" "}
                    {order.buyerName}
                  </p>
                  <p className="text-sm text-gray-400">{order.buyerEmail}</p>

                  {order.buyerPhone && (
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold text-gray-100">Teléfono:</span>{" "}
                      {order.buyerPhone}
                    </p>
                  )}

                  <p className="text-xs text-gray-500">
                    Fecha: {formatFecha(order.createdAt)}
                  </p>

                  <p className="text-xs text-gray-400">
                    Pago:{" "}
                    <span className="font-semibold text-gray-200">
                      {order.metodoPago}
                    </span>
                  </p>

                  <p className="text-xs text-gray-400">
                    Ya pagó:{" "}
                    <span
                      className={
                        order.yaPago
                          ? "text-emerald-400 font-semibold"
                          : "text-yellow-300 font-semibold"
                      }
                    >
                      {order.yaPago ? "Sí" : "No"}
                    </span>
                  </p>

                  {order.comprobante && (
                    <p className="text-xs text-gray-500 whitespace-pre-line">
                      Comprobante: {order.comprobante}
                    </p>
                  )}

                  {order.buyerNote && (
                    <p className="text-xs text-gray-500 whitespace-pre-line">
                      Nota: {order.buyerNote}
                    </p>
                  )}
                </div>

                <div className="text-left lg:text-right">
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-2xl font-extrabold text-verdeEsmeralda">
                    {formatPrecio(order.total)} Bs
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-bold text-gray-100 mb-3">
                  Obras incluidas
                </h3>

                {order.items?.length ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    {order.items.map((item, index) => {
                      const imageUrl = getAdminImageUrl(item.imagenUrl, item.imagen);

                      return (
                        <div
                          key={`${order.id}-${item.obraId}-${index}`}
                          className="bg-[#0b1220] border border-gray-800 rounded-xl p-3 flex gap-3"
                        >
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.titulo ?? `Obra ${item.obraId}`}
                              className="w-20 h-20 rounded-lg object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-[#111827] border border-gray-700 flex items-center justify-center text-[10px] text-gray-500">
                              Sin imagen
                            </div>
                          )}

                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-100">
                              {item.titulo ?? `Obra #${item.obraId}`}
                            </p>

                            {item.artistaNombre && (
                              <p className="text-xs text-verdeEsmeralda">
                                {item.artistaNombre}
                              </p>
                            )}

                            <div className="mt-1 text-xs text-gray-400 space-y-1">
                              <p>Obra ID: {item.obraId}</p>
                              <p>Cantidad: {item.cantidad}</p>
                              <p>Precio: {formatPrecio(item.precio)} Bs</p>
                              <p>Subtotal: {formatPrecio(item.subtotal)} Bs</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Este pedido no tiene items visibles.
                  </p>
                )}
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-bold text-gray-100 mb-3">
                  Cambiar estado
                </h3>

                <div className="flex flex-wrap gap-2">
                  {["pendiente", "pagado", "entregado", "cancelado"].map((estado) => (
                    <button
                      key={estado}
                      onClick={() => void handleSetEstado(order.id, estado)}
                      disabled={savingId === order.id}
                      className={`text-xs px-3 py-2 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 ${
                        estado === "pendiente"
                          ? "bg-yellow-600 text-black"
                          : estado === "pagado"
                            ? "bg-blue-600 text-white"
                            : estado === "entregado"
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                      }`}
                    >
                      {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportsPanel() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [analyticsAvailable, setAnalyticsAvailable] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<
    "general" | "dia" | "mes" | "anio" | "rango"
  >("general");
  const [fecha, setFecha] = useState("");
  const [mes, setMes] = useState("");
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [resumen, setResumen] = useState<ResumenReporte>(EMPTY_REPORT);
  const [obrasCatalogo, setObrasCatalogo] = useState<Work[]>([]);

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();

    if (tipoFiltro === "dia" && fecha) params.set("fecha", fecha);

    if (tipoFiltro === "mes" && mes && anio) {
      params.set("mes", mes);
      params.set("anio", anio);
    }

    if (tipoFiltro === "anio" && anio) {
      params.set("anio", anio);
    }

    if (tipoFiltro === "rango") {
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
    }

    return params.toString();
  }, [anio, desde, fecha, hasta, mes, tipoFiltro]);

  const getReportUrl = useCallback(() => {
    const query = buildQueryString();
    return query ? `${API}/reportes?${query}` : `${API}/reportes`;
  }, [buildQueryString]);

  const loadReports = useCallback(async (): Promise<{
    resumen: ResumenReporte;
    analytics: AnalyticsSummary | null;
    analyticsAvailable: boolean;
    obras: Work[];
  }> => {
    const [resumenRes, obrasRes] = await Promise.all([
      fetch(getReportUrl()),
      fetch(`${API}/obras`),
    ]);

    if (!resumenRes.ok) {
      throw new Error(await parseResponseError(resumenRes));
    }

    if (!obrasRes.ok) {
      throw new Error(await parseResponseError(obrasRes));
    }

    const resumenData = (await resumenRes.json()) as ResumenReporte;
    const obrasData = (await obrasRes.json()) as Work[];
    const obras = Array.isArray(obrasData) ? obrasData : [];

    const obrasVendidas = enrichObrasVendidasWithImages(
      resumenData.obrasVendidas,
      obras,
    ).map((obraVendida) => {
      const obraCatalogo = obras.find(
        (obra) => Number(obra.id) === Number(obraVendida.obraId),
      );

      return {
        ...obraVendida,
        tecnica:
          obraVendida.tecnica ||
          obraCatalogo?.tecnica ||
          obraCatalogo?.tecnicaEspecifica ||
          obraCatalogo?.area ||
          obraCatalogo?.categoria ||
          null,
      };
    });

    const resumenConImagenes: ResumenReporte = {
      ...resumenData,
      pedidos: enrichPedidoItemsWithImages(resumenData.pedidos ?? [], obras),
      pedidosRecientes: enrichPedidoItemsWithImages(
        resumenData.pedidosRecientes ?? [],
        obras,
      ),
      pedidosFiltrados: enrichPedidoItemsWithImages(
        resumenData.pedidosFiltrados ?? [],
        obras,
      ),
      obrasVendidas,
      artistasMasVendidos: enrichObrasVendidasWithImages(
        resumenData.artistasMasVendidos,
        obras,
      ),
      artistasMenosVendidos: enrichObrasVendidasWithImages(
        resumenData.artistasMenosVendidos,
        obras,
      ),
    };

    try {
      const analyticsRes = await fetch(`${API}/analytics/summary`);

      if (!analyticsRes.ok) {
        return {
          resumen: resumenConImagenes,
          analytics: null,
          analyticsAvailable: false,
          obras,
        };
      }

      const analyticsData = (await analyticsRes.json()) as AnalyticsSummary;

      return {
        resumen: resumenConImagenes,
        analytics: analyticsData,
        analyticsAvailable: true,
        obras,
      };
    } catch {
      return {
        resumen: resumenConImagenes,
        analytics: null,
        analyticsAvailable: false,
        obras,
      };
    }
  }, [getReportUrl]);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const result = await loadReports();
      setResumen(result.resumen);
      setAnalytics(result.analytics);
      setAnalyticsAvailable(result.analyticsAvailable);
      setObrasCatalogo(result.obras);
    } catch (error) {
      console.error(error);
      setResumen(EMPTY_REPORT);
      setAnalytics(null);
      setAnalyticsAvailable(false);
      setObrasCatalogo([]);
    } finally {
      setLoading(false);
    }
  }, [loadReports]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const analyticsStats = useMemo(() => {
    if (!analytics) {
      return {
        totalVisitas: 0,
        ipsUnicas: 0,
        visitasHoy: 0,
      };
    }

    return {
      totalVisitas: analytics.totalVisits ?? analytics.totalVisitas ?? 0,
      ipsUnicas: analytics.uniqueIps ?? analytics.ipsUnicas ?? 0,
      visitasHoy: analytics.visitsToday ?? analytics.visitasHoy ?? 0,
    };
  }, [analytics]);

  const pedidosPeriodo = useMemo(
    () => resumen.pedidosFiltrados ?? resumen.pedidos ?? [],
    [resumen.pedidos, resumen.pedidosFiltrados],
  );

  const ingresosPeriodo = useMemo(
    () =>
      Number(
        resumen.totalIngresosFiltrados ??
          resumen.totalIngresos ??
          pedidosPeriodo.reduce(
            (acc, pedido) => acc + Number(formatPrecio(pedido.total)),
            0,
          ),
      ),
    [
      pedidosPeriodo,
      resumen.totalIngresos,
      resumen.totalIngresosFiltrados,
    ],
  );

  const totalPedidosPeriodo = useMemo(
    () =>
      resumen.totalPedidosFiltrados !== undefined
        ? Number(resumen.totalPedidosFiltrados)
        : pedidosPeriodo.length > 0
          ? pedidosPeriodo.length
          : Number(resumen.totalPedidos ?? 0),
    [pedidosPeriodo.length, resumen.totalPedidos, resumen.totalPedidosFiltrados],
  );

  const totalObrasVendidas = useMemo(
    () =>
      (resumen.obrasVendidas ?? []).reduce(
        (acc, obra) => acc + Number(obra.cantidadVendida ?? 0),
        0,
      ),
    [resumen.obrasVendidas],
  );

  const pedidosCompletados = useMemo(
    () =>
      pedidosPeriodo.filter((pedido) =>
        ["pagado", "entregado"].includes(
          String(pedido.estado ?? "").toLowerCase(),
        ),
      ).length,
    [pedidosPeriodo],
  );

  const ticketPromedio = useMemo(
    () => (totalPedidosPeriodo > 0 ? ingresosPeriodo / totalPedidosPeriodo : 0),
    [ingresosPeriodo, totalPedidosPeriodo],
  );

  const getObraTecnica = useCallback(
    (obraId: number): string => {
      const obra = obrasCatalogo.find(
        (item) => Number(item.id) === Number(obraId),
      );

      return (
        obra?.tecnica ||
        obra?.tecnicaEspecifica ||
        obra?.area ||
        obra?.categoria ||
        "Sin técnica"
      );
    },
    [obrasCatalogo],
  );

  const ventasPorTecnica = useMemo(() => {
    const base = [
      "Dibujo",
      "Pintura",
      "Escultura",
      "Grabado",
      "Cerámica",
      "Fotografía",
      "Ilustración",
    ];

    const acumulado = new Map<string, number>();

    (resumen.obrasVendidas ?? []).forEach((obra) => {
      const tecnica = obra.tecnica || getObraTecnica(obra.obraId);
      acumulado.set(
        tecnica,
        (acumulado.get(tecnica) ?? 0) + Number(obra.cantidadVendida ?? 0),
      );
    });

    const extras = [...acumulado.keys()].filter(
      (tecnica) => !base.includes(tecnica),
    );

    return [...base, ...extras]
      .map((tecnica) => ({
        tecnica,
        cantidad: acumulado.get(tecnica) ?? 0,
      }))
      .filter((item) => item.cantidad > 0 || base.includes(item.tecnica));
  }, [getObraTecnica, resumen.obrasVendidas]);

  const maxTecnica = Math.max(
    1,
    ...ventasPorTecnica.map((item) => item.cantidad),
  );

  const tecnicaMasVendida = useMemo(
    () =>
      [...ventasPorTecnica].sort((a, b) => b.cantidad - a.cantidad)[0] ?? {
        tecnica: "Sin datos",
        cantidad: 0,
      },
    [ventasPorTecnica],
  );

  const metodosPago = useMemo(() => {
    const entries = Object.entries(resumen.porMetodo ?? {}).map(
      ([metodo, cantidad]) => ({
        metodo,
        cantidad: Number(cantidad ?? 0),
      }),
    );

    const total = entries.reduce((acc, item) => acc + item.cantidad, 0);

    return entries.map((item) => ({
      ...item,
      porcentaje: total > 0 ? (item.cantidad / total) * 100 : 0,
    }));
  }, [resumen.porMetodo]);

  const donutGradient = useMemo(() => {
    if (metodosPago.length === 0) {
      return "conic-gradient(rgba(148,163,184,.18) 0deg 360deg)";
    }

    const palette = ["#34d399", "#059669", "#6ee7b7", "#10b981", "#047857"];
    let cursor = 0;

    const slices = metodosPago.map((item, index) => {
      const start = cursor;
      const end = cursor + item.porcentaje * 3.6;
      cursor = end;
      return `${palette[index % palette.length]} ${start}deg ${end}deg`;
    });

    return `conic-gradient(${slices.join(", ")})`;
  }, [metodosPago]);

  const topArtistas = useMemo(() => {
    const map = new Map<
      string,
      { nombre: string; ventas: number; ingreso: number }
    >();

    (resumen.obrasVendidas ?? []).forEach((obra) => {
      const nombre = obra.artistaNombre || "Crisálida";
      const current = map.get(nombre) ?? {
        nombre,
        ventas: 0,
        ingreso: 0,
      };

      current.ventas += Number(obra.cantidadVendida ?? 0);
      current.ingreso += Number(obra.totalVendido ?? 0);
      map.set(nombre, current);
    });

    return [...map.values()]
      .sort((a, b) => b.ventas - a.ventas || b.ingreso - a.ingreso)
      .slice(0, 5);
  }, [resumen.obrasVendidas]);

  const monthlySales = useMemo(() => {
    const monthNames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    const now = new Date();
    const points: Array<{
      key: string;
      label: string;
      total: number;
    }> = [];

    for (let offset = 11; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const year = date.getFullYear();
      const month = date.getMonth();

      points.push({
        key: `${year}-${String(month + 1).padStart(2, "0")}`,
        label: monthNames[month],
        total: 0,
      });
    }

    const pedidosBase =
      resumen.pedidos && resumen.pedidos.length > 0
        ? resumen.pedidos
        : pedidosPeriodo;

    pedidosBase.forEach((pedido) => {
      if (!pedido.createdAt) return;

      const date = new Date(pedido.createdAt);
      if (Number.isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;

      const point = points.find((item) => item.key === key);
      if (!point) return;

      point.total += Number(formatPrecio(pedido.total));
    });

    return points;
  }, [pedidosPeriodo, resumen.pedidos]);

  const maxMonthly = Math.max(
    1,
    ...monthlySales.map((point) => point.total),
  );

  const linePoints = useMemo(() => {
    const width = 700;
    const height = 190;
    const left = 16;
    const right = 16;
    const top = 14;
    const bottom = 24;
    const usableWidth = width - left - right;
    const usableHeight = height - top - bottom;

    return monthlySales.map((item, index) => {
      const x =
        left +
        (monthlySales.length <= 1
          ? 0
          : (index / (monthlySales.length - 1)) * usableWidth);

      const y =
        top + usableHeight - (item.total / maxMonthly) * usableHeight;

      return { ...item, x, y };
    });
  }, [maxMonthly, monthlySales]);

  const linePath = useMemo(
    () =>
      linePoints
        .map((point, index) =>
          `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
        )
        .join(" "),
    [linePoints],
  );

  const areaPath = useMemo(() => {
    if (linePoints.length === 0) return "";

    const first = linePoints[0];
    const last = linePoints[linePoints.length - 1];

    return `${linePath} L ${last.x.toFixed(2)} 176 L ${first.x.toFixed(
      2,
    )} 176 Z`;
  }, [linePath, linePoints]);

  const recentSales = useMemo(() => {
    const rows: Array<{
      key: string;
      pedidoId: number;
      titulo: string;
      artista: string;
      tecnica: string;
      cliente: string;
      monto: number;
      estado: string;
      fecha?: string;
      imagen?: string | null;
      imagenUrl?: string | null;
    }> = [];

    pedidosPeriodo.forEach((pedido) => {
      const items = Array.isArray(pedido.items) ? pedido.items : [];

      items.forEach((item, index) => {
        const cantidad = Number(item.cantidad ?? 1);
        const subtotal = Number(
          formatPrecio(
            item.subtotal ??
              Number(formatPrecio(item.precio)) * cantidad,
          ),
        );

        rows.push({
          key: `${pedido.id}-${item.obraId}-${index}`,
          pedidoId: pedido.id,
          titulo: item.titulo || `Obra #${item.obraId}`,
          artista: item.artistaNombre || "Crisálida",
          tecnica: getObraTecnica(item.obraId),
          cliente: pedido.buyerName,
          monto: subtotal,
          estado: pedido.estado || "pendiente",
          fecha: pedido.createdAt,
          imagen: item.imagen,
          imagenUrl: item.imagenUrl,
        });
      });
    });

    return rows
      .sort((a, b) => {
        const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
        const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
        return dateB - dateA || b.pedidoId - a.pedidoId;
      })
      .slice(0, 8);
  }, [getObraTecnica, pedidosPeriodo]);

  const filtroLabel = useMemo(() => {
    if (tipoFiltro === "general") return "Vista general";
    if (tipoFiltro === "dia") return fecha || "Selecciona un día";
    if (tipoFiltro === "mes") {
      return mes && anio ? `${mes}/${anio}` : "Selecciona mes y año";
    }
    if (tipoFiltro === "anio") return anio || "Selecciona un año";
    if (tipoFiltro === "rango") {
      if (desde && hasta) return `${desde} — ${hasta}`;
      return "Selecciona un rango";
    }

    return "Vista general";
  }, [anio, desde, fecha, hasta, mes, tipoFiltro]);

  const REPORT_LOGO_SRC = "data:image/jpeg;base64,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";

  const openPdfInNewTab = () => {
    setPdfError(null);

    try {
      const popup = window.open("", "_blank");

      if (!popup) {
        setPdfError(
          "El navegador bloqueó la ventana del reporte. Habilita las ventanas emergentes e inténtalo de nuevo.",
        );
        return;
      }

      const escapeHtml = (value: unknown): string =>
        String(value ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");

      const fechaDocumento = new Date().toLocaleDateString("es-BO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const totalClientes = resumen.clientes?.length ?? 0;
      const totalVisitas =
        analyticsStats.totalVisitas > 0
          ? analyticsStats.totalVisitas
          : Math.max(totalClientes, totalPedidosPeriodo, totalObrasVendidas, 1);

      const funnelData = [
        {
          label: analyticsAvailable ? "Visitas / interesados" : "Clientes registrados",
          value: analyticsAvailable ? totalVisitas : totalClientes,
        },
        {
          label: "Clientes",
          value: totalClientes,
        },
        {
          label: "Pedidos",
          value: totalPedidosPeriodo,
        },
        {
          label: "Obras vendidas",
          value: totalObrasVendidas,
        },
      ];

      const funnelBase = Math.max(
        1,
        funnelData[0]?.value ?? 1,
        ...funnelData.map((item) => item.value),
      );

      const obrasTop = [...(resumen.obrasVendidas ?? [])]
        .sort(
          (a, b) =>
            Number(b.cantidadVendida ?? 0) - Number(a.cantidadVendida ?? 0),
        )
        .slice(0, 5);

      const tecnicasTop = [...ventasPorTecnica]
        .filter((item) => item.cantidad > 0)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);

      const maxObra = Math.max(
        1,
        ...obrasTop.map((obra) => Number(obra.cantidadVendida ?? 0)),
      );

      const maxTecnicaPdf = Math.max(
        1,
        ...tecnicasTop.map((item) => Number(item.cantidad ?? 0)),
      );

      const artistaDestacado = topArtistas[0];
      const obraDestacada = obrasTop[0];

      const funnelRows = funnelData
        .map((item) => {
          const percentage = Math.min(
            100,
            Math.round((Number(item.value ?? 0) / funnelBase) * 100),
          );

          return `
            <div class="funnel-row">
              <div class="funnel-label">${escapeHtml(item.label)}</div>
              <div class="funnel-value">${escapeHtml(item.value)}</div>
              <div class="funnel-track">
                <div class="funnel-fill" style="width:${percentage}%"></div>
                <span>${percentage}%</span>
              </div>
            </div>
          `;
        })
        .join("");

      const artistRows =
        topArtistas.length > 0
          ? topArtistas
              .map((artista, index) => {
                const maxArtist = Math.max(
                  1,
                  ...topArtistas.map((item) => Number(item.ventas ?? 0)),
                );
                const width = Math.max(
                  8,
                  Math.round((Number(artista.ventas ?? 0) / maxArtist) * 100),
                );

                return `
                  <div class="mini-rank">
                    <div class="rank-index">${index + 1}</div>
                    <div class="rank-main">
                      <div class="rank-title">${escapeHtml(artista.nombre)}</div>
                      <div class="rank-bar"><span style="width:${width}%"></span></div>
                    </div>
                    <div class="rank-number">${escapeHtml(artista.ventas)}</div>
                  </div>
                `;
              })
              .join("")
          : `<div class="empty">Sin datos de artistas para este período.</div>`;

      const obraRows =
        obrasTop.length > 0
          ? obrasTop
              .map((obra) => {
                const width = Math.max(
                  8,
                  Math.round(
                    (Number(obra.cantidadVendida ?? 0) / maxObra) * 100,
                  ),
                );

                return `
                  <div class="horizontal-item">
                    <span class="horizontal-name">${escapeHtml(obra.titulo)}</span>
                    <div class="horizontal-track">
                      <span style="width:${width}%"></span>
                    </div>
                    <strong>${escapeHtml(obra.cantidadVendida)}</strong>
                  </div>
                `;
              })
              .join("")
          : `<div class="empty">Sin obras vendidas para este período.</div>`;

      const tecnicaRows =
        tecnicasTop.length > 0
          ? tecnicasTop
              .map((item, index) => {
                const width = Math.max(
                  8,
                  Math.round((Number(item.cantidad ?? 0) / maxTecnicaPdf) * 100),
                );

                return `
                  <div class="tech-item">
                    <div class="tech-head">
                      <span><i class="dot dot-${(index % 5) + 1}"></i>${escapeHtml(
                        item.tecnica,
                      )}</span>
                      <strong>${escapeHtml(item.cantidad)}</strong>
                    </div>
                    <div class="tech-track"><span style="width:${width}%"></span></div>
                  </div>
                `;
              })
              .join("")
          : `<div class="empty">Sin información de técnicas todavía.</div>`;

      const clientesTop =
        (resumen.clientes ?? [])
          .slice()
          .sort(
            (a, b) =>
              Number(b.totalComprado ?? 0) - Number(a.totalComprado ?? 0),
          )
          .slice(0, 5);

      const clientePrincipal = clientesTop[0];

      const metodoPrincipal =
        [...metodosPago].sort((a, b) => b.cantidad - a.cantidad)[0]?.metodo ??
        "Sin datos";

      const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Informe de Ventas - Crisálida</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #e7ecea;
      color: #12201b;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body { padding: 22px; }

    .report-page {
      width: 1120px;
      max-width: 100%;
      margin: 0 auto;
      background: #ffffff;
      box-shadow: 0 18px 50px rgba(0,0,0,.12);
      overflow: hidden;
    }

    .hero {
      min-height: 195px;
      padding: 30px 38px 26px;
      color: white;
      background:
        radial-gradient(circle at 78% 18%, rgba(55,224,137,.18), transparent 26%),
        radial-gradient(circle at 18% 100%, rgba(51,183,131,.14), transparent 38%),
        linear-gradient(120deg, #09141b 0%, #101b27 52%, #071117 100%);
      position: relative;
      overflow: hidden;
    }

    .hero:after {
      content: "";
      position: absolute;
      inset: 0;
      opacity: .16;
      background:
        linear-gradient(140deg, transparent 0 45%, rgba(255,255,255,.08) 45% 46%, transparent 46% 100%),
        linear-gradient(25deg, transparent 0 60%, rgba(255,255,255,.05) 60% 61%, transparent 61% 100%);
      pointer-events: none;
    }

    .hero-inner {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: 1fr 285px;
      gap: 30px;
      align-items: center;
    }

    .hero-title {
      margin: 0;
      font-size: 50px;
      line-height: .98;
      font-weight: 900;
      letter-spacing: -1.5px;
    }

    .hero-title .green { color: #66e797; }
    .hero-subtitle {
      margin-top: 15px;
      max-width: 710px;
      font-size: 16px;
      line-height: 1.45;
      color: rgba(255,255,255,.82);
    }

    .hero-line {
      height: 2px;
      margin-top: 12px;
      width: 69%;
      background: linear-gradient(90deg,#6cf09e,rgba(108,240,158,.08));
    }

    .brand-box {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 18px;
    }

    .brand-values {
      border-left: 3px solid #5fe693;
      padding-left: 14px;
      font-size: 12px;
      line-height: 1.7;
      font-weight: 800;
      letter-spacing: 3px;
      color: rgba(255,255,255,.8);
    }

    .brand-logo {
      width: 122px;
      min-width: 122px;
      height: 122px;
      border-radius: 50%;
      background: #020706;
      border: 1px solid rgba(255,255,255,.14);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 8px 28px rgba(0,0,0,.25);
    }

    .brand-logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      border-radius: 50%;
    }

    .content { padding: 18px; }

    .section {
      border: 1px solid #dce6e2;
      border-radius: 11px;
      margin-bottom: 14px;
      padding: 18px 20px 18px;
      position: relative;
      background: #fff;
    }

    .section-title {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin: -19px 0 15px -20px;
      padding: 10px 18px;
      border-radius: 10px 10px 10px 0;
      background: linear-gradient(90deg,#063b35,#006e58);
      color: white;
      font-size: 17px;
      font-weight: 900;
      box-shadow: 0 4px 8px rgba(0,69,53,.12);
    }

    .section-title:after {
      content: "»»";
      color: #77e5ae;
      letter-spacing: -2px;
      font-size: 20px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
    }

    .summary-side + .summary-side {
      border-left: 1px solid #dfe8e4;
      padding-left: 28px;
    }

    .info-row {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 7px;
      margin: 7px 0;
      font-size: 14px;
    }

    .info-row strong { color: #10231d; }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 14px;
    }

    .metric-card {
      border: 1px solid #dce6e2;
      border-radius: 11px;
      padding: 18px;
      background: linear-gradient(180deg,#ffffff,#fbfdfc);
    }

    .metric-title {
      font-size: 17px;
      font-weight: 900;
      color: #073f37;
      margin-bottom: 18px;
    }

    .funnel-row {
      display: grid;
      grid-template-columns: 165px 55px 1fr;
      align-items: center;
      gap: 12px;
      margin: 14px 0;
    }

    .funnel-label {
      font-size: 13px;
      font-weight: 800;
      color: #172923;
    }

    .funnel-value {
      font-size: 14px;
      font-weight: 900;
    }

    .funnel-track {
      height: 34px;
      position: relative;
      background: #eef8f2;
      border-radius: 3px;
      overflow: hidden;
    }

    .funnel-fill {
      height: 100%;
      background: linear-gradient(90deg,#65d995,#84e2ad);
    }

    .funnel-track span {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 13px;
      color: #0d2f24;
    }

    .sales-objective {
      display: grid;
      grid-template-columns: 1fr 145px;
      gap: 14px;
      align-items: stretch;
    }

    .big-sales {
      display: flex;
      gap: 13px;
      align-items: center;
    }

    .sales-icon {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e6f8ee;
      color: #087452;
      font-size: 28px;
      flex: 0 0 auto;
    }

    .big-number {
      font-size: 37px;
      line-height: 1;
      font-weight: 900;
      color: #0b1713;
    }

    .small-muted {
      font-size: 12px;
      color: #6b7f76;
    }

    .objective-box {
      border-radius: 10px;
      background: #e8f8ee;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #13875d;
      font-weight: 900;
      padding: 14px;
    }

    .objective-box span {
      display: block;
      margin-top: 4px;
      font-size: 11px;
      font-weight: 700;
      color: #72867d;
    }

    .sales-secondary {
      margin-top: 20px;
      border-top: 1px dashed #dfe8e4;
      padding-top: 17px;
      display: grid;
      grid-template-columns: repeat(2,1fr);
      gap: 14px;
    }

    .secondary-metric {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 5px;
    }

    .secondary-metric strong {
      font-size: 20px;
      color: #15261f;
    }

    .data-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }

    .data-box {
      border: 1px solid #edf1ef;
      border-radius: 6px;
      padding: 14px;
      min-height: 230px;
      background: #fbfcfc;
    }

    .data-box h3 {
      text-align: center;
      margin: 0 0 18px;
      font-size: 16px;
      color: #132720;
    }

    .mini-rank {
      display: grid;
      grid-template-columns: 28px 1fr 30px;
      gap: 8px;
      align-items: center;
      margin: 11px 0;
    }

    .rank-index {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #0b4e42;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 900;
    }

    .rank-title {
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .rank-bar, .horizontal-track, .tech-track {
      height: 7px;
      border-radius: 20px;
      background: #e5efe9;
      overflow: hidden;
      margin-top: 5px;
    }

    .rank-bar span, .horizontal-track span, .tech-track span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg,#3fc97b,#78df98);
      border-radius: inherit;
    }

    .rank-number {
      text-align: right;
      font-size: 11px;
      font-weight: 900;
      color: #0f6c4c;
    }

    .horizontal-item {
      display: grid;
      grid-template-columns: 105px 1fr 24px;
      gap: 8px;
      align-items: center;
      margin: 13px 0;
      font-size: 11px;
    }

    .horizontal-name {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-weight: 800;
    }

    .tech-item { margin: 12px 0; }
    .tech-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      font-weight: 800;
    }

    .dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 7px;
      vertical-align: -1px;
    }

    .dot-1 { background:#0b4d38; }
    .dot-2 { background:#17845b; }
    .dot-3 { background:#68b968; }
    .dot-4 { background:#54a4d9; }
    .dot-5 { background:#95d66c; }

    .financial-grid {
      display: grid;
      grid-template-columns: 1.08fr .92fr;
      gap: 24px;
      align-items: center;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    th {
      padding: 11px 10px;
      background: #073f3a;
      color: white;
      text-align: left;
      font-weight: 800;
    }

    th.real { color: #90ee76; }

    td {
      border: 1px solid #dce6e2;
      padding: 12px 10px;
      background: white;
    }

    tr:last-child td {
      font-weight: 900;
      background: #f2f6f4;
    }

    .finance-bars {
      display: flex;
      align-items: end;
      justify-content: center;
      gap: 30px;
      height: 185px;
      padding: 18px 10px 25px;
      border-bottom: 1px solid #dce6e2;
    }

    .finance-group {
      width: 100px;
      text-align: center;
    }

    .bar-pair {
      height: 130px;
      display: flex;
      align-items: end;
      justify-content: center;
      gap: 7px;
    }

    .bar {
      width: 31px;
      border-radius: 2px 2px 0 0;
      min-height: 4px;
    }

    .bar.projected {
      background: #b7e58c;
      opacity: .45;
      border: 1px dashed #82b95d;
    }

    .bar.real { background: #08725b; }

    .finance-group label {
      display: block;
      margin-top: 8px;
      font-size: 10px;
      font-weight: 800;
    }

    .legend {
      margin-top: 10px;
      text-align: center;
      font-size: 11px;
      color: #587067;
    }

    .legend i {
      display: inline-block;
      width: 11px;
      height: 11px;
      border-radius: 2px;
      margin: 0 5px 0 14px;
    }

    .performance-grid {
      display: grid;
      grid-template-columns: 180px repeat(3,1fr);
      gap: 18px;
      align-items: center;
    }

    .performance-intro {
      padding: 22px;
      border-radius: 8px;
      background: #f5f8f6;
      font-size: 20px;
      line-height: 1.2;
      font-weight: 900;
      color: #0a4339;
    }

    .performance-card {
      text-align: center;
      padding: 8px 10px;
    }

    .performance-icon {
      width: 58px;
      height: 58px;
      margin: 0 auto 8px;
      border-radius: 50%;
      border: 2px dashed #0b5c4b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 27px;
      background: #eff9f3;
    }

    .performance-card h4 {
      margin: 6px 0 7px;
      font-size: 14px;
      color: #0a473b;
    }

    .performance-card p {
      margin: 2px 0;
      font-size: 11px;
      color: #3b5048;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
      padding: 14px 24px;
      color: rgba(255,255,255,.82);
      background: #091821;
      font-size: 10px;
      letter-spacing: 1.6px;
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .footer-logo {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      object-fit: cover;
      flex: 0 0 auto;
      border: 1px solid rgba(255,255,255,.16);
      background: #000;
    }

    .footer strong { color:white; }
    .footer .thanks {
      letter-spacing: 0;
      font-size: 11px;
      text-align: right;
      white-space: nowrap;
    }

    .footer .line {
      display:inline-block;
      width: 58px;
      height: 3px;
      margin-right: 12px;
      background:#63e696;
      vertical-align: middle;
    }

    .footer-page {
      margin-left: 14px;
      font-weight: 800;
      letter-spacing: .6px;
      color: rgba(255,255,255,.66);
    }

    .empty {
      color: #7b8d86;
      font-size: 12px;
      padding: 20px 5px;
      text-align: center;
    }

    .print-actions {
      width: 1120px;
      max-width: 100%;
      margin: 0 auto 12px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .print-actions button {
      border: 0;
      border-radius: 9px;
      padding: 10px 16px;
      cursor: pointer;
      font-weight: 800;
      background: #08745a;
      color: white;
    }

    .print-actions button.secondary {
      background: #17231f;
    }

    @page {
      size: A4 portrait;
      margin: 7mm;
    }

    @media print {
      html, body { background: white; }
      body { padding: 0; }
      .print-actions { display: none !important; }
      .report-page {
        width: 100%;
        box-shadow: none;
      }
      .hero { min-height: 145px; padding: 20px 26px 18px; }
      .hero-title { font-size: 36px; }
      .hero-subtitle { font-size: 11px; }
      .brand-logo { width: 86px; min-width: 86px; height: 86px; }
      .brand-values { font-size: 8px; }
      .content { padding: 11px; }
      .section { padding: 13px 14px; margin-bottom: 9px; }
      .section-title { margin: -14px 0 10px -14px; padding: 7px 12px; font-size: 12px; }
      .metric-card { padding: 12px; }
      .metric-title { font-size: 12px; margin-bottom: 10px; }
      .funnel-row { margin: 7px 0; grid-template-columns: 112px 36px 1fr; gap: 7px; }
      .funnel-label, .funnel-value { font-size: 9px; }
      .funnel-track { height: 23px; }
      .funnel-track span { font-size: 9px; }
      .big-number { font-size: 27px; }
      .sales-icon { width: 38px; height: 38px; font-size: 19px; }
      .data-box { min-height: 165px; padding: 9px; }
      .data-box h3 { font-size: 11px; margin-bottom: 8px; }
      .mini-rank { margin: 6px 0; }
      .rank-index { width: 18px; height: 18px; font-size: 8px; }
      .rank-title, .rank-number { font-size: 8px; }
      .horizontal-item, .tech-head { font-size: 8px; margin: 7px 0; }
      table { font-size: 9px; }
      th, td { padding: 7px 6px; }
      .finance-bars { height: 130px; }
      .bar-pair { height: 88px; }
      .performance-intro { font-size: 14px; padding: 13px; }
      .performance-icon { width: 40px; height: 40px; font-size: 18px; }
      .performance-card h4 { font-size: 10px; }
      .performance-card p { font-size: 8px; }
      body { padding-bottom: 18mm; }
      .content { padding-bottom: 22mm; }
      .footer {
        position: fixed;
        left: 7mm;
        right: 7mm;
        bottom: 4mm;
        z-index: 9999;
        padding: 7px 10px;
        font-size: 7px;
        min-height: 11mm;
        box-shadow: 0 -1px 0 rgba(255,255,255,.04);
      }
      .footer-logo { width: 24px; height: 24px; }
      .footer .thanks { font-size: 7px; }
      .footer .line { width: 36px; height: 2px; margin-right: 8px; }
      .footer-page { font-size: 7px; margin-left: 8px; }

      .section,
      .metric-card,
      .data-box,
      .performance-card {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="secondary" onclick="window.close()">Cerrar</button>
    <button onclick="window.print()">Guardar / Imprimir PDF</button>
  </div>

  <article class="report-page">
    <header class="hero">
      <div class="hero-inner">
        <div>
          <h1 class="hero-title">
            Informe de <span class="green">Ventas</span><br/>
            <span style="font-size:.72em;font-weight:500">reporte del período</span>
          </h1>
          <div class="hero-line"></div>
          <div class="hero-subtitle">
            Resumen del desempeño de ventas de Crisálida, incluyendo ventas totales,
            obras destacadas, clientes, ingresos, técnicas y comportamiento comercial.
          </div>
        </div>

        <div class="brand-box">
          <div class="brand-values">ARTE<br/>COMUNIDAD<br/>CRECIMIENTO</div>
          <div class="brand-logo">
            <img src="${REPORT_LOGO_SRC}" alt="Logo Crisálida" />
          </div>
        </div>
      </div>
    </header>

    <main class="content">
      <section class="section">
        <div class="section-title">Resumen del Evento</div>
        <div class="summary-grid">
          <div class="summary-side">
            <div class="info-row">
              <strong>Nombre del reporte:</strong>
              <span>Reporte general de ventas Crisálida</span>
            </div>
            <div class="info-row">
              <strong>Período:</strong>
              <span>${escapeHtml(filtroLabel)}</span>
            </div>
            <div class="info-row">
              <strong>Fecha de emisión:</strong>
              <span>${escapeHtml(fechaDocumento)}</span>
            </div>
          </div>

          <div class="summary-side">
            <div class="info-row">
              <strong>Objetivo:</strong>
              <span>Analizar el desempeño comercial y la venta de obras.</span>
            </div>
            <div class="info-row">
              <strong>Organizado por:</strong>
              <span>Colectivo Crisálida</span>
            </div>
            <div class="info-row">
              <strong>Descripción:</strong>
              <span>Datos consolidados automáticamente desde el panel administrativo.</span>
            </div>
          </div>
        </div>
      </section>

      <div class="two-col">
        <section class="metric-card">
          <div class="metric-title">Embudo de Ventas »»</div>
          ${funnelRows}
        </section>

        <section class="metric-card">
          <div class="metric-title">Ventas vs. Objetivo »»</div>

          <div class="sales-objective">
            <div class="big-sales">
              <div class="sales-icon">▥</div>
              <div>
                <div class="small-muted">Ingresos Totales</div>
                <div class="big-number">${escapeHtml(formatPrecio(ingresosPeriodo))} Bs</div>
              </div>
            </div>

            <div class="objective-box">
              Objetivo<br/>no configurado
              <span>Se muestra el valor real</span>
            </div>
          </div>

          <div class="sales-secondary">
            <div class="secondary-metric">
              <div class="sales-icon">◆</div>
              <div>
                <div class="small-muted">Obras vendidas</div>
                <strong>${escapeHtml(totalObrasVendidas)}</strong>
              </div>
            </div>

            <div class="secondary-metric">
              <div class="sales-icon">◎</div>
              <div>
                <div class="small-muted">Ticket promedio</div>
                <strong>${escapeHtml(formatPrecio(ticketPromedio))} Bs</strong>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section class="section">
        <div class="section-title">Datos Clave</div>

        <div class="data-grid">
          <div class="data-box">
            <h3>Top 5 Artistas</h3>
            ${artistRows}
          </div>

          <div class="data-box">
            <h3>Top 5 Obras Vendidas</h3>
            ${obraRows}
          </div>

          <div class="data-box">
            <h3>Ventas por Técnica</h3>
            ${tecnicaRows}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-title">Resumen Financiero</div>

        <div class="financial-grid">
          <div>
            <table>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Proyectado</th>
                  <th class="real">Real</th>
                  <th>Variación</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Ingresos Totales</td>
                  <td>No configurado</td>
                  <td>${escapeHtml(formatPrecio(ingresosPeriodo))} Bs</td>
                  <td>—</td>
                </tr>
                <tr>
                  <td>Pedidos</td>
                  <td>No configurado</td>
                  <td>${escapeHtml(totalPedidosPeriodo)}</td>
                  <td>—</td>
                </tr>
                <tr>
                  <td>Ticket Promedio</td>
                  <td>No configurado</td>
                  <td>${escapeHtml(formatPrecio(ticketPromedio))} Bs</td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <div class="finance-bars">
              <div class="finance-group">
                <div class="bar-pair">
                  <div class="bar projected" style="height:92%"></div>
                  <div class="bar real" style="height:100%"></div>
                </div>
                <label>Ingresos</label>
              </div>

              <div class="finance-group">
                <div class="bar-pair">
                  <div class="bar projected" style="height:58%"></div>
                  <div class="bar real" style="height:${Math.max(
                    12,
                    Math.min(100, totalPedidosPeriodo * 8),
                  )}%"></div>
                </div>
                <label>Pedidos</label>
              </div>

              <div class="finance-group">
                <div class="bar-pair">
                  <div class="bar projected" style="height:46%"></div>
                  <div class="bar real" style="height:${Math.max(
                    12,
                    Math.min(100, totalObrasVendidas * 8),
                  )}%"></div>
                </div>
                <label>Obras</label>
              </div>
            </div>

            <div class="legend">
              <i style="background:#b7e58c"></i>Referencia visual
              <i style="background:#08725b"></i>Real
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-title">Mejores Desempeños</div>

        <div class="performance-grid">
          <div class="performance-intro">
            ★<br/>
            Destacados<br/>
            del Período
          </div>

          <div class="performance-card">
            <div class="performance-icon">🏆</div>
            <h4>Artista Destacado</h4>
            <p>${escapeHtml(artistaDestacado?.nombre ?? "Sin datos")}</p>
            <p>Ventas: ${escapeHtml(artistaDestacado?.ventas ?? 0)} obras</p>
            <p>Ingresos: ${escapeHtml(
              formatPrecio(artistaDestacado?.ingreso ?? 0),
            )} Bs</p>
          </div>

          <div class="performance-card">
            <div class="performance-icon">🏷</div>
            <h4>Obra Más Vendida</h4>
            <p>${escapeHtml(obraDestacada?.titulo ?? "Sin datos")}</p>
            <p>Ventas: ${escapeHtml(obraDestacada?.cantidadVendida ?? 0)}</p>
            <p>Técnica: ${escapeHtml(
              obraDestacada
                ? obraDestacada.tecnica || getObraTecnica(obraDestacada.obraId)
                : "Sin datos",
            )}</p>
          </div>

          <div class="performance-card">
            <div class="performance-icon">👥</div>
            <h4>Mayor Interacción</h4>
            <p>Cliente: ${escapeHtml(clientePrincipal?.buyerName ?? "Sin datos")}</p>
            <p>Método principal: ${escapeHtml(metodoPrincipal)}</p>
            <p>Visitas: ${escapeHtml(
              analyticsAvailable ? analyticsStats.totalVisitas : "No disponible",
            )}</p>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="footer-left">
        <img class="footer-logo" src="${REPORT_LOGO_SRC}" alt="Logo Crisálida" />
        <div><strong>CRISÁLIDA</strong> &nbsp; | &nbsp; ARTE QUE TRANSFORMA</div>
      </div>
      <div class="thanks"><span class="line"></span>Gracias por ser parte de este camino.<span class="footer-page">Reporte de ventas</span></div>
    </footer>
  </article>

  <script>
    window.addEventListener("load", function () {
      setTimeout(function () {
        window.focus();
      }, 250);
    });
  </script>
</body>
</html>
      `;

      popup.document.open();
      popup.document.write(html);
      popup.document.close();
    } catch (error) {
      console.error(error);
      setPdfError(
        "No se pudo generar el informe. Revisa la consola para ver el detalle.",
      );
    }
  };

  const renderFiltroCampos = () => {
    const baseClass =
      "h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-emerald-400";

    if (tipoFiltro === "dia") {
      return (
        <input
          type="date"
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
          className={baseClass}
        />
      );
    }

    if (tipoFiltro === "mes") {
      return (
        <>
          <select
            value={mes}
            onChange={(event) => setMes(event.target.value)}
            className={baseClass}
          >
            <option value="">Mes</option>
            <option value="1">Enero</option>
            <option value="2">Febrero</option>
            <option value="3">Marzo</option>
            <option value="4">Abril</option>
            <option value="5">Mayo</option>
            <option value="6">Junio</option>
            <option value="7">Julio</option>
            <option value="8">Agosto</option>
            <option value="9">Septiembre</option>
            <option value="10">Octubre</option>
            <option value="11">Noviembre</option>
            <option value="12">Diciembre</option>
          </select>

          <input
            type="number"
            value={anio}
            onChange={(event) => setAnio(event.target.value)}
            placeholder="Año"
            className={`${baseClass} w-28`}
          />
        </>
      );
    }

    if (tipoFiltro === "anio") {
      return (
        <input
          type="number"
          value={anio}
          onChange={(event) => setAnio(event.target.value)}
          placeholder="Año"
          className={`${baseClass} w-28`}
        />
      );
    }

    if (tipoFiltro === "rango") {
      return (
        <>
          <input
            type="date"
            value={desde}
            onChange={(event) => setDesde(event.target.value)}
            className={baseClass}
          />
          <input
            type="date"
            value={hasta}
            onChange={(event) => setHasta(event.target.value)}
            className={baseClass}
          />
        </>
      );
    }

    return null;
  };

  const kpis = [
    {
      label: "Ventas totales",
      value: `${formatPrecio(ingresosPeriodo)} Bs`,
      helper: `${totalPedidosPeriodo} pedidos en el período`,
      icon: "🛒",
    },
    {
      label: "Ingresos hoy",
      value: `${formatPrecio(resumen.totalIngresosHoy)} Bs`,
      helper: `${resumen.totalPedidosHoy} pedidos hoy`,
      icon: "▥",
    },
    {
      label: "Obras vendidas",
      value: String(totalObrasVendidas),
      helper: "Unidades vendidas",
      icon: "▣",
    },
    {
      label: "Pedidos completados",
      value: String(pedidosCompletados),
      helper: "Pagados o entregados",
      icon: "◇",
    },
    {
      label: "Ticket promedio",
      value: `${formatPrecio(ticketPromedio)} Bs`,
      helper: "Promedio por pedido",
      icon: "◈",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="min-w-0 overflow-hidden rounded-[28px] border border-white/10 bg-[#07110d] text-white shadow-2xl shadow-black/10">
        <div className="border-b border-white/10 px-5 py-5 sm:px-6 lg:px-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300/80">
                Panel administrativo · Crisálida
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                Reporte general de ventas
              </h1>

              <p className="mt-1 text-sm text-white/50">
                Una mirada al impacto del arte en cifras.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70">
                  📅 {filtroLabel}
                </div>

                <button
                  type="button"
                  onClick={openPdfInNewTab}
                  className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-400/20"
                >
                  ⇩ Exportar reporte
                </button>

                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  ↻ Actualizar
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/15 p-3">
            <div className="flex flex-wrap gap-2">
              {(["general", "dia", "mes", "anio", "rango"] as const).map(
                (filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setTipoFiltro(filter)}
                    className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                      tipoFiltro === filter
                        ? "bg-emerald-400 text-[#04100a]"
                        : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {filter === "general"
                      ? "General"
                      : filter === "dia"
                        ? "Día"
                        : filter === "mes"
                          ? "Mes"
                          : filter === "anio"
                            ? "Año"
                            : "Rango"}
                  </button>
                ),
              )}
            </div>

            {tipoFiltro !== "general" && (
              <div className="flex flex-wrap items-center gap-2">
                {renderFiltroCampos()}

                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="h-11 rounded-xl bg-emerald-400 px-4 text-xs font-black text-[#04100a] transition hover:bg-emerald-300"
                >
                  Aplicar filtro
                </button>
              </div>
            )}
          </div>
        </div>

        {pdfError && (
          <div className="mx-5 mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200 sm:mx-6 lg:mx-7">
            {pdfError}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center px-6 py-12">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-emerald-400" />
              <p className="mt-4 text-sm font-semibold text-white/50">
                Cargando reporte de ventas...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5 p-4 sm:p-5 lg:p-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-white/50">
                        {kpi.label}
                      </p>
                      <p className="mt-2 text-xl font-black tracking-tight text-white">
                        {kpi.value}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/10 text-lg text-emerald-300">
                      {kpi.icon}
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] font-semibold text-emerald-300/70">
                    {kpi.helper}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid min-w-0 gap-5 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_minmax(0,0.78fr)]">
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5 lg:col-span-2 2xl:col-span-1">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-white">
                      Ventas mensuales
                    </h2>
                    <p className="text-xs text-white/35">Últimos 12 meses</p>
                  </div>

                  <span className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/40">
                    Ingresos
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <svg
                    viewBox="0 0 700 215"
                    className="h-auto w-full min-w-0"
                    role="img"
                    aria-label="Gráfico de ventas mensuales"
                  >
                    <defs>
                      <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {[24, 62, 100, 138, 176].map((y) => (
                      <line
                        key={y}
                        x1="16"
                        x2="684"
                        y1={y}
                        y2={y}
                        stroke="rgba(255,255,255,.07)"
                        strokeWidth="1"
                      />
                    ))}

                    {areaPath && <path d={areaPath} fill="url(#salesArea)" />}

                    {linePath && (
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {linePoints.map((point) => (
                      <g key={point.key}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="4"
                          fill="#07110d"
                          stroke="#6ee7b7"
                          strokeWidth="2"
                        />
                        <text
                          x={point.x}
                          y="205"
                          textAnchor="middle"
                          fill="rgba(255,255,255,.42)"
                          fontSize="10"
                        >
                          {point.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
                <div className="mb-5">
                  <h2 className="text-base font-black text-white">
                    Ventas por técnica
                  </h2>
                  <p className="text-xs text-white/35">
                    Obras vendidas por área artística
                  </p>
                </div>

                <div className="space-y-3">
                  {ventasPorTecnica.slice(0, 9).map((item) => (
                    <div key={item.tecnica}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="truncate text-xs font-semibold text-white/60">
                          {item.tecnica}
                        </span>
                        <span className="text-xs font-black text-white">
                          {item.cantidad}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-300"
                          style={{
                            width: `${Math.max(
                              item.cantidad > 0 ? 7 : 0,
                              (item.cantidad / maxTecnica) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
                <h2 className="text-base font-black text-white">
                  Métodos de pago
                </h2>
                <p className="text-xs text-white/35">Distribución de pedidos</p>

                <div className="mt-5 flex justify-center">
                  <div
                    className="relative h-36 w-36 rounded-full"
                    style={{ background: donutGradient }}
                  >
                    <div className="absolute inset-[22px] flex items-center justify-center rounded-full bg-[#0a1510]">
                      <div className="text-center">
                        <p className="text-2xl font-black text-white">
                          {metodosPago.reduce(
                            (acc, item) => acc + item.cantidad,
                            0,
                          )}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                          pedidos
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {metodosPago.length === 0 ? (
                    <p className="text-xs text-white/35">Sin datos todavía.</p>
                  ) : (
                    metodosPago.map((item) => (
                      <div
                        key={item.metodo}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="truncate text-white/55">
                          {item.metodo}
                        </span>
                        <span className="font-black text-white">
                          {item.porcentaje.toFixed(0)}%
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_330px]">
              <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
                  <div>
                    <h2 className="text-base font-black text-white">
                      Últimas ventas
                    </h2>
                    <p className="text-xs text-white/35">
                      Actividad reciente del período
                    </p>
                  </div>

                  <span className="text-[11px] font-black text-emerald-300">
                    {recentSales.length} movimientos
                  </span>
                </div>

                {recentSales.length === 0 ? (
                  <div className="p-8 text-center text-sm text-white/35">
                    No hay ventas para este filtro.
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[820px]">
                      <thead>
                        <tr className="border-b border-white/10 bg-black/10 text-left">
                          {[
                            "Obra",
                            "Artista",
                            "Técnica",
                            "Cliente",
                            "Monto",
                            "Estado",
                            "Fecha",
                          ].map((head) => (
                            <th
                              key={head}
                              className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/35"
                            >
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {recentSales.map((sale) => {
                          const imageUrl = getAdminImageUrl(
                            sale.imagenUrl,
                            sale.imagen,
                          );

                          return (
                            <tr
                              key={sale.key}
                              className="border-b border-white/[0.06] last:border-b-0"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {imageUrl ? (
                                    <img
                                      src={imageUrl}
                                      alt={sale.titulo}
                                      className="h-10 w-10 rounded-lg object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[9px] text-white/25">
                                      Sin img
                                    </div>
                                  )}

                                  <span className="max-w-[180px] truncate text-xs font-bold text-white/80">
                                    {sale.titulo}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-3 text-xs text-white/55">
                                {sale.artista}
                              </td>
                              <td className="px-4 py-3 text-xs text-white/55">
                                {sale.tecnica}
                              </td>
                              <td className="px-4 py-3 text-xs text-white/55">
                                {sale.cliente}
                              </td>
                              <td className="px-4 py-3 text-xs font-black text-white">
                                {formatPrecio(sale.monto)} Bs
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black capitalize ${getEstadoBadgeClass(
                                    sale.estado,
                                  )}`}
                                >
                                  {sale.estado}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-white/40">
                                {formatFecha(sale.fecha)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-black text-white">
                      Top artistas
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300/70">
                      ventas
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {topArtistas.length === 0 ? (
                      <p className="text-xs text-white/35">Sin datos todavía.</p>
                    ) : (
                      topArtistas.map((artista, index) => (
                        <div
                          key={artista.nombre}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] font-black text-white/45">
                              {index + 1}
                            </span>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-white/75">
                                {artista.nombre}
                              </p>
                              <p className="text-[10px] text-white/30">
                                {formatPrecio(artista.ingreso)} Bs
                              </p>
                            </div>
                          </div>

                          <span className="text-xs font-black text-emerald-300">
                            {artista.ventas}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                    Técnica más vendida
                  </p>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xl font-black text-white">
                        {tecnicaMasVendida.tecnica}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {tecnicaMasVendida.cantidad} obras vendidas
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-400/10 px-3 py-2 text-lg">
                      🎨
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                    Actividad digital
                  </p>

                  {!analyticsAvailable ? (
                    <p className="mt-3 text-xs leading-relaxed text-white/35">
                      Analytics no disponible. El reporte de ventas sigue
                      funcionando normalmente.
                    </p>
                  ) : (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-lg font-black text-white">
                          {analyticsStats.totalVisitas}
                        </p>
                        <p className="text-[9px] uppercase tracking-wide text-white/30">
                          visitas
                        </p>
                      </div>

                      <div>
                        <p className="text-lg font-black text-white">
                          {analyticsStats.ipsUnicas}
                        </p>
                        <p className="text-[9px] uppercase tracking-wide text-white/30">
                          únicas
                        </p>
                      </div>

                      <div>
                        <p className="text-lg font-black text-emerald-300">
                          {analyticsStats.visitasHoy}
                        </p>
                        <p className="text-[9px] uppercase tracking-wide text-white/30">
                          hoy
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-white">
                      Clientes del período
                    </h2>
                    <p className="text-xs text-white/35">
                      Principales compradores
                    </p>
                  </div>

                  <span className="text-[11px] font-black text-emerald-300">
                    {resumen.clientes?.length ?? 0}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {!resumen.clientes || resumen.clientes.length === 0 ? (
                    <p className="text-xs text-white/35">
                      No hay clientes para este filtro.
                    </p>
                  ) : (
                    resumen.clientes.slice(0, 6).map((cliente, index) => (
                      <div
                        key={`${cliente.buyerEmail}-${index}`}
                        className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-black/10 px-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-white/75">
                            {cliente.buyerName}
                          </p>
                          <p className="truncate text-[10px] text-white/30">
                            {cliente.buyerEmail}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs font-black text-white">
                            {formatPrecio(cliente.totalComprado)} Bs
                          </p>
                          <p className="text-[10px] text-white/30">
                            {cliente.cantidadPedidos} pedidos
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <div>
                  <h2 className="text-base font-black text-white">
                    Obras con mayor movimiento
                  </h2>
                  <p className="text-xs text-white/35">
                    Rendimiento de las obras vendidas
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(resumen.obrasVendidas ?? []).slice(0, 6).map((obra) => {
                    const imageUrl = getAdminImageUrl(
                      obra.imagenUrl,
                      obra.imagen,
                    );

                    return (
                      <div
                        key={`${obra.obraId}-${obra.titulo}`}
                        className="flex gap-3 rounded-xl border border-white/[0.07] bg-black/10 p-3"
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={obra.titulo}
                            className="h-14 w-14 rounded-lg object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[9px] text-white/25">
                            Sin img
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-white/75">
                            {obra.titulo}
                          </p>
                          <p className="truncate text-[10px] text-emerald-300/70">
                            {obra.artistaNombre}
                          </p>
                          <div className="mt-2 flex items-end justify-between gap-2">
                            <span className="text-[10px] text-white/30">
                              {obra.cantidadVendida} vendidas
                            </span>
                            <span className="text-[10px] font-black text-white">
                              {formatPrecio(obra.totalVendido)} Bs
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EventosManager() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [lugar, setLugar] = useState("");
  const [activo, setActivo] = useState(true);
  const [flyer, setFlyer] = useState<File | null>(null);

  const [artistasInvitados, setArtistasInvitados] = useState<
    ArtistaInvitadoEvento[]
  >([]);
  const [editingArtistaIndex, setEditingArtistaIndex] = useState<number | null>(
    null,
  );
  const [selectedArtistaIndex, setSelectedArtistaIndex] = useState<number | null>(
    null,
  );

  const [artistaNombre, setArtistaNombre] = useState("");
  const [artistaEspecialidad, setArtistaEspecialidad] = useState("");
  const [artistaDescripcion, setArtistaDescripcion] = useState("");
  const [artistaImagenUrl, setArtistaImagenUrl] = useState("");
  const [artistaImagenPreview, setArtistaImagenPreview] = useState("");

  const [editingObraIndex, setEditingObraIndex] = useState<number | null>(null);
  const [obraTitulo, setObraTitulo] = useState("");
  const [obraTecnica, setObraTecnica] = useState("");
  const [obraAnio, setObraAnio] = useState("");
  const [obraDescripcion, setObraDescripcion] = useState("");
  const [obraPrecio, setObraPrecio] = useState("");
  const [obraImagenUrl, setObraImagenUrl] = useState("");
  const [obraImagenPreview, setObraImagenPreview] = useState("");

  const getInvitadoImageUrl = (image?: string | null): string | null => {
    const cleanImage = image && String(image).trim() !== "" ? image : null;
    if (!cleanImage) return null;
    if (cleanImage.startsWith("data:image")) return cleanImage;
    if (cleanImage.startsWith("http://") || cleanImage.startsWith("https://")) {
      return cleanImage;
    }
    return buildImageUrl(cleanImage);
  };

  const uploadEventoImageToCloudinary = async (
    file: File,
  ): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Selecciona una imagen válida.");
    }

    const data = new FormData();
    data.append("file", file, file.name);

    const res = await fetch(`${API}/eventos/upload-image`, {
      method: "POST",
      body: data,
    });

    if (!res.ok) {
      throw new Error(await parseResponseError(res));
    }

    const result = (await res.json()) as {
      url?: string;
      filename?: string;
    };

    const imageUrl = result.url || result.filename;

    if (!imageUrl) {
      throw new Error("No se pudo obtener la URL de la imagen.");
    }

    return imageUrl;
  };

  const loadEventos = useCallback(async (): Promise<Evento[]> => {
    const res = await fetch(`${API}/eventos`);

    if (!res.ok) {
      throw new Error(await parseResponseError(res));
    }

    const data = (await res.json()) as Evento[];
    return Array.isArray(data) ? data : [];
  }, []);

  const refreshEventos = useCallback(async () => {
    setLoading(true);

    try {
      setEventos(await loadEventos());
    } catch (error) {
      console.error("Error al cargar eventos", error);
      setEventos([]);
      setMessage("No se pudieron cargar los eventos. Verifica el backend.");
    } finally {
      setLoading(false);
    }
  }, [loadEventos]);

  useEffect(() => {
    void refreshEventos();
  }, [refreshEventos]);

  const resetArtistForm = () => {
    setEditingArtistaIndex(null);
    setArtistaNombre("");
    setArtistaEspecialidad("");
    setArtistaDescripcion("");
    setArtistaImagenUrl("");
    setArtistaImagenPreview("");
  };

  const resetObraForm = () => {
    setEditingObraIndex(null);
    setObraTitulo("");
    setObraTecnica("");
    setObraAnio("");
    setObraDescripcion("");
    setObraPrecio("");
    setObraImagenUrl("");
    setObraImagenPreview("");
  };

  const resetForm = () => {
    setEditingEvento(null);
    setTitulo("");
    setDescripcion("");
    setFecha("");
    setLugar("");
    setActivo(true);
    setFlyer(null);
    setArtistasInvitados([]);
    setSelectedArtistaIndex(null);
    resetArtistForm();
    resetObraForm();
  };

  const startEdit = (evento: Evento) => {
    setEditingEvento(evento);
    setTitulo(evento.titulo ?? "");
    setDescripcion(evento.descripcion ?? "");
    setFecha(evento.fecha ?? "");
    setLugar(evento.lugar ?? "");
    setActivo(evento.activo ?? true);
    setFlyer(null);
    setArtistasInvitados(
      Array.isArray(evento.artistasInvitados) ? evento.artistasInvitados : [],
    );
    setSelectedArtistaIndex(null);
    resetArtistForm();
    resetObraForm();
    setMessage(null);
  };

  const handleArtistaImageFile = async (file?: File | null) => {
    if (!file) return;

    try {
      setMessage("Subiendo imagen del artista...");

      const imageUrl = await uploadEventoImageToCloudinary(file);

      setArtistaImagenUrl(imageUrl);
      setArtistaImagenPreview(imageUrl);

      setMessage("Imagen del artista subida correctamente ✅");
    } catch (error) {
      console.error(error);
      setMessage(getErrorMessage(error));
    }
  };

  const handleObraImageFile = async (file?: File | null) => {
    if (!file) return;

    try {
      setMessage("Subiendo imagen de la obra...");

      const imageUrl = await uploadEventoImageToCloudinary(file);

      setObraImagenUrl(imageUrl);
      setObraImagenPreview(imageUrl);

      setMessage("Imagen de la obra subida correctamente ✅");
    } catch (error) {
      console.error(error);
      setMessage(getErrorMessage(error));
    }
  };

  const saveArtistaInvitado = () => {
    if (!artistaNombre.trim()) {
      setMessage("Debes escribir el nombre del artista invitado.");
      return;
    }

    const nuevoArtista: ArtistaInvitadoEvento = {
      nombre: artistaNombre.trim(),
      especialidad: artistaEspecialidad.trim(),
      descripcion: artistaDescripcion.trim(),
      imagenUrl: artistaImagenUrl.trim(),
      obras:
        editingArtistaIndex !== null
          ? artistasInvitados[editingArtistaIndex]?.obras ?? []
          : [],
    };

    if (editingArtistaIndex !== null) {
      setArtistasInvitados((prev) =>
        prev.map((artista, index) =>
          index === editingArtistaIndex ? nuevoArtista : artista,
        ),
      );
      setMessage("Artista invitado actualizado ✅");
    } else {
      setArtistasInvitados((prev) => [...prev, nuevoArtista]);
      setMessage("Artista invitado agregado ✅");
    }

    resetArtistForm();
  };

  const editArtistaInvitado = (index: number) => {
    const artista = artistasInvitados[index];
    if (!artista) return;

    setEditingArtistaIndex(index);
    setArtistaNombre(artista.nombre ?? "");
    setArtistaEspecialidad(artista.especialidad ?? "");
    setArtistaDescripcion(artista.descripcion ?? "");
    setArtistaImagenUrl(artista.imagenUrl ?? "");
    setArtistaImagenPreview(artista.imagenUrl ?? "");
    setMessage(null);
  };

  const removeArtistaInvitado = (index: number) => {
    setArtistasInvitados((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );

    if (selectedArtistaIndex === index) {
      setSelectedArtistaIndex(null);
    }

    resetArtistForm();
    resetObraForm();
  };

  const saveObraInvitado = () => {
    if (selectedArtistaIndex === null) {
      setMessage("Primero selecciona un artista invitado.");
      return;
    }

    if (!obraTitulo.trim()) {
      setMessage("Debes escribir el título de la obra.");
      return;
    }

    const nuevaObra: ObraArtistaInvitado = {
      titulo: obraTitulo.trim(),
      tecnica: obraTecnica.trim(),
      anio: obraAnio.trim(),
      descripcion: obraDescripcion.trim(),
      imagenUrl: obraImagenUrl.trim(),
      precio: obraPrecio.trim(),
    };

    setArtistasInvitados((prev) =>
      prev.map((artista, index) => {
        if (index !== selectedArtistaIndex) return artista;

        const obrasActuales = Array.isArray(artista.obras) ? artista.obras : [];

        const nuevasObras =
          editingObraIndex !== null
            ? obrasActuales.map((obra, obraIndex) =>
                obraIndex === editingObraIndex ? nuevaObra : obra,
              )
            : [...obrasActuales, nuevaObra];

        return {
          ...artista,
          obras: nuevasObras,
        };
      }),
    );

    resetObraForm();
    setMessage("Obra del artista invitado guardada ✅");
  };

  const editObraInvitado = (obraIndex: number) => {
    if (selectedArtistaIndex === null) return;

    const artista = artistasInvitados[selectedArtistaIndex];
    const obra = artista?.obras?.[obraIndex];
    if (!obra) return;

    setEditingObraIndex(obraIndex);
    setObraTitulo(obra.titulo ?? "");
    setObraTecnica(obra.tecnica ?? "");
    setObraAnio(obra.anio ?? "");
    setObraDescripcion(obra.descripcion ?? "");
    setObraPrecio(obra.precio ?? "");
    setObraImagenUrl(obra.imagenUrl ?? "");
    setObraImagenPreview(obra.imagenUrl ?? "");
  };

  const removeObraInvitado = (obraIndex: number) => {
    if (selectedArtistaIndex === null) return;

    setArtistasInvitados((prev) =>
      prev.map((artista, index) => {
        if (index !== selectedArtistaIndex) return artista;

        return {
          ...artista,
          obras: Array.isArray(artista.obras)
            ? artista.obras.filter((_, indexObra) => indexObra !== obraIndex)
            : [],
        };
      }),
    );

    resetObraForm();
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      if (!titulo.trim()) {
        throw new Error("Falta el título del evento.");
      }

      if (!editingEvento && !(flyer instanceof File)) {
        throw new Error("Debes subir un flyer para crear el evento.");
      }

      const data = new FormData();
      data.append("titulo", titulo.trim());
      data.append("descripcion", descripcion.trim());
      data.append("fecha", fecha.trim());
      data.append("lugar", lugar.trim());
      data.append("activo", String(activo));
      data.append("artistasInvitados", JSON.stringify(artistasInvitados));

      if (flyer instanceof File) {
        data.append("flyer", flyer, flyer.name);
      }

      const url = editingEvento
        ? `${API}/eventos/${editingEvento.id}`
        : `${API}/eventos`;

      const res = await fetch(url, {
        method: editingEvento ? "PATCH" : "POST",
        body: data,
      });

      if (!res.ok) {
        throw new Error(await parseResponseError(res));
      }

      await refreshEventos();
      resetForm();
      setMessage(
        editingEvento
          ? "Evento actualizado correctamente ✅"
          : "Evento creado correctamente ✅",
      );
    } catch (error) {
      console.error("Error al guardar evento", error);
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setMessage(null);

    const confirmar = window.confirm("¿Seguro que quieres eliminar este evento?");
    if (!confirmar) return;

    try {
      const res = await fetch(`${API}/eventos/${id}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error(await parseResponseError(res));
      }

      await refreshEventos();
      setMessage("Evento eliminado correctamente ✅");
    } catch (error) {
      console.error("Error al eliminar evento", error);
      setMessage(getErrorMessage(error));
    }
  };

  const selectedArtista =
    selectedArtistaIndex !== null ? artistasInvitados[selectedArtistaIndex] : null;

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-bold text-verdeEsmeralda mb-2">
          Eventos y exposiciones 🗓
        </h1>
        <p className="text-sm text-gray-300">
          Desde aquí puedes agregar flyers, detalles, artistas invitados y obras
          por artista.
        </p>
      </div>

      <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-4 sm:p-5 space-y-4 w-full overflow-hidden">
        <h2 className="text-lg font-bold text-gray-100">
          {editingEvento ? "Editar evento" : "Agregar evento"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
          <input
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Título del evento"
            className="w-full min-w-0 px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white"
          />

          <input
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
            placeholder="Fecha. Ej: 13 de mayo de 2026"
            className="w-full min-w-0 px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white"
          />

          <input
            value={lugar}
            onChange={(event) => setLugar(event.target.value)}
            placeholder="Lugar. Ej: Museo Costumbrista Juan de Vargas"
            className="w-full min-w-0 px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white"
          />

          <select
            value={activo ? "true" : "false"}
            onChange={(event) => setActivo(event.target.value === "true")}
            className="w-full min-w-0 px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white"
          >
            <option value="true">Activo / visible en la web</option>
            <option value="false">Inactivo / oculto</option>
          </select>
        </div>

        <textarea
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          placeholder="Descripción breve del evento"
          rows={3}
          className="w-full min-w-0 px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white"
        />

        <div className="bg-[#0b1220] border border-gray-800 rounded-xl p-4 space-y-4 w-full min-w-0 overflow-hidden">
          <h3 className="text-sm font-bold text-verdeEsmeralda">
            Artistas invitados
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full min-w-0">
            <input
              value={artistaNombre}
              onChange={(event) => setArtistaNombre(event.target.value)}
              placeholder="Nombre del artista"
              className="w-full min-w-0 px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
            />

            <input
              value={artistaEspecialidad}
              onChange={(event) => setArtistaEspecialidad(event.target.value)}
              placeholder="Especialidad. Ej: Pintura, grabado, fotografía"
              className="w-full min-w-0 px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
            />

            <div className="md:col-span-2 space-y-2">
              <input
                value={artistaImagenUrl}
                onChange={(event) => {
                  setArtistaImagenUrl(event.target.value);
                  setArtistaImagenPreview(event.target.value);
                }}
                placeholder="URL de imagen del artista opcional"
                className="w-full min-w-0 px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
              />

              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  void handleArtistaImageFile(event.target.files?.[0] ?? null)
                }
                className="block w-full min-w-0 text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-verdeEsmeralda file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black"
              />

              {artistaImagenPreview && (
                <img
                  src={getInvitadoImageUrl(artistaImagenPreview) ?? ""}
                  alt="Vista previa del artista"
                  className="w-24 h-24 rounded-full object-cover border border-gray-700"
                />
              )}
            </div>
          </div>

          <textarea
            value={artistaDescripcion}
            onChange={(event) => setArtistaDescripcion(event.target.value)}
            placeholder="Descripción breve del artista invitado"
            rows={2}
            className="w-full min-w-0 px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveArtistaInvitado}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm font-semibold hover:bg-white/15"
            >
              {editingArtistaIndex !== null
                ? "Actualizar artista invitado"
                : "+ Agregar artista invitado"}
            </button>

            {editingArtistaIndex !== null && (
              <button
                type="button"
                onClick={resetArtistForm}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-500"
              >
                Cancelar edición
              </button>
            )}
          </div>

          {artistasInvitados.length > 0 && (
            <div className="space-y-2">
              {artistasInvitados.map((artista, index) => {
                const imageUrl = getInvitadoImageUrl(artista.imagenUrl);

                return (
                  <div
                    key={`${artista.nombre}-${index}`}
                    className="rounded-lg border border-gray-800 bg-[#0e1624] p-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedArtistaIndex(index);
                          resetObraForm();
                        }}
                        className="flex gap-3 text-left flex-1 min-w-0"
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={artista.nombre}
                            className="w-20 h-20 sm:w-12 sm:h-12 rounded-full object-cover shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full border border-gray-700 flex items-center justify-center text-[10px] text-gray-500">
                            Sin foto
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-bold text-gray-100 break-words">
                            {artista.nombre}
                          </p>
                          <p className="text-xs text-verdeEsmeralda">
                            {artista.especialidad || "Sin especialidad"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Obras: {artista.obras?.length ?? 0}
                          </p>
                        </div>
                      </button>

                      <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end shrink-0">
                        <button
                          type="button"
                          onClick={() => editArtistaInvitado(index)}
                          className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 flex-1 sm:flex-none"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => removeArtistaInvitado(index)}
                          className="text-xs px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 flex-1 sm:flex-none"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedArtista && (
          <div className="bg-[#0b1220] border border-gray-800 rounded-xl p-4 space-y-4 w-full min-w-0 overflow-hidden">
            <h3 className="text-sm font-bold text-verdeEsmeralda">
              Obras de {selectedArtista.nombre}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full min-w-0">
              <input
                value={obraTitulo}
                onChange={(event) => setObraTitulo(event.target.value)}
                placeholder="Título de la obra"
                className="w-full min-w-0 px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
              />

              <input
                value={obraTecnica}
                onChange={(event) => setObraTecnica(event.target.value)}
                placeholder="Técnica. Ej: óleo, acrílico, xilografía"
                className="w-full min-w-0 px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
              />

              <input
                value={obraAnio}
                onChange={(event) => setObraAnio(event.target.value)}
                placeholder="Año. Ej: 2026"
                className="w-full min-w-0 px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
              />

              <input
                value={obraPrecio}
                onChange={(event) => setObraPrecio(event.target.value)}
                placeholder="Precio opcional"
                className="w-full min-w-0 px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
              />

              <div className="md:col-span-2 space-y-2">
                <input
                  value={obraImagenUrl}
                  onChange={(event) => {
                    setObraImagenUrl(event.target.value);
                    setObraImagenPreview(event.target.value);
                  }}
                  placeholder="URL de imagen de la obra opcional"
                  className="w-full min-w-0 px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    void handleObraImageFile(event.target.files?.[0] ?? null)
                  }
                  className="block w-full min-w-0 text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-verdeEsmeralda file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black"
                />

                {obraImagenPreview && (
                  <img
                    src={getInvitadoImageUrl(obraImagenPreview) ?? ""}
                    alt="Vista previa de la obra"
                    className="w-32 h-24 rounded-lg object-cover border border-gray-700"
                  />
                )}
              </div>
            </div>

            <textarea
              value={obraDescripcion}
              onChange={(event) => setObraDescripcion(event.target.value)}
              placeholder="Descripción breve de la obra"
              rows={2}
              className="w-full min-w-0 px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
            />

            <button
              type="button"
              onClick={saveObraInvitado}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm font-semibold hover:bg-white/15"
            >
              {editingObraIndex !== null ? "Actualizar obra" : "+ Agregar obra"}
            </button>

            {selectedArtista.obras && selectedArtista.obras.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full min-w-0">
                {selectedArtista.obras.map((obra, obraIndex) => {
                  const obraImg = getInvitadoImageUrl(obra.imagenUrl);

                  return (
                    <div
                      key={`${obra.titulo}-${obraIndex}`}
                      className="bg-[#0e1624] border border-gray-800 rounded-xl p-3 flex flex-col sm:flex-row gap-3 w-full overflow-hidden"
                    >
                      {obraImg && (
                        <img
                          src={obraImg}
                          alt={obra.titulo}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-100 break-words">
                          {obra.titulo}
                        </p>
                        <p className="text-xs text-verdeEsmeralda">
                          {obra.tecnica || "Sin técnica"}
                          {obra.anio ? ` · ${obra.anio}` : ""}
                        </p>
                        <p className="text-xs text-gray-400 line-clamp-2 break-words">
                          {obra.descripcion || "Sin descripción"}
                        </p>

                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => editObraInvitado(obraIndex)}
                            className="text-xs px-2 py-1 rounded bg-blue-600 text-white"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => removeObraInvitado(obraIndex)}
                            className="text-xs px-2 py-1 rounded bg-red-600 text-white"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-200">
            Flyer del evento
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFlyer(event.target.files?.[0] ?? null)}
            className="block w-full min-w-0 text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-verdeEsmeralda file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black"
          />

          {editingEvento && (
            <p className="text-xs text-gray-500">
              Si no seleccionas un nuevo flyer, se conserva el actual.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-verdeEsmeralda text-black font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {saving
              ? "Guardando..."
              : editingEvento
                ? "Actualizar evento"
                : "Guardar evento"}
          </button>

          {editingEvento && (
            <button
              onClick={resetForm}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white font-semibold hover:bg-white/15 disabled:opacity-60"
            >
              Cancelar
            </button>
          )}
        </div>

        {message && (
          <div className="rounded-lg border border-gray-800 bg-[#0b1220] p-3 text-sm text-gray-200">
            {message}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-verdeEsmeralda mb-4">
          Lista de eventos
        </h2>

        {loading ? (
          <p className="text-sm text-gray-400">Cargando eventos...</p>
        ) : eventos.length === 0 ? (
          <p className="text-sm text-gray-400">
            Aún no hay eventos registrados.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {eventos.map((evento) => {
              const flyerUrl = getAdminImageUrl(evento.flyerUrl, evento.flyer);
              const invitados = Array.isArray(evento.artistasInvitados)
                ? evento.artistasInvitados
                : [];

              return (
                <div
                  key={evento.id}
                  className="bg-[#0e1624] border border-gray-800 rounded-xl overflow-hidden"
                >
                  {flyerUrl ? (
                    <img
                      src={flyerUrl}
                      alt={evento.titulo}
                      className="w-full h-56 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-56 flex items-center justify-center text-sm text-gray-500">
                      Sin flyer
                    </div>
                  )}

                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-gray-100">{evento.titulo}</h3>

                    <p className="text-xs text-verdeEsmeralda">
                      {evento.fecha || "Sin fecha"}
                    </p>

                    <p className="text-xs text-gray-400">
                      {evento.lugar || "Sin lugar"}
                    </p>

                    <p className="text-sm text-gray-400 line-clamp-3">
                      {evento.descripcion || "Sin descripción"}
                    </p>

                    <p className="text-xs text-gray-300">
                      Artistas invitados: {invitados.length}
                    </p>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => startEdit(evento)}
                        className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 flex-1 sm:flex-none"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => void handleDelete(evento.id)}
                        className="text-xs px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 flex-1 sm:flex-none"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPremiumStyles() {
  return (
    <style>
      {`
        .admin-premium {
          --admin-bg: #f4f5f5;
          --admin-panel: #ffffff;
          --admin-soft: #f8faf9;
          --admin-soft-2: #ecfdf5;
          --admin-border: rgba(15, 23, 42, 0.12);
          --admin-text: #07110a;
          --admin-muted: #64748b;
          --admin-accent: #059669;
          --admin-accent-soft: rgba(16, 185, 129, 0.14);
        }

        .dark .admin-premium {
          --admin-bg: #050816;
          --admin-panel: #0e1624;
          --admin-soft: #0b1220;
          --admin-soft-2: rgba(16, 185, 129, 0.12);
          --admin-border: rgba(255, 255, 255, 0.10);
          --admin-text: rgba(255, 255, 255, 0.92);
          --admin-muted: rgba(255, 255, 255, 0.58);
          --admin-accent: #34d399;
          --admin-accent-soft: rgba(52, 211, 153, 0.13);
        }

        .admin-premium {
          background: var(--admin-bg);
          color: var(--admin-text);
        }

        .admin-premium [class*="bg-[#0e1624]"],
        .admin-premium [class*="bg-[#0b1220]"],
        .admin-premium [class*="bg-[#0d1117]"] {
          background: var(--admin-panel) !important;
          border-color: var(--admin-border) !important;
          color: var(--admin-text) !important;
          box-shadow: 0 14px 38px rgba(15, 23, 42, 0.06);
        }

        .dark .admin-premium [class*="bg-[#0e1624]"],
        .dark .admin-premium [class*="bg-[#0b1220]"],
        .dark .admin-premium [class*="bg-[#0d1117]"] {
          box-shadow: none;
        }

        .admin-premium [class*="border-gray-800"],
        .admin-premium [class*="border-white/10"] {
          border-color: var(--admin-border) !important;
        }

        .admin-premium [class*="text-gray-100"],
        .admin-premium [class*="text-gray-200"] {
          color: var(--admin-text) !important;
        }

        .admin-premium [class*="text-gray-300"],
        .admin-premium [class*="text-gray-400"],
        .admin-premium [class*="text-gray-500"] {
          color: var(--admin-muted) !important;
        }

        .admin-premium [class*="text-verdeEsmeralda"] {
          color: var(--admin-accent) !important;
        }

        .admin-premium input,
        .admin-premium textarea,
        .admin-premium select {
          background: var(--admin-soft) !important;
          color: var(--admin-text) !important;
          border-color: var(--admin-border) !important;
          outline: none;
        }

        .admin-premium input:focus,
        .admin-premium textarea:focus,
        .admin-premium select:focus {
          border-color: var(--admin-accent) !important;
          box-shadow: 0 0 0 3px var(--admin-accent-soft);
        }

        .admin-premium input::placeholder,
        .admin-premium textarea::placeholder {
          color: var(--admin-muted) !important;
        }

        .admin-premium .admin-card {
          background: var(--admin-panel);
          border: 1px solid var(--admin-border);
          color: var(--admin-text);
          box-shadow: 0 14px 38px rgba(15, 23, 42, 0.06);
        }

        .dark .admin-premium .admin-card {
          box-shadow: none;
        }

        .admin-premium .admin-nav-active {
          background: var(--admin-accent);
          color: white;
        }

        .dark .admin-premium .admin-nav-active {
          color: #06110a;
        }
      `}
    </style>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();

  const [screen, setScreen] = useState<
    "dashboard" | "artists" | "obras" | "pedidos" | "reportes" | "eventos"
  >("dashboard");

  const [artists, setArtists] = useState<Artist[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [editingWorkFromDashboard, setEditingWorkFromDashboard] =
    useState<Work | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("crisalida_token");

    if (!token) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const loadAll = useCallback(async (): Promise<{
    artists: Artist[];
    works: Work[];
  }> => {
    const [artistsRes, worksRes] = await Promise.all([
      fetch(`${API}/artistas`),
      fetch(`${API}/obras`),
    ]);

    const artistsData = (await artistsRes.json()) as Artist[];
    const worksData = (await worksRes.json()) as Work[];

    return {
      artists: Array.isArray(artistsData) ? artistsData : [],
      works: Array.isArray(worksData) ? worksData : [],
    };
  }, []);

  const refreshDashboard = useCallback(async () => {
    try {
      const result = await loadAll();
      setArtists(result.artists);
      setWorks(result.works);
    } catch (error) {
      console.error(error);
      setArtists([]);
      setWorks([]);
    }
  }, [loadAll]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshDashboard();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [refreshDashboard]);

  const stats = useMemo(() => {
    const artistsCount = artists.length;
    const worksCount = works.length;
    const totalStock = works.reduce(
      (acc, work) => acc + Number(work.stock ?? 0),
      0,
    );
    const outOfStockCount = works.filter(
      (work) => Number(work.stock ?? 0) <= 0,
    ).length;
    const latestWorks = [...works].sort((a, b) => b.id - a.id).slice(0, 6);

    return {
      artistsCount,
      worksCount,
      totalStock,
      outOfStockCount,
      latestWorks,
    };
  }, [artists, works]);

  const onEditWorkFromDashboard = (work: Work) => {
    setEditingWorkFromDashboard(work);
    setScreen("obras");
  };

  const navItems: Array<{
    key: typeof screen;
    label: string;
    icon: string;
  }> = [
    { key: "dashboard", label: "Inicio", icon: "📌" },
    { key: "artists", label: "Artistas", icon: "🎨" },
    { key: "obras", label: "Obras", icon: "🖼" },
    { key: "eventos", label: "Eventos", icon: "🗓" },
    { key: "pedidos", label: "Pedidos", icon: "📦" },
    { key: "reportes", label: "Reportes", icon: "📊" },
  ];

  return (
    <div className="admin-premium min-h-screen w-full overflow-x-hidden flex flex-col lg:flex-row">
      <AdminPremiumStyles />

      <aside className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-neutral-200 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-neutral-950/90">
        <div className="flex h-full flex-col justify-between p-4 sm:p-6">
          <div>
            <div className="relative overflow-hidden rounded-[30px] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-400/20 dark:bg-emerald-400/10">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/25 blur-2xl" />

              <div className="relative flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm dark:bg-neutral-950">
                  <img
                    src="/uploads/crisalida.png"
                    alt="Crisálida"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-black text-neutral-950 dark:text-white">
                    Crisálida
                  </h2>

                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                    Admin panel
                  </p>
                </div>
              </div>
            </div>

            <nav className="mt-5 grid grid-cols-2 gap-2 lg:block lg:space-y-2">
              {navItems.map((item) => {
                const active = screen === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setScreen(item.key)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
                      active
                        ? "admin-nav-active shadow-sm"
                        : "bg-neutral-50 text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-white/5 dark:text-white/70 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => void refreshDashboard()}
              className="mt-5 w-full rounded-full border border-neutral-200 bg-white px-4 py-3 text-xs font-black text-neutral-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-white/55 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"
            >
              ↻ Actualizar dashboard
            </button>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("crisalida_token");
                navigate("/admin/login");
              }}
              className="w-full rounded-full border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-600 transition hover:bg-red-100 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-400/20"
            >
              Cerrar sesión
            </button>

            <p className="mt-4 text-center text-[11px] text-neutral-400 dark:text-white/35">
              © 2025 Colectiva Crisálida
            </p>
          </div>
        </div>
      </aside>

      <main className="w-full flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-10">
        <div className="mb-6 relative overflow-hidden rounded-[34px] border border-emerald-200 bg-emerald-50 p-6 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-400/10 sm:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/25 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-white/70 blur-3xl dark:bg-white/5" />

          <div className="relative flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
                Gestión Crisálida
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
                Panel administrativo
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-white/65">
                Administra artistas, obras, eventos, pedidos y reportes desde un
                espacio visual más limpio y organizado.
              </p>
            </div>

            <div className="w-fit rounded-full bg-white/70 px-5 py-2 text-sm font-black text-emerald-700 dark:bg-white/5 dark:text-emerald-300">
              {screen === "dashboard"
                ? "Inicio"
                : screen === "artists"
                  ? "Artistas"
                  : screen === "obras"
                    ? "Obras"
                    : screen === "eventos"
                      ? "Eventos"
                      : screen === "pedidos"
                        ? "Pedidos"
                        : "Reportes"}
            </div>
          </div>
        </div>

        <div className="admin-card rounded-[34px] p-4 sm:p-6 lg:p-7">
          {screen === "dashboard" && (
            <DashboardHome
              artistsCount={stats.artistsCount}
              worksCount={stats.worksCount}
              totalStock={stats.totalStock}
              outOfStockCount={stats.outOfStockCount}
              latestWorks={stats.latestWorks}
              onGoArtists={() => setScreen("artists")}
              onGoWorks={() => setScreen("obras")}
              onGoOrders={() => setScreen("pedidos")}
              onEditWork={onEditWorkFromDashboard}
            />
          )}

          {screen === "artists" && <ArtistsManager />}

          {screen === "obras" && (
            <ObrasManager
              editingWork={editingWorkFromDashboard}
              onClearEditingWork={() => setEditingWorkFromDashboard(null)}
            />
          )}

          {screen === "eventos" && <EventosManager />}

          {screen === "pedidos" && <OrdersManager />}

          {screen === "reportes" && <ReportsPanel />}
        </div>
      </main>
    </div>
  );
}
