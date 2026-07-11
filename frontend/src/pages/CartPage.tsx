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
};

function onlyLetters(value: string) {
  return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
}

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function Shell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`w-full px-4 sm:px-6 lg:px-10 2xl:px-16 ${className}`}>
      <div className="mx-auto w-full max-w-[1480px]">{children}</div>
    </section>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[32px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900 ${className}`}
    >
      {children}
    </div>
  );
}

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
      it.id === id ? { ...it, cantidad: it.cantidad + 1 } : it,
    );

    saveCart(next);
  };

  const handleDecrease = (id: number) => {
    if (pedidoRegistrado) return;

    const next = items.map((it) =>
      it.id === id
        ? { ...it, cantidad: Math.max(1, it.cantidad - 1) }
        : it,
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
        0,
      ),
    [items],
  );

  const totalCantidad = useMemo(
    () => items.reduce((acc, it) => acc + Number(it.cantidad), 0),
    [items],
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
              (p.buyerPhone ?? "") === buyerPhone.trim(),
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
        "✅ Perfecto. Registramos que ya realizaste el pago. Nos pondremos en contacto contigo dentro de las próximas 24 horas para validar la transacción y continuar con tu pedido 🦋",
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

    if (buyerPhone.trim().length < 7) {
      setMessage("Por favor, ingresa un teléfono válido.");
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
          "✅ Pedido confirmado. Ahora puedes realizar el pago escaneando el QR que aparece abajo. Cuando termines, presiona “Ya pagué” y nos contactaremos contigo pronto 🦋",
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
        "❌ No se pudo confirmar el pedido. Revisa que el backend esté funcionando y que existan las obras.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f5] text-neutral-950 transition-colors duration-300 dark:bg-neutral-950 dark:text-white">
      <Shell className="py-8 lg:py-10">
        <div className="relative overflow-hidden rounded-[38px] border border-emerald-200 bg-emerald-50 p-6 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-400/10 sm:p-8 lg:p-10">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-white/70 blur-3xl dark:bg-white/5" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
                Colección Crisálida
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-neutral-950 dark:text-white sm:text-5xl lg:text-6xl">
                Tu carrito Crisálida
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-white/65 sm:text-base">
                Revisa tus obras seleccionadas, confirma tus datos y continúa
                con tu pedido.
              </p>
            </div>

            <Link
              to="/tienda"
              className="w-fit rounded-full border border-emerald-300 bg-white/60 px-6 py-3 text-sm font-black text-neutral-950 transition hover:bg-white dark:border-emerald-400/30 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              ← Seguir explorando
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Obras", `${items.length} seleccionadas`],
            ["Cantidad", `${totalCantidad} piezas`],
            ["Total", `${total.toFixed(2)} Bs`],
            ["Pago", metodoPago === "QR" ? "QR disponible" : "Efectivo"],
          ].map(([title, text]) => (
            <Panel key={title} className="p-5">
              <p className="text-base font-black text-neutral-950 dark:text-white">
                {title}
              </p>

              <p className="mt-1 text-sm text-neutral-500 dark:text-white/55">
                {text}
              </p>
            </Panel>
          ))}
        </div>

        {items.length === 0 && !pedidoQrConfirmado && (
          <Panel className="mt-8 overflow-hidden">
            <div className="relative p-8 sm:p-10">
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />

              <div className="relative max-w-2xl">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl dark:bg-emerald-400/10">
                  🛒
                </div>

                <p className="text-2xl font-black text-neutral-950 dark:text-white">
                  Tu carrito está vacío por ahora.
                </p>

                <p className="mt-3 text-sm leading-relaxed text-neutral-500 dark:text-white/55">
                  Explora la tienda y agrega una obra para iniciar tu colección
                  Crisálida.
                </p>

                <Link
                  to="/tienda"
                  className="mt-6 inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                >
                  Ver obras disponibles
                </Link>
              </div>
            </div>
          </Panel>
        )}

        {items.length > 0 && (
          <div className="mt-8 grid items-start gap-8 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-4">
              {items.map((item) => (
                <Panel key={item.id} className="overflow-hidden p-5">
                  <div className="flex flex-col gap-5 sm:flex-row">
                    {item.imagenUrl ? (
                      <img
                        src={item.imagenUrl}
                        alt={item.titulo}
                        className="h-52 w-full rounded-[24px] object-cover sm:h-44 sm:w-44"
                      />
                    ) : (
                      <div className="flex h-52 w-full items-center justify-center rounded-[24px] border border-neutral-200 bg-neutral-50 text-sm text-neutral-400 dark:border-white/10 dark:bg-white/5 dark:text-white/35 sm:h-44 sm:w-44">
                        Sin imagen
                      </div>
                    )}

                    <div className="flex flex-1 flex-col">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-2xl font-black leading-tight text-neutral-950 dark:text-white">
                            {item.titulo}
                          </p>

                          {item.artistaNombre && (
                            <p className="mt-1 text-sm font-black text-emerald-700 dark:text-emerald-300">
                              {item.artistaNombre}
                            </p>
                          )}

                          <p className="mt-3 text-sm text-neutral-500 dark:text-white/55">
                            {Number(item.precio).toFixed(2)} Bs c/u
                          </p>
                        </div>

                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                          {(Number(item.precio) * item.cantidad).toFixed(2)} Bs
                        </p>
                      </div>

                      <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
                        <button
                          type="button"
                          onClick={() => handleDecrease(item.id)}
                          disabled={pedidoRegistrado}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-sm font-black text-neutral-950 transition hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-emerald-400/10"
                        >
                          -
                        </button>

                        <span className="min-w-8 text-center text-sm font-black text-neutral-950 dark:text-white">
                          {item.cantidad}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleIncrease(item.id)}
                          disabled={pedidoRegistrado}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-sm font-black text-neutral-950 transition hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-emerald-400/10"
                        >
                          +
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          disabled={pedidoRegistrado}
                          className="ml-auto rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>

            <aside className="sticky top-24">
              <Panel className="p-6">
                <h2 className="mb-4 text-2xl font-black text-neutral-950 dark:text-white">
                  Resumen del pedido
                </h2>

                <div className="mb-6 space-y-3 rounded-[24px] bg-emerald-50 p-4 dark:bg-emerald-400/10">
                  <div className="flex justify-between text-sm text-neutral-600 dark:text-white/65">
                    <span>Obras</span>
                    <span className="font-black text-neutral-950 dark:text-white">
                      {items.length}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm text-neutral-600 dark:text-white/65">
                    <span>Cantidad</span>
                    <span className="font-black text-neutral-950 dark:text-white">
                      {totalCantidad}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm text-neutral-600 dark:text-white/65">
                    <span>Total</span>
                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                      {total.toFixed(2)} Bs
                    </span>
                  </div>
                </div>

                <form onSubmit={handleConfirmOrder} className="space-y-3">
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(onlyLetters(e.target.value))}
                    disabled={pedidoRegistrado}
                    className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-emerald-400"
                    placeholder="Nombre completo"
                    inputMode="text"
                    autoComplete="name"
                  />

                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    disabled={pedidoRegistrado}
                    className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-emerald-400"
                    placeholder="Correo electrónico"
                    inputMode="email"
                    autoComplete="email"
                  />

                  <input
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(onlyNumbers(e.target.value))}
                    disabled={pedidoRegistrado}
                    className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-emerald-400"
                    placeholder="Teléfono"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={12}
                  />

                  <select
                    value={metodoPago}
                    onChange={(e) =>
                      setMetodoPago(e.target.value as MetodoPago)
                    }
                    disabled={pedidoRegistrado}
                    className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-950 outline-none transition focus:border-emerald-500 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-emerald-400"
                  >
                    <option value="QR">QR</option>
                    <option value="EFECTIVO">Efectivo</option>
                  </select>

                  <textarea
                    value={buyerNote}
                    onChange={(e) => setBuyerNote(e.target.value)}
                    disabled={pedidoRegistrado}
                    className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-emerald-400"
                    rows={4}
                    placeholder="Nota o comentario opcional"
                  />

                  {!pedidoRegistrado ? (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-2 w-full rounded-full bg-emerald-600 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                    >
                      {submitting ? "Confirmando..." : "Confirmar pedido"}
                    </button>
                  ) : metodoPago === "QR" ? (
                    <button
                      type="button"
                      onClick={finalizarCompra}
                      className="mt-2 w-full rounded-full bg-emerald-600 py-3 text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                    >
                      Finalizar y volver a la tienda
                    </button>
                  ) : null}
                </form>

                {message && (
                  <p className="mt-4 rounded-[20px] bg-emerald-50 px-4 py-3 text-xs font-semibold leading-relaxed text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">
                    {message}
                  </p>
                )}

                {pedidoQrConfirmado && (
                  <div className="mt-5 rounded-[28px] border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-400/10">
                    <h3 className="mb-3 text-center text-sm font-black text-emerald-700 dark:text-emerald-300">
                      Pago por QR
                    </h3>

                    {!qrImageError ? (
                      <img
                        src={QR_IMAGE}
                        alt="Código QR de pago"
                        onError={() => setQrImageError(true)}
                        className="mx-auto w-64 max-w-full rounded-2xl border border-neutral-200 bg-white object-contain p-2"
                      />
                    ) : (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-center dark:border-red-400/20 dark:bg-red-400/10">
                        <p className="text-xs text-red-600 dark:text-red-300">
                          No se pudo cargar la imagen del QR. Verifica que
                          exista en:
                        </p>

                        <p className="mt-1 text-xs font-black text-red-700 dark:text-red-200">
                          public/qr-pago.png
                        </p>
                      </div>
                    )}

                    <div className="mt-4 rounded-[22px] border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-neutral-900">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400 dark:text-white/40">
                        Titular
                      </p>
                      <p className="text-sm font-black text-neutral-950 dark:text-white">
                        {TITULAR_PAGO}
                      </p>

                      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400 dark:text-white/40">
                        Entidad / Banco
                      </p>
                      <p className="text-sm font-black text-neutral-950 dark:text-white">
                        {BANCO_PAGO}
                      </p>

                      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400 dark:text-white/40">
                        Número de referencia
                      </p>
                      <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                        {REFERENCIA_PAGO}
                      </p>

                      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400 dark:text-white/40">
                        Teléfono de contacto
                      </p>
                      <p className="text-sm font-black text-neutral-950 dark:text-white">
                        {TELEFONO_CONTACTO}
                      </p>
                    </div>

                    <p className="mt-3 text-center text-xs text-neutral-500 dark:text-white/55">
                      Una vez realizado el pago, presiona el botón para
                      notificarnos.
                    </p>

                    {!yaPague ? (
                      <button
                        type="button"
                        onClick={handleYaPague}
                        className="mt-4 w-full rounded-full border border-emerald-500 px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-600 hover:text-white dark:border-emerald-400 dark:text-emerald-300 dark:hover:bg-emerald-400 dark:hover:text-black"
                      >
                        Ya pagué
                      </button>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-white px-3 py-3 text-center dark:border-emerald-400/20 dark:bg-neutral-900">
                        <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                          Pago reportado correctamente ✅
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            </aside>
          </div>
        )}
      </Shell>
    </div>
  );
}