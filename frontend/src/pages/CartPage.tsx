import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../services/api";

type CartItem = {
  id: number;
  titulo: string;
  precio: number;
  cantidad: number;
  imagenUrl: string | null;
  artistaNombre?: string;
};

type MetodoPago = "QR" | "EFECTIVO";

const CART_KEY = "crisalida_cart";
const QR_IMAGE = "/qr-pago.png";
const REFERENCIA_PAGO = "CRISALIDA-QR-2026";
const TITULAR_PAGO = "Colectiva Crisálida";
const BANCO_PAGO = "Pago por QR";
const TELEFONO_CONTACTO = "+591 72494995";

type PedidoMinimo = {
  id: number;
  buyerEmail: string;
  buyerPhone?: string;
  createdAt?: string;
};

export default function CartPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<CartItem[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerNote, setBuyerNote] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("QR");

  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [pedidoQrConfirmado, setPedidoQrConfirmado] = useState(false);
  const [pedidoRegistrado, setPedidoRegistrado] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);
  const [yaPague, setYaPague] = useState(false);
  const [pedidoIdActual, setPedidoIdActual] = useState<number | null>(null);

  const loadCart = (): CartItem[] => {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as CartItem[];

      return Array.isArray(parsed)
        ? parsed.map((it) => ({
            ...it,
            precio:
              typeof it.precio === "number"
                ? it.precio
                : Number(it.precio ?? 0),
            cantidad: Number(it.cantidad ?? 1),
            imagenUrl: it.imagenUrl ?? null,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const saveCart = (next: CartItem[]) => {
    localStorage.setItem(CART_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("crisalida_cart_updated"));
    setItems(next);
  };

  useEffect(() => {
    setItems(loadCart());
  }, []);

  const handleIncrease = (id: number) => {
    if (pedidoRegistrado) return;

    const next = items.map((it) =>
      it.id === id ? { ...it, cantidad: it.cantidad + 1 } : it
    );

    saveCart(next);
  };

  const handleDecrease = (id: number) => {
    if (pedidoRegistrado) return;

    const next = items.map((it) =>
      it.id === id ? { ...it, cantidad: Math.max(1, it.cantidad - 1) } : it
    );

    saveCart(next);
  };

  const handleRemove = (id: number) => {
    if (pedidoRegistrado) return;

    const next = items.filter((it) => it.id !== id);
    saveCart(next);
  };

  const total = useMemo(
    () =>
      items.reduce(
        (acc, it) => acc + Number(it.precio) * Number(it.cantidad),
        0
      ),
    [items]
  );

  const limpiarFormulario = () => {
    setBuyerName("");
    setBuyerEmail("");
    setBuyerPhone("");
    setBuyerNote("");
    setMetodoPago("QR");
    setPedidoQrConfirmado(false);
    setPedidoRegistrado(false);
    setQrImageError(false);
    setYaPague(false);
    setPedidoIdActual(null);
    setMessage(null);
  };

  const finalizarCompra = () => {
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new Event("crisalida_cart_updated"));
    setItems([]);
    limpiarFormulario();
    navigate("/tienda");
  };

  const handleYaPague = async () => {
    try {
      let pedidoId = pedidoIdActual;

      if (!pedidoId) {
        const pedidosRes = await fetch(`${API_URL}/pedidos`);

        if (!pedidosRes.ok) {
          throw new Error("No se pudieron obtener los pedidos.");
        }

        const pedidos = (await pedidosRes.json()) as PedidoMinimo[];

        const ultimoPedido = [...pedidos]
          .filter(
            (p) =>
              p.buyerEmail === buyerEmail.trim() &&
              (p.buyerPhone ?? "") === buyerPhone.trim()
          )
          .sort((a, b) => Number(b.id) - Number(a.id))[0];

        if (!ultimoPedido) {
          setMessage("❌ No se encontró el pedido para marcar el pago.");
          return;
        }

        pedidoId = ultimoPedido.id;
        setPedidoIdActual(ultimoPedido.id);
      }

      const res = await fetch(`${API_URL}/pedidos/${pedidoId}/pago-reportado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yaPago: true,
          comprobante: "Pago reportado desde carrito",
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo reportar el pago");
      }

      setYaPague(true);
      setMessage(
        "✅ Perfecto. Registramos que ya realizaste el pago. Nos pondremos en contacto contigo dentro de las próximas 24 horas para validar la transacción y continuar con tu pedido 🦋"
      );
    } catch (err) {
      console.error(err);
      setMessage("❌ No se pudo registrar el pago reportado.");
    }
  };

  const handleConfirmOrder = async (event: React.FormEvent) => {
    event.preventDefault();

    if (items.length === 0) {
      setMessage("Tu carrito está vacío 🫧");
      return;
    }

    if (!buyerName.trim() || !buyerEmail.trim() || !buyerPhone.trim()) {
      setMessage("Por favor, llena tu nombre, correo y teléfono.");
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerNote: buyerNote.trim() ? buyerNote.trim() : undefined,
        metodoPago,
        total,
        yaPago: false,
        comprobante: "",
        items: items.map((it) => ({
          obraId: it.id,
          cantidad: it.cantidad,
        })),
      };

      const res = await fetch(`${API_URL}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "No se pudo confirmar el pedido.");
      }

      const pedidoCreado = (await res.json()) as { id?: number };

      if (pedidoCreado?.id) {
        setPedidoIdActual(pedidoCreado.id);
      }

      setPedidoRegistrado(true);

      if (metodoPago === "QR") {
        setPedidoQrConfirmado(true);
        setMessage(
          "✅ Pedido confirmado. Ahora puedes realizar el pago escaneando el QR que aparece abajo. Cuando termines, presiona “Ya pagué” y nos contactaremos contigo pronto 🦋"
        );
      } else {
        localStorage.removeItem(CART_KEY);
        window.dispatchEvent(new Event("crisalida_cart_updated"));
        setItems([]);
        limpiarFormulario();
        setMessage("✅ Pedido confirmado. Te contactaremos pronto 🦋");

        setTimeout(() => {
          navigate("/tienda");
        }, 2200);
      }
    } catch (err) {
      console.error(err);
      setMessage(
        "❌ No se pudo confirmar el pedido. Revisa que el backend esté funcionando y que existan las obras."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-100 mb-4">
        🛒 Tu carrito Crisálida
      </h1>

      {items.length === 0 && !pedidoQrConfirmado && (
        <div className="bg-[#050816] border border-gray-800 rounded-2xl p-6 text-sm text-gray-300">
          <p className="mb-3">Tu carrito está vacío por ahora.</p>
          <Link
            to="/tienda"
            className="text-verdeEsmeralda hover:underline text-sm"
          >
            ← Volver a la tienda
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-[#050816] border border-gray-800 rounded-2xl p-4 flex gap-4"
              >
                {item.imagenUrl && (
                  <img
                    src={item.imagenUrl}
                    alt={item.titulo}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}

                <div className="flex-1">
                  <p className="font-semibold text-gray-100">{item.titulo}</p>

                  {item.artistaNombre && (
                    <p className="text-xs text-verdeEsmeralda">
                      {item.artistaNombre}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mb-1">
                    {Number(item.precio).toFixed(2)} Bs c/u
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => handleDecrease(item.id)}
                      disabled={pedidoRegistrado}
                      className="w-7 h-7 rounded-full border border-gray-600 text-gray-200 text-sm hover:bg-gray-700 disabled:opacity-50"
                    >
                      -
                    </button>

                    <span className="text-sm text-gray-100">
                      {item.cantidad}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleIncrease(item.id)}
                      disabled={pedidoRegistrado}
                      className="w-7 h-7 rounded-full border border-gray-600 text-gray-200 text-sm hover:bg-gray-700 disabled:opacity-50"
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={pedidoRegistrado}
                      className="ml-auto text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#050816] border border-gray-800 rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">
              Resumen del pedido
            </h2>

            <p className="text-sm text-gray-300 mb-1">
              Ítems:{" "}
              <span className="font-medium text-gray-100">{items.length}</span>
            </p>

            <p className="text-sm text-gray-300 mb-4">
              Total:{" "}
              <span className="font-bold text-verdeEsmeralda text-lg">
                {total.toFixed(2)} Bs
              </span>
            </p>

            <form onSubmit={handleConfirmOrder} className="space-y-3">
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                disabled={pedidoRegistrado}
                className="w-full px-3 py-2 rounded-lg bg-[#020617] border border-gray-700 text-sm text-gray-100"
                placeholder="Nombre completo"
              />

              <input
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                disabled={pedidoRegistrado}
                className="w-full px-3 py-2 rounded-lg bg-[#020617] border border-gray-700 text-sm text-gray-100"
                placeholder="Correo electrónico"
              />

              <input
                type="text"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                disabled={pedidoRegistrado}
                className="w-full px-3 py-2 rounded-lg bg-[#020617] border border-gray-700 text-sm text-gray-100"
                placeholder="Teléfono"
              />

              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                disabled={pedidoRegistrado}
                className="w-full px-3 py-2 rounded-lg bg-[#020617] border border-gray-700 text-sm text-gray-100"
              >
                <option value="QR">QR</option>
                <option value="EFECTIVO">Efectivo</option>
              </select>

              <textarea
                value={buyerNote}
                onChange={(e) => setBuyerNote(e.target.value)}
                disabled={pedidoRegistrado}
                className="w-full px-3 py-2 rounded-lg bg-[#020617] border border-gray-700 text-sm text-gray-100"
                rows={3}
                placeholder="Nota o comentario opcional"
              />

              {!pedidoRegistrado ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-2 rounded-lg bg-verdeEsmeralda text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Confirmando..." : "Confirmar pedido"}
                </button>
              ) : metodoPago === "QR" ? (
                <button
                  type="button"
                  onClick={finalizarCompra}
                  className="w-full mt-2 py-2 rounded-lg bg-verdeEsmeralda text-black text-sm font-semibold hover:opacity-90"
                >
                  Finalizar y volver a la tienda
                </button>
              ) : null}
            </form>

            {message && (
              <p className="mt-3 text-xs text-verdeEsmeralda">{message}</p>
            )}

            {pedidoQrConfirmado && (
              <div className="mt-4 rounded-2xl border border-verdeEsmeralda/40 bg-[#07111f] p-4 shadow-lg">
                <h3 className="text-sm font-bold text-verdeEsmeralda text-center mb-3">
                  Pago por QR
                </h3>

                {!qrImageError ? (
                  <img
                    src={QR_IMAGE}
                    alt="Código QR de pago"
                    onError={() => setQrImageError(true)}
                    className="w-64 max-w-full mx-auto rounded-xl border border-gray-700 object-contain bg-white p-2"
                  />
                ) : (
                  <div className="rounded-xl border border-red-800 bg-red-900/20 px-3 py-3 text-center">
                    <p className="text-xs text-red-300">
                      No se pudo cargar la imagen del QR. Verifica que exista en:
                    </p>
                    <p className="text-xs text-red-200 mt-1 font-semibold">
                      public/qr-pago.png
                    </p>
                  </div>
                )}

                <div className="mt-4 rounded-xl bg-[#020617] border border-gray-800 p-3">
                  <p className="text-[11px] text-gray-400">Titular</p>
                  <p className="text-sm text-white font-semibold">
                    {TITULAR_PAGO}
                  </p>

                  <p className="text-[11px] text-gray-400 mt-3">
                    Entidad / Banco
                  </p>
                  <p className="text-sm text-white font-semibold">
                    {BANCO_PAGO}
                  </p>

                  <p className="text-[11px] text-gray-400 mt-3">
                    Número de referencia
                  </p>
                  <p className="text-sm text-verdeEsmeralda font-bold">
                    {REFERENCIA_PAGO}
                  </p>

                  <p className="text-[11px] text-gray-400 mt-3">
                    Teléfono de contacto
                  </p>
                  <p className="text-sm text-white font-semibold">
                    {TELEFONO_CONTACTO}
                  </p>
                </div>

                <p className="mt-3 text-xs text-gray-400 text-center">
                  Una vez realizado el pago, presiona el botón para notificarnos.
                </p>

                {!yaPague ? (
                  <button
                    type="button"
                    onClick={handleYaPague}
                    className="w-full mt-4 py-2 rounded-lg border border-verdeEsmeralda text-verdeEsmeralda text-sm font-semibold hover:bg-verdeEsmeralda hover:text-black transition"
                  >
                    Ya pagué
                  </button>
                ) : (
                  <div className="mt-4 rounded-xl border border-emerald-700 bg-emerald-900/20 px-3 py-3 text-center">
                    <p className="text-sm font-semibold text-verdeEsmeralda">
                      Pago reportado correctamente ✅
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}