import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../services/api";

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

const CART_KEY = "crisalida_cart";

function onlyLetters(value: string) {
  return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "");
}

function onlyNumbers(value: string) {
  return value.replace(/[^0-9]/g, "");
}

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
  const [pedidoQrConfirmado, setPedidoQrConfirmado] = useState(false);
  const [pedidoRegistrado, setPedidoRegistrado] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const items = raw ? (JSON.parse(raw) as CartItem[]) : [];

      setCart(Array.isArray(items) ? items : []);

      if (!items.length) {
        setErrorMsg("Tu carrito está vacío. Agrega una obra antes de continuar.");
      }
    } catch {
      setCart([]);
      setErrorMsg("No se pudo leer tu carrito. Vuelve a intentarlo.");
    }
  }, []);

  const total = useMemo(() => {
    return cart.reduce(
      (acc, item) => acc + Number(item.precio) * Number(item.cantidad),
      0
    );
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((acc, item) => acc + Number(item.cantidad), 0);
  }, [cart]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "nombre") {
      setForm((prev) => ({ ...prev, nombre: onlyLetters(value) }));
      return;
    }

    if (name === "telefono") {
      setForm((prev) => ({ ...prev, telefono: onlyNumbers(value).slice(0, 12) }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiarPedidoYSalir = () => {
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new Event("crisalida_cart_updated"));
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
      setErrorMsg("Por favor, escribe tu nombre completo.");
      return;
    }

    if (form.nombre.trim().length < 3) {
      setErrorMsg("El nombre debe tener al menos 3 letras.");
      return;
    }

    if (!form.telefono.trim()) {
      setErrorMsg("Por favor, escribe tu teléfono o WhatsApp.");
      return;
    }

    if (form.telefono.trim().length < 7) {
      setErrorMsg("El teléfono debe tener al menos 7 números.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const payload = {
        buyerName: form.nombre.trim(),
        buyerEmail: form.email.trim() || "sin-correo@crisalida.local",
        buyerPhone: form.telefono.trim(),
        buyerNote:
          `Teléfono: ${form.telefono.trim()}\n` +
          `Método de entrega: ${form.metodoEntrega}\n` +
          `Notas: ${form.notas.trim() || "Sin notas"}`,
        metodoPago: form.metodoPago === "transferencia" ? "QR" : "EFECTIVO",
        usuarioId: null,
        total,
        yaPago: false,
        comprobante: "",
        items: cart.map((item) => ({
          obraId: item.id,
          cantidad: item.cantidad,
        })),
      };

      const response = await fetch(`${API_URL}/pedidos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No se pudo registrar el pedido.");
      }

      await response.json();
      setPedidoRegistrado(true);

      if (form.metodoPago === "transferencia") {
        setPedidoQrConfirmado(true);
        setSuccessMsg(
          "✨ Pedido registrado correctamente. Ahora puedes realizar el pago por QR y nos pondremos en contacto contigo dentro de las próximas 24 horas."
        );
      } else {
        setSuccessMsg(
          "✨ Pedido registrado correctamente. Nos pondremos en contacto contigo dentro de las próximas 24 horas para coordinar la entrega."
        );
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("No se pudo registrar el pedido. Inténtalo nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-verdeEsmeralda font-bold">
            Crisálida Market
          </p>
          <h1 className="text-3xl font-extrabold text-gray-100 mt-1">
            Finalizar compra
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Revisa tu pedido y completa tus datos para coordinar la entrega.
          </p>
        </div>

        <Link
          to="/carrito"
          className="text-xs px-4 py-2 rounded-full border border-gray-700 text-gray-300 hover:text-verdeEsmeralda hover:border-verdeEsmeralda transition"
        >
          ← Volver
        </Link>
      </div>

      {errorMsg && (
        <div className="mb-5 rounded-2xl border border-red-800 bg-red-900/20 px-4 py-3">
          <p className="text-sm text-red-300 font-medium">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-5 rounded-2xl border border-emerald-700 bg-emerald-900/20 px-4 py-4">
          <p className="text-sm text-verdeEsmeralda font-semibold">{successMsg}</p>
        </div>
      )}

      {pedidoQrConfirmado && (
        <div className="mb-8 rounded-3xl border border-verdeEsmeralda/40 bg-[#07111f] p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-verdeEsmeralda text-center">
            Pago por QR
          </h2>

          <p className="text-sm text-gray-300 text-center mt-2 mb-5">
            Escanea el código QR para completar el pago de tu pedido.
          </p>

          <img
            src="/qr-pago.png"
            alt="Código QR de pago"
            className="w-72 max-w-full mx-auto rounded-2xl border border-gray-700 object-contain bg-white p-2"
          />

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

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 bg-[#050816] border border-gray-800 rounded-3xl p-5 shadow-xl">
          <h2 className="text-lg font-bold text-gray-100 mb-4">
            Resumen del pedido
          </h2>

          {cart.length === 0 ? (
            <p className="text-sm text-gray-400">No tienes obras en el carrito.</p>
          ) : (
            <>
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 items-center border-b border-gray-800 pb-4"
                  >
                    {item.imagenUrl ? (
                      <img
                        src={item.imagenUrl}
                        alt={item.titulo}
                        className="w-20 h-20 rounded-2xl object-cover border border-gray-800"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-[#020617] border border-gray-800 flex items-center justify-center text-[10px] text-gray-500">
                        Sin imagen
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-100 truncate">
                        {item.titulo}
                      </p>

                      {item.artistaNombre && (
                        <p className="text-xs text-verdeEsmeralda uppercase tracking-wide">
                          {item.artistaNombre}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-1">
                        {item.cantidad} × {Number(item.precio).toFixed(2)} Bs
                      </p>
                    </div>

                    <p className="text-sm font-bold text-gray-100">
                      {(Number(item.precio) * Number(item.cantidad)).toFixed(2)} Bs
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-[#020617] border border-gray-800 p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Cantidad total</span>
                  <span className="text-gray-100 font-semibold">{totalItems}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium">Total</span>
                  <span className="text-2xl font-extrabold text-verdeEsmeralda">
                    {total.toFixed(2)} Bs
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="lg:col-span-3 bg-[#050816] border border-gray-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl"
        >
          <div>
            <h2 className="text-lg font-bold text-gray-100">
              Datos para tu pedido
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Los campos con * son obligatorios.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="nombre" className="text-xs text-gray-400">
                Nombre completo *
              </label>

              <input
                id="nombre"
                name="nombre"
                type="text"
                inputMode="text"
                value={form.nombre}
                onChange={handleChange}
                disabled={pedidoRegistrado}
                className="w-full rounded-xl bg-[#020617] border border-gray-700 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-verdeEsmeralda focus:ring-1 focus:ring-verdeEsmeralda disabled:opacity-60"
                placeholder="Ej. Joel Lazarte"
              />

              <p className="text-[11px] text-gray-500">
                Solo letras. No se aceptan números.
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-xs text-gray-400">
                Correo electrónico
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                disabled={pedidoRegistrado}
                className="w-full rounded-xl bg-[#020617] border border-gray-700 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-verdeEsmeralda focus:ring-1 focus:ring-verdeEsmeralda disabled:opacity-60"
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="telefono" className="text-xs text-gray-400">
                Teléfono / WhatsApp *
              </label>

              <input
                id="telefono"
                name="telefono"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={12}
                value={form.telefono}
                onChange={handleChange}
                disabled={pedidoRegistrado}
                className="w-full rounded-xl bg-[#020617] border border-gray-700 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-verdeEsmeralda focus:ring-1 focus:ring-verdeEsmeralda disabled:opacity-60"
                placeholder="Ej. 72494995"
              />

              <p className="text-[11px] text-gray-500">
                Solo números. No se aceptan letras.
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="metodoEntrega" className="text-xs text-gray-400">
                Método de entrega
              </label>

              <select
                id="metodoEntrega"
                name="metodoEntrega"
                value={form.metodoEntrega}
                onChange={handleChange}
                disabled={pedidoRegistrado}
                className="w-full rounded-xl bg-[#020617] border border-gray-700 px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-verdeEsmeralda focus:ring-1 focus:ring-verdeEsmeralda disabled:opacity-60"
              >
                <option value="retiro">Retiro en Crisálida / Taller</option>
                <option value="envio">Envío a coordinar</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="metodoPago" className="text-xs text-gray-400">
                Método de pago
              </label>

              <select
                id="metodoPago"
                name="metodoPago"
                value={form.metodoPago}
                onChange={handleChange}
                disabled={pedidoRegistrado}
                className="w-full rounded-xl bg-[#020617] border border-gray-700 px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-verdeEsmeralda focus:ring-1 focus:ring-verdeEsmeralda disabled:opacity-60"
              >
                <option value="transferencia">Transferencia / QR</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>
          </div>

          {form.metodoPago === "transferencia" && !pedidoQrConfirmado && (
            <div className="rounded-3xl border border-verdeEsmeralda/30 bg-[#020617] p-4">
              <p className="text-sm text-gray-300 mb-3 text-center">
                Puedes escanear este QR antes de confirmar tu pedido.
              </p>

              <img
                src="/qr-pago.png"
                alt="Código QR de pago"
                className="w-60 max-w-full mx-auto rounded-2xl border border-gray-700 object-contain bg-white p-2"
              />

              <p className="text-xs text-gray-500 text-center mt-3">
                Después de confirmar, el QR volverá a mostrarse.
              </p>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="notas" className="text-xs text-gray-400">
              Notas adicionales
            </label>

            <textarea
              id="notas"
              name="notas"
              value={form.notas}
              onChange={handleChange}
              disabled={pedidoRegistrado}
              rows={4}
              className="w-full rounded-xl bg-[#020617] border border-gray-700 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-verdeEsmeralda focus:ring-1 focus:ring-verdeEsmeralda disabled:opacity-60 resize-none"
              placeholder="Ej: horarios, referencias, detalles de entrega..."
            />
          </div>

          {!pedidoRegistrado ? (
            <button
              type="submit"
              disabled={submitting || !cart.length}
              className="w-full rounded-2xl bg-verdeEsmeralda text-black text-sm font-extrabold py-4 hover:opacity-90 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Registrando pedido..." : "Confirmar pedido"}
            </button>
          ) : (
            <button
              type="button"
              onClick={limpiarPedidoYSalir}
              className="w-full rounded-2xl bg-verdeEsmeralda text-black text-sm font-extrabold py-4 hover:opacity-90 active:scale-[0.99] transition"
            >
              Finalizar y volver a la tienda
            </button>
          )}

          <p className="text-[11px] text-gray-500 text-center">
            Al confirmar tu pedido, nos pondremos en contacto por WhatsApp o correo dentro de las próximas 24 horas.
          </p>
        </form>
      </div>
    </section>
  );
}