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

  const getPdfUrl = useCallback(() => {
    const query = buildQueryString();
    return query
      ? `${API}/reportes/obras/pdf?${query}`
      : `${API}/reportes/obras/pdf`;
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

  const openPdfInNewTab = () => {
    setPdfError(null);

    try {
      window.open(getPdfUrl(), "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      setPdfError(
        "No se pudo abrir el PDF. Verifica que el endpoint esté activo.",
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
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#07110d] text-white shadow-2xl shadow-black/10">
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

            <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr_0.78fr]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
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
                    className="min-w-[650px] w-full"
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

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
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

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
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

            <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
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
                  <div className="overflow-x-auto">
                    <table className="min-w-[920px] w-full">
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
