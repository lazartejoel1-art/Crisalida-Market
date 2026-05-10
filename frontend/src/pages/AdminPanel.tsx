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
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  correo?: string | null;
  web?: string | null;
};

type Work = {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number | string;
  imagen?: string | null;
  imagenUrl?: string | null;
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
data.append("instagram", formData.instagram ?? "");
data.append("facebook", formData.facebook ?? "");
data.append("tiktok", formData.tiktok ?? "");
data.append("correo", formData.correo ?? "");
data.append("web", formData.web ?? "");
data.append("fotoUrl", formData.fotoUrl ?? "");

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
      instagram: editingArtist.instagram ?? undefined,
      facebook: editingArtist.facebook ?? undefined,
      tiktok: editingArtist.tiktok ?? undefined,
      correo: editingArtist.correo ?? undefined,
      web: editingArtist.web ?? undefined,
      fotoUrl: editingArtist.fotoUrl ?? editingArtist.foto ?? undefined,
    }
  : undefined;

  return (
    <div>
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

      <div className="space-y-3 mt-2">
        {artists.map((artist) => {
          const imageUrl = normalizeArtistImage(artist);

          return (
            <div
              key={artist.id}
              className="bg-[#0e1624] border border-gray-800 p-4 rounded-lg flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={artist.nombre}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}

                <div>
                  <p className="font-semibold text-gray-200">{artist.nombre}</p>
                  <p className="text-sm text-gray-400">{artist.descripcion}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingArtist(artist)}
                  className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                >
                  Editar
                </button>

                <button
                  onClick={() => void handleDelete(artist.id)}
                  className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-500"
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

              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-gray-100">
                  {formatPrecio(work.precio)} Bs
                </span>
                <span className="text-gray-400">Stock: {work.stock}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setLocalEditingWork(work)}
                  className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                >
                  Editar
                </button>

                <button
                  onClick={() => void handleDelete(work.id)}
                  className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-500"
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

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();

    if (tipoFiltro === "dia" && fecha) params.set("fecha", fecha);
    if (tipoFiltro === "mes" && mes && anio) {
      params.set("mes", mes);
      params.set("anio", anio);
    }
    if (tipoFiltro === "anio" && anio) params.set("anio", anio);
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
  }> => {
    const [resumenRes, obrasRes] = await Promise.all([
      fetch(getReportUrl()),
      fetch(`${API}/obras`),
    ]);

    const resumenData = (await resumenRes.json()) as ResumenReporte;
    const obrasData = (await obrasRes.json()) as Work[];
    const obras = Array.isArray(obrasData) ? obrasData : [];

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
      obrasVendidas: enrichObrasVendidasWithImages(
        resumenData.obrasVendidas,
        obras,
      ),
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
        };
      }

      const analyticsData = (await analyticsRes.json()) as AnalyticsSummary;

      return {
        resumen: resumenConImagenes,
        analytics: analyticsData,
        analyticsAvailable: true,
      };
    } catch {
      return {
        resumen: resumenConImagenes,
        analytics: null,
        analyticsAvailable: false,
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
    } catch (error) {
      console.error(error);
      setResumen(EMPTY_REPORT);
      setAnalytics(null);
      setAnalyticsAvailable(false);
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
        last7Days: [] as Array<{ date: string; visits: number }>,
      };
    }

    return {
      totalVisitas: analytics.totalVisits ?? analytics.totalVisitas ?? 0,
      ipsUnicas: analytics.uniqueIps ?? analytics.ipsUnicas ?? 0,
      visitasHoy: analytics.visitsToday ?? analytics.visitasHoy ?? 0,
      last7Days: analytics.last7Days ?? analytics.ultimos7Dias ?? [],
    };
  }, [analytics]);

  const openPdfInNewTab = () => {
    setPdfError(null);

    try {
      window.open(getPdfUrl(), "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      setPdfError("No se pudo abrir el PDF. Verifica que el endpoint esté activo.");
    }
  };

  const renderFiltroCampos = () => {
    if (tipoFiltro === "dia") {
      return (
        <input
          type="date"
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
          className="px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white"
        />
      );
    }

    if (tipoFiltro === "mes") {
      return (
        <>
          <select
            value={mes}
            onChange={(event) => setMes(event.target.value)}
            className="px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white"
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
            className="px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white w-28"
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
          className="px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white w-28"
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
            className="px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white"
          />
          <input
            type="date"
            value={hasta}
            onChange={(event) => setHasta(event.target.value)}
            className="px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white"
          />
        </>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-verdeEsmeralda">
              Reportes 📊
            </h1>
            <p className="text-sm text-gray-300">
              Reportes filtrados por día, mes, año o rango de fechas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={openPdfInNewTab}
              className="text-xs px-3 py-2 rounded-lg bg-verdeEsmeralda text-black font-semibold hover:opacity-90 transition"
              title="Abre el reporte en PDF en otra pestaña"
            >
              📄 Exportar PDF
            </button>

            <button
              onClick={() => void refresh()}
              className="text-xs px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/15 transition"
            >
              ↻ Actualizar
            </button>
          </div>
        </div>

        <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-gray-100">Filtro del reporte</h2>

          <div className="flex flex-wrap gap-2">
            {(["general", "dia", "mes", "anio", "rango"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTipoFiltro(filter)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                  tipoFiltro === filter
                    ? "bg-verdeEsmeralda text-black"
                    : "bg-white/10 text-white border border-white/10"
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
            ))}
          </div>

          <div className="flex flex-wrap gap-2">{renderFiltroCampos()}</div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void refresh()}
              className="px-4 py-2 rounded-lg bg-verdeEsmeralda text-black text-sm font-semibold hover:opacity-90"
            >
              Aplicar filtro
            </button>
          </div>
        </div>
      </div>

      {pdfError && (
        <div className="text-sm text-red-400 bg-[#0e1624] border border-red-900/40 rounded-xl p-3">
          {pdfError}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400">Cargando reportes...</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400">Pedidos del período</p>
              <p className="text-2xl font-extrabold text-gray-100">
                {resumen.totalPedidosFiltrados ?? 0}
              </p>
            </div>

            <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400">Ingresos del período</p>
              <p className="text-2xl font-extrabold text-gray-100">
                {formatPrecio(resumen.totalIngresosFiltrados ?? 0)} Bs
              </p>
            </div>

            <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400">Pedidos hoy</p>
              <p className="text-2xl font-extrabold text-gray-100">
                {resumen.totalPedidosHoy}
              </p>
            </div>

            <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400">Ingresos hoy</p>
              <p className="text-2xl font-extrabold text-gray-100">
                {formatPrecio(resumen.totalIngresosHoy)} Bs
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-5">
              <h2 className="text-lg font-bold text-gray-100 mb-3">
                Pedidos por método de pago
              </h2>

              <div className="space-y-2">
                {Object.keys(resumen.porMetodo ?? {}).length === 0 ? (
                  <p className="text-sm text-gray-400">Aún no hay pedidos.</p>
                ) : (
                  Object.entries(resumen.porMetodo ?? {}).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-300">{key}</span>
                      <span className="font-bold text-gray-100">{value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-5">
              <h2 className="text-lg font-bold text-gray-100 mb-3">
                Visitas a la web
              </h2>

              {!analyticsAvailable ? (
                <div className="text-sm text-gray-400">
                  Analytics no disponible aún. Falta el endpoint:
                  <span className="text-gray-200"> /analytics/summary</span>
                </div>
              ) : (
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="bg-[#0b1220] border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-400">Total visitas</p>
                    <p className="text-2xl font-extrabold text-gray-100">
                      {analyticsStats.totalVisitas}
                    </p>
                  </div>

                  <div className="bg-[#0b1220] border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-400">IPs únicas</p>
                    <p className="text-2xl font-extrabold text-gray-100">
                      {analyticsStats.ipsUnicas}
                    </p>
                  </div>

                  <div className="bg-[#0b1220] border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-400">Visitas hoy</p>
                    <p className="text-2xl font-extrabold text-gray-100">
                      {analyticsStats.visitasHoy}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-gray-100 mb-3">
              Clientes del período
            </h2>

            {!resumen.clientes || resumen.clientes.length === 0 ? (
              <p className="text-sm text-gray-400">
                No hay clientes para este filtro.
              </p>
            ) : (
              <div className="space-y-3">
                {resumen.clientes.slice(0, 10).map((cliente, index) => (
                  <div
                    key={`${cliente.buyerEmail}-${index}`}
                    className="bg-[#0b1220] border border-gray-800 rounded-xl p-4"
                  >
                    <p className="text-sm font-bold text-gray-100">
                      {cliente.buyerName}
                    </p>
                    <p className="text-xs text-gray-400">{cliente.buyerEmail}</p>
                    <p className="text-xs text-gray-500">
                      Teléfono: {cliente.buyerPhone || "No registrado"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Pedidos: {cliente.cantidadPedidos}
                    </p>
                    <p className="text-sm font-semibold text-verdeEsmeralda mt-1">
                      {formatPrecio(cliente.totalComprado)} Bs
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-gray-100 mb-3">
              Obras vendidas
            </h2>

            {!resumen.obrasVendidas || resumen.obrasVendidas.length === 0 ? (
              <p className="text-sm text-gray-400">
                No hay obras vendidas para este filtro.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {resumen.obrasVendidas.slice(0, 12).map((obra) => {
                  const imageUrl = getAdminImageUrl(obra.imagenUrl, obra.imagen);

                  return (
                    <div
                      key={`${obra.obraId}-${obra.titulo}`}
                      className="bg-[#0b1220] border border-gray-800 rounded-xl p-4 flex gap-3"
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={obra.titulo}
                          className="w-20 h-20 rounded-lg object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-[#111827] border border-gray-700 flex items-center justify-center text-[10px] text-gray-500">
                          Sin imagen
                        </div>
                      )}

                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-100">
                          {obra.titulo}
                        </p>
                        <p className="text-xs text-verdeEsmeralda">
                          {obra.artistaNombre}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Cantidad vendida: {obra.cantidadVendida}
                        </p>
                        <p className="text-sm font-semibold text-gray-100 mt-1">
                          {formatPrecio(obra.totalVendido)} Bs
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-5">
              <h2 className="text-lg font-bold text-gray-100 mb-3">
                Artistas con mayor venta
              </h2>

              {!resumen.artistasMasVendidos ||
              resumen.artistasMasVendidos.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos.</p>
              ) : (
                <div className="space-y-2">
                  {resumen.artistasMasVendidos.map((obra, index) => (
                    <div
                      key={`${obra.obraId}-${index}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-300">
                        {obra.artistaNombre} · {obra.titulo}
                      </span>
                      <span className="font-bold text-gray-100">
                        {obra.cantidadVendida}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-5">
              <h2 className="text-lg font-bold text-gray-100 mb-3">
                Artistas con menor venta
              </h2>

              {!resumen.artistasMenosVendidos ||
              resumen.artistasMenosVendidos.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos.</p>
              ) : (
                <div className="space-y-2">
                  {resumen.artistasMenosVendidos.map((obra, index) => (
                    <div
                      key={`${obra.obraId}-${index}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-300">
                        {obra.artistaNombre} · {obra.titulo}
                      </span>
                      <span className="font-bold text-gray-100">
                        {obra.cantidadVendida}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-gray-100 mb-3">
              Pedidos del período
            </h2>

            {!resumen.pedidosFiltrados || resumen.pedidosFiltrados.length === 0 ? (
              <p className="text-sm text-gray-400">
                No hay pedidos para este filtro.
              </p>
            ) : (
              <div className="space-y-3">
                {resumen.pedidosFiltrados.slice(0, 12).map((pedido) => (
                  <div
                    key={pedido.id}
                    className="bg-[#0b1220] border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-100">
                        Pedido #{pedido.id} — {pedido.buyerName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {pedido.buyerEmail} · {pedido.buyerPhone || "Sin teléfono"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Pago: {pedido.metodoPago} · Estado:{" "}
                        {pedido.estado || "pendiente"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Fecha: {formatFecha(pedido.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="text-lg font-extrabold text-gray-100">
                        {formatPrecio(pedido.total)} Bs
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
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

  const imageFileToBase64 = (
    file: File,
    onSuccess: (value: string) => void,
  ) => {
    if (!file.type.startsWith("image/")) {
      setMessage("Selecciona una imagen válida.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      onSuccess(result);
      setMessage(null);
    };

    reader.onerror = () => {
      setMessage("No se pudo leer la imagen seleccionada.");
    };

    reader.readAsDataURL(file);
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

  const handleArtistaImageFile = (file?: File | null) => {
    if (!file) return;
    imageFileToBase64(file, (result) => {
      setArtistaImagenUrl(result);
      setArtistaImagenPreview(result);
    });
  };

  const handleObraImageFile = (file?: File | null) => {
    if (!file) return;
    imageFileToBase64(file, (result) => {
      setObraImagenUrl(result);
      setObraImagenPreview(result);
    });
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-verdeEsmeralda mb-2">
          Eventos y exposiciones 🗓
        </h1>
        <p className="text-sm text-gray-300">
          Desde aquí puedes agregar flyers, detalles, artistas invitados y obras
          por artista.
        </p>
      </div>

      <div className="bg-[#0e1624] border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-bold text-gray-100">
          {editingEvento ? "Editar evento" : "Agregar evento"}
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Título del evento"
            className="px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white"
          />

          <input
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
            placeholder="Fecha. Ej: 13 de mayo de 2026"
            className="px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white"
          />

          <input
            value={lugar}
            onChange={(event) => setLugar(event.target.value)}
            placeholder="Lugar. Ej: Museo Costumbrista Juan de Vargas"
            className="px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white"
          />

          <select
            value={activo ? "true" : "false"}
            onChange={(event) => setActivo(event.target.value === "true")}
            className="px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white"
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
          className="w-full px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white"
        />

        <div className="bg-[#0b1220] border border-gray-800 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-bold text-verdeEsmeralda">
            Artistas invitados
          </h3>

          <div className="grid md:grid-cols-2 gap-3">
            <input
              value={artistaNombre}
              onChange={(event) => setArtistaNombre(event.target.value)}
              placeholder="Nombre del artista"
              className="px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
            />

            <input
              value={artistaEspecialidad}
              onChange={(event) => setArtistaEspecialidad(event.target.value)}
              placeholder="Especialidad. Ej: Pintura, grabado, fotografía"
              className="px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
            />

            <div className="md:col-span-2 space-y-2">
              <input
                value={artistaImagenUrl}
                onChange={(event) => {
                  setArtistaImagenUrl(event.target.value);
                  setArtistaImagenPreview(event.target.value);
                }}
                placeholder="URL de imagen del artista opcional"
                className="w-full px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
              />

              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  handleArtistaImageFile(event.target.files?.[0] ?? null)
                }
                className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-verdeEsmeralda file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
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
            className="w-full px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
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
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedArtistaIndex(index);
                          resetObraForm();
                        }}
                        className="flex gap-3 text-left flex-1"
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={artista.nombre}
                            className="w-12 h-12 rounded-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full border border-gray-700 flex items-center justify-center text-[10px] text-gray-500">
                            Sin foto
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-bold text-gray-100">
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

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editArtistaInvitado(index)}
                          className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => removeArtistaInvitado(index)}
                          className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-500"
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
          <div className="bg-[#0b1220] border border-gray-800 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-verdeEsmeralda">
              Obras de {selectedArtista.nombre}
            </h3>

            <div className="grid md:grid-cols-2 gap-3">
              <input
                value={obraTitulo}
                onChange={(event) => setObraTitulo(event.target.value)}
                placeholder="Título de la obra"
                className="px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
              />

              <input
                value={obraTecnica}
                onChange={(event) => setObraTecnica(event.target.value)}
                placeholder="Técnica. Ej: óleo, acrílico, xilografía"
                className="px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
              />

              <input
                value={obraAnio}
                onChange={(event) => setObraAnio(event.target.value)}
                placeholder="Año. Ej: 2026"
                className="px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
              />

              <input
                value={obraPrecio}
                onChange={(event) => setObraPrecio(event.target.value)}
                placeholder="Precio opcional"
                className="px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
              />

              <div className="md:col-span-2 space-y-2">
                <input
                  value={obraImagenUrl}
                  onChange={(event) => {
                    setObraImagenUrl(event.target.value);
                    setObraImagenPreview(event.target.value);
                  }}
                  placeholder="URL de imagen de la obra opcional"
                  className="w-full px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleObraImageFile(event.target.files?.[0] ?? null)
                  }
                  className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-verdeEsmeralda file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
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
              className="w-full px-3 py-2 rounded-lg bg-[#0e1624] border border-gray-800 text-sm text-white"
            />

            <button
              type="button"
              onClick={saveObraInvitado}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm font-semibold hover:bg-white/15"
            >
              {editingObraIndex !== null ? "Actualizar obra" : "+ Agregar obra"}
            </button>

            {selectedArtista.obras && selectedArtista.obras.length > 0 && (
              <div className="grid md:grid-cols-2 gap-3">
                {selectedArtista.obras.map((obra, obraIndex) => {
                  const obraImg = getInvitadoImageUrl(obra.imagenUrl);

                  return (
                    <div
                      key={`${obra.titulo}-${obraIndex}`}
                      className="bg-[#0e1624] border border-gray-800 rounded-xl p-3 flex gap-3"
                    >
                      {obraImg && (
                        <img
                          src={obraImg}
                          alt={obra.titulo}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      )}

                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-100">
                          {obra.titulo}
                        </p>
                        <p className="text-xs text-verdeEsmeralda">
                          {obra.tecnica || "Sin técnica"}
                          {obra.anio ? ` · ${obra.anio}` : ""}
                        </p>
                        <p className="text-xs text-gray-400 line-clamp-2">
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
            className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-verdeEsmeralda file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => void handleDelete(evento.id)}
                        className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-500"
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

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-negroSuave text-blancoPuro flex">
      <aside className="w-44 sm:w-56 shrink-0 bg-[#0d1117] border-r border-gray-800 p-4 sm:p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold text-verdeEsmeralda mb-6">
            Crisálida
          </h2>

          <nav className="space-y-3 text-sm">
            <button
              onClick={() => setScreen("dashboard")}
              className="block w-full text-left text-gray-300 hover:text-verdeEsmeralda"
            >
              📌 Inicio
            </button>

            <button
              onClick={() => setScreen("artists")}
              className="block w-full text-left text-gray-300 hover:text-verdeEsmeralda"
            >
              🎨 Artistas
            </button>

            <button
              onClick={() => setScreen("obras")}
              className="block w-full text-left text-gray-300 hover:text-verdeEsmeralda"
            >
              🖼 Obras
            </button>

            <button
              onClick={() => setScreen("eventos")}
              className="block w-full text-left text-gray-300 hover:text-verdeEsmeralda"
            >
              🗓 Eventos
            </button>

            <button
              onClick={() => setScreen("pedidos")}
              className="block w-full text-left text-gray-300 hover:text-verdeEsmeralda"
            >
              📦 Pedidos
            </button>

            <button
              onClick={() => setScreen("reportes")}
              className="block w-full text-left text-gray-300 hover:text-verdeEsmeralda"
            >
              📊 Reportes
            </button>
          </nav>

          <button
            onClick={() => void refreshDashboard()}
            className="mt-6 text-xs text-gray-400 hover:text-gray-200"
          >
            ↻ Actualizar dashboard
          </button>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("crisalida_token");
            navigate("/admin/login");
          }}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Cerrar sesión
        </button>
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 overflow-x-hidden">
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
      </main>
    </div>
  );
}

