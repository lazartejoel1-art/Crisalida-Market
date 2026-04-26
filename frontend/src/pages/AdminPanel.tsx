import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArtistForm, { NewArtist } from "../components/ArtistForm";
import WorkForm, { NewWork } from "../components/WorkForm";
import { buildImageUrl } from "../services/api";
/**
 * =========================================================
 * ✅ ADMIN PANEL - CRISÁLIDA
 * Este archivo controla TODO el panel admin:
 * - Dashboard (resumen)
 * - Gestión de Artistas (CRUD)
 * - Gestión de Obras (CRUD)
 * - Gestión de Pedidos
 * - Reportes (Pedidos + Analytics + PDF si existe endpoint)
 * =========================================================
 */

type Artist = {
  id: number;
  nombre: string;
  descripcion: string;
  fotoUrl: string;
};

type Work = {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number | string;
  imagen?: string | null;
  imagenUrl?: string | null;
  stock: number;
  artista: {
    id: number;
    nombre: string;
  };
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

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const formatPrecio = (precio: number | string | null | undefined): string => {
  if (precio === null || precio === undefined || precio === "") return "0.00";

  if (typeof precio === "number") {
    return Number.isFinite(precio) ? precio.toFixed(2) : "0.00";
  }

  let s = String(precio).trim();
  s = s.replace(/[^\d.,-]/g, "");

  if (s.includes(",") && s.includes(".")) {
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    const decimalIsComma = lastComma > lastDot;

    if (decimalIsComma) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }

  const num = Number(s);
  if (Number.isNaN(num) || !Number.isFinite(num)) return "0.00";
  return num.toFixed(2);
};

function formatFecha(iso?: string) {
  if (!iso) return "Sin fecha";

  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) return "Sin fecha";

  return d.toLocaleString("es-BO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAdminImageUrl(
  image?: string | null,
  fallbackImage?: string | null
): string | null {
  const cleanImage = image && String(image).trim() !== "" ? image : null;
  const cleanFallback =
    fallbackImage && String(fallbackImage).trim() !== "" ? fallbackImage : null;

  return buildImageUrl(cleanImage || cleanFallback);
}
function enrichPedidoItemsWithImages(
  pedidos: Pedido[],
  obras: Work[]
): Pedido[] {
  return pedidos.map((pedido) => ({
    ...pedido,
    items: Array.isArray(pedido.items)
      ? pedido.items.map((item) => {
          const obra = obras.find((w) => Number(w.id) === Number(item.obraId));

          return {
            ...item,
            imagenUrl: item.imagenUrl || item.imagen || obra?.imagenUrl || obra?.imagen || null,
            imagen: item.imagen || item.imagenUrl || obra?.imagen || obra?.imagenUrl || null,
            titulo: item.titulo || obra?.titulo || `Obra #${item.obraId}`,
            artistaNombre: item.artistaNombre || obra?.artista?.nombre || "",
          };
        })
      : [],
  }));
}

function enrichObrasVendidasWithImages(
  obrasVendidas: ObraVendida[] | undefined,
  obras: Work[]
): ObraVendida[] {
  if (!Array.isArray(obrasVendidas)) return [];

  return obrasVendidas.map((obraVendida) => {
    const obra = obras.find((w) => Number(w.id) === Number(obraVendida.obraId));

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
function getEstadoBadgeClass(estado?: string) {
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
  onEditWork: (w: Work) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-verdeEsmeralda mb-2">
          Bienvenido a Crisálida Admin
        </h1>
        <p>
          <span className="text-gray-300 text-sm">
            Desde aquí puedes administrar artistas, obras, pedidos y ver reportes.
          </span>
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
            {latestWorks.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => onEditWork(w)}
                className="text-left rounded-xl overflow-hidden border border-gray-800 bg-[#0b1220] hover:border-verdeEsmeralda/40 transition"
              >
                {getAdminImageUrl(w.imagenUrl, w.imagen) ? (
  <img
    src={getAdminImageUrl(w.imagenUrl, w.imagen) ?? ""}
    alt={w.titulo}
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
                    {w.titulo}
                  </p>
                  <p className="text-xs text-verdeEsmeralda line-clamp-1">
                    {w.artista?.nombre ?? "Crisálida"}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-300">
                      {formatPrecio(w.precio)} Bs
                    </span>
                    <span className="text-gray-400">Stock: {w.stock}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArtistsManager() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);

  const loadArtists = async (): Promise<Artist[]> => {
    const res = await fetch(`${API}/artistas`);
    const data = (await res.json()) as Artist[];
    return Array.isArray(data) ? data : [];
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await loadArtists();
        if (alive) setArtists(data);
      } catch (err) {
        console.error("Error al cargar artistas", err);
        if (alive) setArtists([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const handleSave = async (formData: NewArtist) => {
    const data = new FormData();

    data.append("nombre", formData.nombre);
    data.append("descripcion", formData.descripcion);

    if (formData.foto) {
      data.append("foto", formData.foto);
    }

    if (editingArtist) {
      await fetch(`${API}/artistas/${editingArtist.id}`, {
        method: "PATCH",
        body: data,
      });
      setEditingArtist(null);
    } else {
      await fetch(`${API}/artistas`, {
        method: "POST",
        body: data,
      });
    }

    const updated = await loadArtists();
    setArtists(updated);
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API}/artistas/${id}`, { method: "DELETE" });
    const data = await loadArtists();
    setArtists(data);
  };

  const initialValues: NewArtist | undefined = editingArtist
    ? {
        nombre: editingArtist.nombre,
        descripcion: editingArtist.descripcion,
        fotoUrl: editingArtist.fotoUrl,
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

      <h2 className="text-xl font-bold text-verdeEsmeralda mb-4">
        🎨 Lista de artistas
      </h2>

      {artists.length === 0 && (
        <p className="text-sm text-gray-400">
          Aún no hay artistas registrados. Agrega uno con el formulario de arriba.
        </p>
      )}

      <div className="space-y-3 mt-2">
        {artists.map((a) => (
          <div
            key={a.id}
            className="bg-[#0e1624] border border-gray-800 p-4 rounded-lg flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              {a.fotoUrl && (
                <img
                  src={a.fotoUrl}
                  alt={a.nombre}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-semibold text-gray-200">{a.nombre}</p>
                <p className="text-sm text-gray-400">{a.descripcion}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingArtist(a)}
                className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
              >
                Editar
              </button>

              <button
                onClick={() => void handleDelete(a.id)}
                className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-500"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
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

  const effectiveEditingWork = editingWork ?? localEditingWork;

  const fetchArtists = async (): Promise<Artist[]> => {
    const res = await fetch(`${API}/artistas`);
    const data = (await res.json()) as Artist[];
    return Array.isArray(data) ? data : [];
  };

  const fetchWorks = async (): Promise<Work[]> => {
    const res = await fetch(`${API}/obras`);
    const data = (await res.json()) as Work[];
    return Array.isArray(data) ? data : [];
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [a, w] = await Promise.all([fetchArtists(), fetchWorks()]);
        if (!alive) return;
        setArtists(a);
        setWorks(w);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setArtists([]);
        setWorks([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const handleSave = async (formData: NewWork) => {
    const data = new FormData();

    data.append("titulo", formData.titulo);
    data.append("descripcion", formData.descripcion);
    data.append("precio", String(formData.precio));
    data.append("stock", String(formData.stock));
    data.append("artistaId", String(formData.artistaId));

    if (formData.imagen) {
      data.append("imagen", formData.imagen);
    }

    if (effectiveEditingWork) {
      await fetch(`${API}/obras/${effectiveEditingWork.id}`, {
        method: "PATCH",
        body: data,
      });

      setLocalEditingWork(null);
      onClearEditingWork();
    } else {
      await fetch(`${API}/obras`, {
        method: "POST",
        body: data,
      });
    }

    const updated = await fetchWorks();
    setWorks(updated);
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API}/obras/${id}`, { method: "DELETE" });
    const data = await fetchWorks();
    setWorks(data);
  };

  const initialValues: NewWork | undefined = effectiveEditingWork
    ? {
        titulo: effectiveEditingWork.titulo,
        descripcion: effectiveEditingWork.descripcion,
        precio:
          typeof effectiveEditingWork.precio === "number"
            ? effectiveEditingWork.precio
            : Number(effectiveEditingWork.precio),
        imagenUrl: effectiveEditingWork.imagenUrl ?? undefined,
        stock: effectiveEditingWork.stock,
        artistaId: effectiveEditingWork.artista?.id ?? 0,
      }
    : undefined;

  const artistOptions = artists.map((a) => ({ id: a.id, nombre: a.nombre }));

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

      <h2 className="text-xl font-bold text-verdeEsmeralda mb-4">
        🖼 Lista de obras
      </h2>

      {works.length === 0 && (
        <p className="text-sm text-gray-400">
          Aún no hay obras registradas. Agrega una con el formulario de arriba.
        </p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
        {works.map((w) => (
          <div
            key={w.id}
            className="bg-[#0e1624] border border-gray-800 p-4 rounded-lg flex flex-col gap-3"
          >
            {getAdminImageUrl(w.imagenUrl, w.imagen) && (
  <img
    src={getAdminImageUrl(w.imagenUrl, w.imagen) ?? ""}
    alt={w.titulo}
    className="w-full h-40 rounded-lg object-cover"
    loading="lazy"
  />
)}

            <div className="flex-1">
              <p className="font-semibold text-gray-200">{w.titulo}</p>
              <p className="text-xs text-verdeEsmeralda mb-1">
                {w.artista?.nombre}
              </p>
              <p className="text-sm text-gray-400 line-clamp-3">
                {w.descripcion}
              </p>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-gray-100">
                {formatPrecio(w.precio)} Bs
              </span>
              <span className="text-gray-400">Stock: {w.stock}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setLocalEditingWork(w)}
                className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
              >
                Editar
              </button>

              <button
                onClick={() => void handleDelete(w.id)}
                className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-500"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersManager() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const loadOrders = async (): Promise<Pedido[]> => {
  const [pedidosRes, obrasRes] = await Promise.all([
    fetch(`${API}/pedidos`),
    fetch(`${API}/obras`),
  ]);

  const pedidosData = (await pedidosRes.json()) as Pedido[];
  const obrasData = (await obrasRes.json()) as Work[];

  const pedidos = Array.isArray(pedidosData) ? pedidosData : [];
  const obras = Array.isArray(obrasData) ? obrasData : [];

  return enrichPedidoItemsWithImages(pedidos, obras);
};

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await loadOrders();
        if (!alive) return;
        const normalized = data.map((p) => ({
          ...p,
          estado: p.estado ?? "pendiente",
          items: Array.isArray(p.items) ? p.items : [],
          yaPago: p.yaPago ?? false,
          comprobante: p.comprobante ?? "",
          buyerPhone: p.buyerPhone ?? "",
        }));
        setOrders(normalized.sort((a, b) => Number(b.id) - Number(a.id)));
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setOrders([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const updateOrderStateLocal = (id: number, estado: PedidoEstado) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, estado } : o)));
  };

  const handleSetEstado = async (id: number, estado: PedidoEstado) => {
    const previous = orders.find((o) => o.id === id)?.estado ?? "pendiente";

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
    } catch (e) {
      console.error(e);
      updateOrderStateLocal(id, previous);
      setInfoMsg(
        `Cambio visual aplicado fallido en backend para pedido #${id}. Si no existe PATCH /pedidos/:id/estado, el cambio no quedará guardado.`,
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

                  {order.buyerPhone ? (
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold text-gray-100">
                        Teléfono:
                      </span>{" "}
                      {order.buyerPhone}
                    </p>
                  ) : null}

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

                  {order.comprobante ? (
                    <p className="text-xs text-gray-500 whitespace-pre-line">
                      Comprobante: {order.comprobante}
                    </p>
                  ) : null}

                  {order.buyerNote ? (
                    <p className="text-xs text-gray-500 whitespace-pre-line">
                      Nota: {order.buyerNote}
                    </p>
                  ) : null}
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
                    {order.items.map((item, idx) => (
                      <div
                        key={`${order.id}-${item.obraId}-${idx}`}
                        className="bg-[#0b1220] border border-gray-800 rounded-xl p-3 flex gap-3"
                      >
                        {getAdminImageUrl(item.imagenUrl, item.imagen) ? (
  <img
    src={getAdminImageUrl(item.imagenUrl, item.imagen) ?? ""}
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

                          {item.artistaNombre ? (
                            <p className="text-xs text-verdeEsmeralda">
                              {item.artistaNombre}
                            </p>
                          ) : null}

                          <div className="mt-1 text-xs text-gray-400 space-y-1">
                            <p>Obra ID: {item.obraId}</p>
                            <p>Cantidad: {item.cantidad}</p>
                            <p>Precio: {formatPrecio(item.precio)} Bs</p>
                            <p>Subtotal: {formatPrecio(item.subtotal)} Bs</p>
                          </div>
                        </div>
                      </div>
                    ))}
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
                  <button
                    onClick={() => void handleSetEstado(order.id, "pendiente")}
                    disabled={savingId === order.id}
                    className="text-xs px-3 py-2 rounded-lg bg-yellow-600 text-black font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    Pendiente
                  </button>

                  <button
                    onClick={() => void handleSetEstado(order.id, "pagado")}
                    disabled={savingId === order.id}
                    className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    Pagado
                  </button>

                  <button
                    onClick={() => void handleSetEstado(order.id, "entregado")}
                    disabled={savingId === order.id}
                    className="text-xs px-3 py-2 rounded-lg bg-green-600 text-white font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    Entregado
                  </button>

                  <button
                    onClick={() => void handleSetEstado(order.id, "cancelado")}
                    disabled={savingId === order.id}
                    className="text-xs px-3 py-2 rounded-lg bg-red-600 text-white font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    Cancelado
                  </button>
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

  const [resumen, setResumen] = useState<ResumenReporte>({
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
  });

  const buildQueryString = () => {
    const params = new URLSearchParams();

    if (tipoFiltro === "dia" && fecha) {
      params.set("fecha", fecha);
    }

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
  };

  const getReportUrl = () => {
    const query = buildQueryString();
    return query ? `${API}/reportes?${query}` : `${API}/reportes`;
  };

  const getPdfUrl = () => {
    const query = buildQueryString();
    return query
      ? `${API}/reportes/obras/pdf?${query}`
      : `${API}/reportes/obras/pdf`;
  };

  const openPdfInNewTab = () => {
    setPdfError(null);
    try {
      window.open(getPdfUrl(), "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      setPdfError("No se pudo abrir el PDF. Verifica que el endpoint esté activo.");
    }
  };

  const loadReports = async (): Promise<{
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
      obras
    ),
    pedidosFiltrados: enrichPedidoItemsWithImages(
      resumenData.pedidosFiltrados ?? [],
      obras
    ),
    obrasVendidas: enrichObrasVendidasWithImages(
      resumenData.obrasVendidas,
      obras
    ),
    artistasMasVendidos: enrichObrasVendidasWithImages(
      resumenData.artistasMasVendidos,
      obras
    ),
    artistasMenosVendidos: enrichObrasVendidasWithImages(
      resumenData.artistasMenosVendidos,
      obras
    ),
  };

    try {
      const aRes = await fetch(`${API}/analytics/summary`);
      if (!aRes.ok) {
        return {
          resumen: resumenConImagenes,
          analytics: null,
          analyticsAvailable: false,
        };
      }

      const aData = (await aRes.json()) as AnalyticsSummary;

      return {
        resumen: resumenConImagenes,
        analytics: aData,
        analyticsAvailable: true,
      };
    } catch {
      return {
        resumen: resumenConImagenes,
        analytics: null,
        analyticsAvailable: false,
      };
    }
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const r = await loadReports();
        if (!alive) return;
        setResumen(r.resumen);
        setAnalytics(r.analytics);
        setAnalyticsAvailable(r.analyticsAvailable);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setResumen({
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
        });
        setAnalytics(null);
        setAnalyticsAvailable(false);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []); 

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

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await loadReports();
      setResumen(r.resumen);
      setAnalytics(r.analytics);
      setAnalyticsAvailable(r.analyticsAvailable);
    } catch (e) {
      console.error(e);
      setResumen({
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
      });
      setAnalytics(null);
      setAnalyticsAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const renderFiltroCampos = () => {
    if (tipoFiltro === "dia") {
      return (
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white"
        />
      );
    }

    if (tipoFiltro === "mes") {
      return (
        <>
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
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
            onChange={(e) => setAnio(e.target.value)}
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
          onChange={(e) => setAnio(e.target.value)}
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
            onChange={(e) => setDesde(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#0b1220] border border-gray-800 text-sm text-white"
          />
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
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
            <h1 className="text-2xl font-bold text-verdeEsmeralda">Reportes 📊</h1>
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
            <button
              onClick={() => setTipoFiltro("general")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                tipoFiltro === "general"
                  ? "bg-verdeEsmeralda text-black"
                  : "bg-white/10 text-white border border-white/10"
              }`}
            >
              General
            </button>

            <button
              onClick={() => setTipoFiltro("dia")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                tipoFiltro === "dia"
                  ? "bg-verdeEsmeralda text-black"
                  : "bg-white/10 text-white border border-white/10"
              }`}
            >
              Día
            </button>

            <button
              onClick={() => setTipoFiltro("mes")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                tipoFiltro === "mes"
                  ? "bg-verdeEsmeralda text-black"
                  : "bg-white/10 text-white border border-white/10"
              }`}
            >
              Mes
            </button>

            <button
              onClick={() => setTipoFiltro("anio")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                tipoFiltro === "anio"
                  ? "bg-verdeEsmeralda text-black"
                  : "bg-white/10 text-white border border-white/10"
              }`}
            >
              Año
            </button>

            <button
              onClick={() => setTipoFiltro("rango")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                tipoFiltro === "rango"
                  ? "bg-verdeEsmeralda text-black"
                  : "bg-white/10 text-white border border-white/10"
              }`}
            >
              Rango
            </button>
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
                  Object.entries(resumen.porMetodo ?? {}).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-300">{k}</span>
                      <span className="font-bold text-gray-100">{v}</span>
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
                <div className="text-sm text-gray-400 space-y-2">
                  <p>
                    Analytics no disponible aún. Falta el endpoint:
                    <span className="text-gray-200"> /analytics/summary</span>
                  </p>
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
                {resumen.obrasVendidas.slice(0, 12).map((obra) => (
                  <div
                    key={`${obra.obraId}-${obra.titulo}`}
                    className="bg-[#0b1220] border border-gray-800 rounded-xl p-4 flex gap-3"
                  >
                    {getAdminImageUrl(obra.imagenUrl, obra.imagen) ? (
  <img
    src={getAdminImageUrl(obra.imagenUrl, obra.imagen) ?? ""}
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
                ))}
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
                {resumen.pedidosFiltrados.slice(0, 12).map((p) => (
                  <div
                    key={p.id}
                    className="bg-[#0b1220] border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-100">
                        Pedido #{p.id} — {p.buyerName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {p.buyerEmail} · {p.buyerPhone || "Sin teléfono"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Pago: {p.metodoPago} · Estado: {p.estado || "pendiente"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Fecha: {formatFecha(p.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="text-lg font-extrabold text-gray-100">
                        {formatPrecio(p.total)} Bs
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

export default function AdminPanel() {
  const navigate = useNavigate();

  const [screen, setScreen] = useState<
    "dashboard" | "artists" | "obras" | "pedidos" | "reportes"
  >("dashboard");

  const [artists, setArtists] = useState<Artist[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [editingWorkFromDashboard, setEditingWorkFromDashboard] =
    useState<Work | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("crisalida_token");
    if (!token) navigate("/admin/login");
  }, [navigate]);

  const loadAll = async (): Promise<{ artists: Artist[]; works: Work[] }> => {
    const [aRes, wRes] = await Promise.all([
      fetch(`${API}/artistas`),
      fetch(`${API}/obras`),
    ]);
    const aData = (await aRes.json()) as Artist[];
    const wData = (await wRes.json()) as Work[];

    return {
      artists: Array.isArray(aData) ? aData : [],
      works: Array.isArray(wData) ? wData : [],
    };
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const r = await loadAll();
        if (!alive) return;
        setArtists(r.artists);
        setWorks(r.works);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setArtists([]);
        setWorks([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const artistsCount = artists.length;
    const worksCount = works.length;
    const totalStock = works.reduce((acc, w) => acc + Number(w.stock ?? 0), 0);
    const outOfStockCount = works.filter(
      (w) => Number(w.stock ?? 0) <= 0,
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

  const onEditWorkFromDashboard = (w: Work) => {
    setEditingWorkFromDashboard(w);
    setScreen("obras");
  };

  const refreshDashboard = async () => {
    try {
      const r = await loadAll();
      setArtists(r.artists);
      setWorks(r.works);
    } catch (e) {
      console.error(e);
      setArtists([]);
      setWorks([]);
    }
  };

  return (
    <div className="min-h-screen bg-negroSuave text-blancoPuro flex">
      <aside className="w-56 bg-[#0d1117] border-r border-gray-800 p-6 flex flex-col justify-between">
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

      <main className="flex-1 p-10">
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

        {screen === "pedidos" && <OrdersManager />}

        {screen === "reportes" && <ReportsPanel />}
      </main>
    </div>
  );
}
