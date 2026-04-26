import nodemailer from 'nodemailer';

type PedidoEmailItem = {
  titulo?: string;
  cantidad?: number;
  precio?: number | string;
  subtotal?: number | string;
};

type PedidoEmail = {
  id?: number;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerNote?: string;
  metodoPago?: string;
  total?: number | string;
  items?: PedidoEmailItem[];
};

export async function sendPedidoEmail(pedido: PedidoEmail): Promise<void> {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailTo = process.env.EMAIL_TO || emailUser;

  if (!emailUser || !emailPass || !emailTo) {
    console.warn(
      'Email no configurado. Faltan EMAIL_USER, EMAIL_PASS o EMAIL_TO.',
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const items = Array.isArray(pedido.items) ? pedido.items : [];

  const itemsText =
    items.length > 0
      ? items
          .map((item) => {
            return `• ${item.titulo ?? 'Obra'} x${
              item.cantidad ?? 1
            } - Bs. ${item.subtotal ?? item.precio ?? 0}`;
          })
          .join('\n')
      : 'Sin items registrados';

  await transporter.sendMail({
    from: `"Crisálida Market" <${emailUser}>`,
    to: emailTo,
    subject: `🛒 Nuevo pedido en Crisálida #${pedido.id ?? ''}`,
    text: `
Nuevo pedido recibido en Crisálida Market

Pedido: #${pedido.id ?? 'Sin ID'}
Cliente: ${pedido.buyerName ?? 'Sin nombre'}
Correo: ${pedido.buyerEmail ?? 'Sin correo'}
Teléfono: ${pedido.buyerPhone ?? 'Sin teléfono'}
Método de pago: ${pedido.metodoPago ?? 'Sin método'}

Obras:
${itemsText}

Total: Bs. ${pedido.total ?? 0}

Nota:
${pedido.buyerNote ?? 'Sin nota'}
    `,
  });
}
