import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

type CartItem = {
  id: number;
  titulo: string;
  precio: number;
  cantidad: number;
  imagenUrl: string;
  artistaNombre?: string;
};

type FormState = {
  nombre: string;
  email: string;
  telefono: string;
  metodoEntrega: "retiro" | "envio";
  metodoPago: "transferencia" | "efectivo";
  notas: string;
};

const API = "http://localhost:3000";

export default function CheckoutPage() {
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState<FormState>({
    nombre: "",
    email: "",
    telefono: "",
    metodoEntrega: "retiro",
    metodoPago: "transferencia",
    notas: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ✅ NUEVO: controla si el pedido QR ya fue confirmado
  const [pedidoQrConfirmado, setPedidoQrConfirmado] = useState(false);

  // ✅ NUEVO: evita volver a mandar el pedido dos veces
  const [pedidoRegistrado, setPedidoRegistrado] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("crisalida_cart");
    const items: CartItem[] = raw ? JSON.parse(raw) : [];
    setCart(items);

    if (!items.length) {
      setErrorMsg("Tu carrito está vacío. Agrega alguna obra antes de continuar.");
    }
  }, []);

  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.cantidad, 0);
  }, [cart]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const limpiarPedidoYSalir = () => {
    localStorage.removeItem("crisalida_cart");
    setCart([]);
    navigate("/tienda");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cart.length) {
      setErrorMsg("No puedes finalizar la compra con el carrito vacío.");
      return;
    }

    if (!form.nombre.trim()) {
      setErrorMsg("Por favor, completa tu nombre.");
      return;
    }

    if (!form.telefono.trim()) {
      setErrorMsg("Por favor, completa tu teléfono o WhatsApp.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const payload = {
        buyerName: form.nombre.trim(),
        buyerEmail: form.email.trim() || "sin-correo@crisalida.local",
        buyerNote:
          `Teléfono: ${form.telefono.trim()}\n` +
          `Método de entrega: ${form.metodoEntrega}\n` +
          `Notas: ${form.notas.trim() || "Sin notas"}`,
        metodoPago: form.metodoPago === "transferencia" ? "QR" : "EFECTIVO",
        usuarioId: null,
        total,
        items: cart.map((item) => ({
          obraId: item.id,
          cantidad: item.cantidad,
        })),
      };

      const response = await fetch(`${API}/pedidos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No se pudo registrar el pedido en el backend.");
      }

      await response.json();

      setPedidoRegistrado(true);

      // ✅ SI ES QR: se queda en la página y muestra el QR después de confirmar
      if (form.metodoPago === "transferencia") {
        setPedidoQrConfirmado(true);
        setSuccessMsg(
          "✨ Tu pedido fue registrado con éxito. Ahora realiza el pago escaneando el QR y nos pondremos en contacto contigo dentro de las próximas 24 horas.",
        );
      } else {
        // ✅ SI ES EFECTIVO: muestra mensaje y deja botón para finalizar
        setSuccessMsg(
          "✨ Tu pedido fue registrado con éxito. Nos pondremos en contacto contigo dentro de las próximas 24 horas para coordinar la entrega.",
        );
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(
        "Ocurrió un error al enviar tu pedido. Verifica que el backend esté encendido e inténtalo de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">
          Finalizar compra 🧾
        </h1>

        <Link
          to="/carrito"
          className="text-xs text-gray-400 hover:text-verdeEsmeralda transition"
        >
          ← Volver al carrito
        </Link>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 shadow">
          <p className="text-sm text-red-400">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 rounded-xl border border-emerald-700 bg-emerald-900/20 px-4 py-4 shadow-lg">
          <p className="text-sm font-semibold text-verdeEsmeralda">
            {successMsg}
          </p>
        </div>
      )}

      {/* ✅ QR POSTERIOR A LA CONFIRMACIÓN */}
      {pedidoQrConfirmado && (
        <div className="mb-6 rounded-2xl border border-verdeEsmeralda/40 bg-[#07111f] p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-verdeEsmeralda text-center mb-3">
            Pago por QR
          </h2>

          <p className="text-sm text-gray-300 text-center mb-4">
            Escanea este código QR para completar el pago de tu pedido.
          </p>

          <img
            src="/qr-pago.png"
            alt="Código QR de pago"
            className="w-72 max-w-full mx-auto rounded-2xl border border-gray-700 object-contain"
          />

          <p className="text-xs text-gray-400 text-center mt-4">
            Después de realizar el pago, conservaremos tu pedido registrado y nos
            contactaremos contigo dentro de las próximas 24 horas.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={limpiarPedidoYSalir}
              className="rounded-xl bg-verdeEsmeralda px-5 py-3 text-sm font-bold text-black hover:opacity-90 transition"
            >
              Finalizar y volver a la tienda
            </button>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="rounded-xl border border-gray-700 bg-[#020617] px-5 py-3 text-sm font-semibold text-white hover:border-verdeEsmeralda transition"
            >
              Ver datos del pedido
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* RESUMEN */}
        <div className="bg-[#050816] border border-gray-800 rounded-2xl p-5 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">
            Resumen del pedido
          </h2>

          {cart.length === 0 ? (
            <p className="text-sm text-gray-400">
              No tienes obras en el carrito.
            </p>
          ) : (
            <>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 items-center border-b border-gray-800 pb-3"
                  >
                    {item.imagenUrl ? (
                      <img
                        src={item.imagenUrl}
                        alt={item.titulo}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-[#020617] border border-gray-800 flex items-center justify-center text-[10px] text-gray-500">
                        Sin imagen
                      </div>
                    )}

                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-100">
                        {item.titulo}
                      </p>

                      {item.artistaNombre && (
                        <p className="text-xs text-verdeEsmeralda">
                          {item.artistaNombre}
                        </p>
                      )}

                      <p className="text-xs text-gray-400">
                        Cantidad: {item.cantidad}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-100">
                        {(item.precio * item.cantidad).toFixed(2)} Bs
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-[#020617] border border-gray-800 p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Items</span>
                  <span className="text-gray-100 font-semibold">
                    {totalItems}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Total</span>
                  <span className="text-2xl font-bold text-verdeEsmeralda">
                    {total.toFixed(2)} Bs
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#050816] border border-gray-800 rounded-2xl p-5 space-y-4 shadow-lg"
        >
          <h2 className="text-lg font-semibold text-gray-100">
            Datos para tu pedido ✍️
          </h2>

          <div className="space-y-1">
            <label className="text-xs text-gray-400" htmlFor="nombre">
              Nombre completo *
            </label>
            <input
              id="nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              disabled={pedidoRegistrado}
              className="w-full rounded-lg bg-[#020617] border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-verdeEsmeralda disabled:opacity-60"
              placeholder="Ej. Joel Lazarte"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled={pedidoRegistrado}
              className="w-full rounded-lg bg-[#020617] border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-verdeEsmeralda disabled:opacity-60"
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400" htmlFor="telefono">
              Teléfono / WhatsApp *
            </label>
            <input
              id="telefono"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              disabled={pedidoRegistrado}
              className="w-full rounded-lg bg-[#020617] border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-verdeEsmeralda disabled:opacity-60"
              placeholder="+591 ..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-400" htmlFor="metodoEntrega">
                Método de entrega
              </label>
              <select
                id="metodoEntrega"
                name="metodoEntrega"
                value={form.metodoEntrega}
                onChange={handleChange}
                disabled={pedidoRegistrado}
                className="w-full rounded-lg bg-[#020617] border border-gray-700 px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-verdeEsmeralda disabled:opacity-60"
              >
                <option value="retiro">Retiro en Crisálida / Taller</option>
                <option value="envio">Envío (a coordinar)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400" htmlFor="metodoPago">
                Método de pago
              </label>
              <select
                id="metodoPago"
                name="metodoPago"
                value={form.metodoPago}
                onChange={handleChange}
                disabled={pedidoRegistrado}
                className="w-full rounded-lg bg-[#020617] border border-gray-700 px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-verdeEsmeralda disabled:opacity-60"
              >
                <option value="transferencia">Transferencia / QR</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>
          </div>

          {/* ✅ QR PREVIO A CONFIRMAR */}
          {form.metodoPago === "transferencia" && !pedidoQrConfirmado && (
            <div className="rounded-2xl border border-verdeEsmeralda/30 bg-[#020617] p-4">
              <p className="text-sm text-gray-300 mb-3">
                Si deseas, puedes escanear este código QR antes de confirmar tu pedido.
              </p>

              <img
                src="/qr-pago.png"
                alt="Código QR de pago"
                className="w-64 max-w-full mx-auto rounded-xl border border-gray-700 object-contain"
              />

              <div className="mt-3 rounded-xl bg-emerald-900/10 border border-emerald-800/40 px-3 py-2">
                <p className="text-xs text-gray-300 text-center">
                  Después de confirmar el pedido, el QR volverá a mostrarse para que
                  puedas realizar el pago con tranquilidad.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-gray-400" htmlFor="notas">
              Notas adicionales
            </label>
            <textarea
              id="notas"
              name="notas"
              value={form.notas}
              onChange={handleChange}
              disabled={pedidoRegistrado}
              rows={3}
              className="w-full rounded-lg bg-[#020617] border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-verdeEsmeralda disabled:opacity-60"
              placeholder="Ej: horarios, referencias, detalles de entrega, etc."
            />
          </div>

          {!pedidoRegistrado ? (
            <button
              type="submit"
              disabled={submitting || !cart.length}
              className="mt-2 w-full rounded-xl bg-verdeEsmeralda text-black text-sm font-bold py-3 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Enviando pedido..." : "Confirmar pedido"}
            </button>
          ) : (
            <button
              type="button"
              onClick={limpiarPedidoYSalir}
              className="mt-2 w-full rounded-xl bg-verdeEsmeralda text-black text-sm font-bold py-3 hover:opacity-90 transition"
            >
              Finalizar y volver a la tienda
            </button>
          )}

          <p className="text-[11px] text-gray-500">
            Al confirmar tu pedido, nos pondremos en contacto por WhatsApp o
            correo dentro de las próximas 24 horas para coordinar el pago y la
            entrega de tu obra ✨.
          </p>
        </form>
      </div>
    </section>
  );
}