import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import { ReportesService } from './reportes.service';

type PedidoReporte = {
  id: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerNote?: string;
  metodoPago?: string;
  total: number | string;
  estado?: string;
  createdAt?: string | Date;
  items?: Array<{
    obraId: number;
    cantidad: number;
    titulo?: string;
    precio?: number;
    subtotal?: number;
    imagenUrl?: string;
    artistaNombre?: string;
  }>;
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
  imagenUrl?: string;
};

type ResumenReporte = {
  totalPedidos: number;
  totalIngresos: number;
  totalPedidosHoy: number;
  totalIngresosHoy: number;
  totalPedidosFiltrados: number;
  totalIngresosFiltrados: number;
  porMetodo: Record<string, number>;
  pedidosRecientes: PedidoReporte[];
  pedidos: PedidoReporte[];
  pedidosFiltrados: PedidoReporte[];
  clientes: ClienteReporte[];
  obrasVendidas: ObraVendida[];
  artistasMasVendidos: ObraVendida[];
  artistasMenosVendidos: ObraVendida[];
};

type PdfDocumentLike = {
  y: number;
  pipe: (target: Response) => void;
  image: (
    src: string,
    x: number,
    y: number,
    options?: { width?: number; height?: number },
  ) => PdfDocumentLike;
  fontSize: (size: number) => PdfDocumentLike;
  font: (name: string) => PdfDocumentLike;
  text: (
    text: string,
    xOrOptions?:
      | number
      | {
          align?: 'left' | 'center' | 'right' | 'justify';
          width?: number;
        },
    y?: number,
    options?: {
      align?: 'left' | 'center' | 'right' | 'justify';
      width?: number;
    },
  ) => PdfDocumentLike;
  moveDown: (lines?: number) => PdfDocumentLike;
  addPage: () => PdfDocumentLike;
  end: () => void;
  rect: (
    x: number,
    y: number,
    width: number,
    height: number,
  ) => PdfDocumentLike;
  stroke: () => PdfDocumentLike;
  moveTo: (x: number, y: number) => PdfDocumentLike;
  lineTo: (x: number, y: number) => PdfDocumentLike;
  fillColor: (color: string) => PdfDocumentLike;
  strokeColor: (color: string) => PdfDocumentLike;
  lineWidth: (width: number) => PdfDocumentLike;
};

type PdfDocumentConstructor = new (options: {
  size: string;
  margin: number;
}) => PdfDocumentLike;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as PdfDocumentConstructor;

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get()
  async obtenerResumen(
    @Query('fecha') fecha?: string,
    @Query('mes') mes?: string,
    @Query('anio') anio?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ): Promise<ResumenReporte> {
    return (await this.reportesService.resumenGeneral({
      fecha,
      mes: mes ? Number(mes) : undefined,
      anio: anio ? Number(anio) : undefined,
      desde,
      hasta,
    })) as ResumenReporte;
  }

  @Get('obras/pdf')
  async generarReportePdf(
    @Res() res: Response,
    @Query('fecha') fecha?: string,
    @Query('mes') mes?: string,
    @Query('anio') anio?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ): Promise<void> {
    const resumen = (await this.reportesService.resumenGeneral({
      fecha,
      mes: mes ? Number(mes) : undefined,
      anio: anio ? Number(anio) : undefined,
      desde,
      hasta,
    })) as ResumenReporte;

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="reporte-crisalida.pdf"',
    );

    doc.pipe(res);

    const logoPath = join(process.cwd(), 'uploads', 'logo-crisalida.png');

    if (existsSync(logoPath)) {
      doc.image(logoPath, 470, 30, { width: 70 });
    }

    const periodoTexto = this.obtenerTextoPeriodo({
      fecha,
      mes: mes ? Number(mes) : undefined,
      anio: anio ? Number(anio) : undefined,
      desde,
      hasta,
    });

    doc
      .font('Times-Bold')
      .fontSize(18)
      .text('REPORTE GENERAL DE VENTAS - CRISÁLIDA', 50, 40, {
        width: 380,
      });

    doc
      .moveDown(0.3)
      .font('Times-Roman')
      .fontSize(12)
      .text(`Fecha de generación: ${new Date().toLocaleString()}`, 50)
      .text(`Periodo consultado: ${periodoTexto}`, 50);

    doc.moveDown(1);

    this.dibujarTituloSeccion(doc, '1. Resumen general');
    doc
      .font('Times-Roman')
      .fontSize(12)
      .text(`Pedidos totales del sistema: ${resumen.totalPedidos}`)
      .text(
        `Ingresos totales del sistema: Bs. ${Number(resumen.totalIngresos).toFixed(2)}`,
      )
      .text(`Pedidos del periodo filtrado: ${resumen.totalPedidosFiltrados}`)
      .text(
        `Ingresos del periodo filtrado: Bs. ${Number(
          resumen.totalIngresosFiltrados,
        ).toFixed(2)}`,
      )
      .text(`Pedidos de hoy: ${resumen.totalPedidosHoy}`)
      .text(
        `Ingresos de hoy: Bs. ${Number(resumen.totalIngresosHoy).toFixed(2)}`,
      );

    doc.moveDown(1);

    this.dibujarTituloSeccion(doc, '2. Pedidos por método de pago');
    const metodos = Object.entries(resumen.porMetodo);

    if (metodos.length === 0) {
      doc
        .font('Times-Roman')
        .fontSize(12)
        .text('No existen pedidos registrados.');
    } else {
      metodos.forEach(([metodo, cantidad]) => {
        doc
          .font('Times-Roman')
          .fontSize(12)
          .text(`${metodo}: ${cantidad} pedido(s)`);
      });
    }

    doc.moveDown(1);

    this.dibujarTituloSeccion(doc, '3. Clientes que realizaron pedidos');
    if (resumen.clientes.length === 0) {
      doc
        .font('Times-Roman')
        .fontSize(12)
        .text('No hay clientes en el periodo seleccionado.');
    } else {
      resumen.clientes.slice(0, 15).forEach((cliente, index) => {
        doc
          .font('Times-Bold')
          .fontSize(12)
          .text(`${index + 1}. ${cliente.buyerName}`);
        doc
          .font('Times-Roman')
          .fontSize(12)
          .text(`Correo: ${cliente.buyerEmail}`)
          .text(`Teléfono: ${cliente.buyerPhone ?? 'No registrado'}`)
          .text(`Cantidad de pedidos: ${cliente.cantidadPedidos}`)
          .text(
            `Total comprado: Bs. ${Number(cliente.totalComprado).toFixed(2)}`,
          );
        doc.moveDown(0.5);

        if (doc.y > 700) {
          doc.addPage();
        }
      });
    }

    doc.moveDown(0.5);

    this.dibujarTituloSeccion(doc, '4. Obras vendidas');
    if (resumen.obrasVendidas.length === 0) {
      doc
        .font('Times-Roman')
        .fontSize(12)
        .text('No existen obras vendidas en el periodo.');
    } else {
      resumen.obrasVendidas.slice(0, 20).forEach((obra, index) => {
        if (doc.y > 680) {
          doc.addPage();
        }

        const yInicial = doc.y;
        const imagenPath = obra.imagenUrl
          ? join(
              process.cwd(),
              obra.imagenUrl.replace(/^\/uploads\//, 'uploads/'),
            )
          : '';

        if (obra.imagenUrl && existsSync(imagenPath)) {
          doc.image(imagenPath, 50, yInicial, { width: 55, height: 55 });
        } else {
          doc.rect(50, yInicial, 55, 55).stroke();
          doc
            .font('Times-Roman')
            .fontSize(9)
            .text('Sin imagen', 58, yInicial + 22);
        }

        doc
          .font('Times-Bold')
          .fontSize(12)
          .text(`${index + 1}. ${obra.titulo}`, 115, yInicial)
          .font('Times-Roman')
          .fontSize(12)
          .text(`Artista: ${obra.artistaNombre}`, 115)
          .text(`Cantidad vendida: ${obra.cantidadVendida}`, 115)
          .text(
            `Total vendido: Bs. ${Number(obra.totalVendido).toFixed(2)}`,
            115,
          );

        doc.moveDown(1.2);
      });
    }

    if (doc.y > 650) {
      doc.addPage();
    }

    doc.moveDown(0.5);

    this.dibujarTituloSeccion(doc, '5. Artistas con mayor movimiento');
    if (resumen.artistasMasVendidos.length === 0) {
      doc
        .font('Times-Roman')
        .fontSize(12)
        .text('No existen datos suficientes.');
    } else {
      resumen.artistasMasVendidos.forEach((obra, index) => {
        doc
          .font('Times-Roman')
          .fontSize(12)
          .text(
            `${index + 1}. ${obra.artistaNombre} - ${obra.titulo} (${obra.cantidadVendida} venta(s))`,
          );
      });
    }

    doc.moveDown(1);

    this.dibujarTituloSeccion(doc, '6. Artistas con menor movimiento');
    if (resumen.artistasMenosVendidos.length === 0) {
      doc
        .font('Times-Roman')
        .fontSize(12)
        .text('No existen datos suficientes.');
    } else {
      resumen.artistasMenosVendidos.forEach((obra, index) => {
        doc
          .font('Times-Roman')
          .fontSize(12)
          .text(
            `${index + 1}. ${obra.artistaNombre} - ${obra.titulo} (${obra.cantidadVendida} venta(s))`,
          );
      });
    }

    doc.moveDown(1);

    this.dibujarTituloSeccion(doc, '7. Detalle de pedidos del periodo');
    if (resumen.pedidosFiltrados.length === 0) {
      doc
        .font('Times-Roman')
        .fontSize(12)
        .text('No existen pedidos para el filtro seleccionado.');
    } else {
      resumen.pedidosFiltrados.slice(0, 25).forEach((pedido, index) => {
        if (doc.y > 690) {
          doc.addPage();
        }

        const itemsCount = Array.isArray(pedido.items)
          ? pedido.items.length
          : 0;
        const buyerNote =
          pedido.buyerNote && pedido.buyerNote.trim().length > 0
            ? pedido.buyerNote
            : 'Sin nota';

        doc
          .font('Times-Bold')
          .fontSize(12)
          .text(`${index + 1}. Pedido #${pedido.id} - ${pedido.buyerName}`);

        doc
          .font('Times-Roman')
          .fontSize(12)
          .text(`Correo: ${pedido.buyerEmail}`)
          .text(`Teléfono: ${pedido.buyerPhone ?? 'No registrado'}`)
          .text(`Método de pago: ${pedido.metodoPago ?? 'No especificado'}`)
          .text(`Estado: ${pedido.estado ?? 'pendiente'}`)
          .text(
            `Fecha: ${pedido.createdAt ? new Date(pedido.createdAt).toLocaleString() : 'Sin fecha'}`,
          )
          .text(`Cantidad de items: ${itemsCount}`)
          .text(`Total: Bs. ${Number(pedido.total ?? 0).toFixed(2)}`)
          .text(`Nota: ${buyerNote}`);

        doc.moveDown(0.6);
      });
    }

    doc.moveDown(1);

    this.dibujarTituloSeccion(doc, '8. Observación general');
    doc
      .font('Times-Roman')
      .fontSize(12)
      .text(
        'El presente reporte consolida la actividad comercial registrada en Crisálida dentro del periodo seleccionado. Incluye información de clientes, pedidos, ingresos, obras vendidas y comportamiento de ventas por artista, sirviendo como apoyo para control administrativo, seguimiento comercial y toma de decisiones.',
        { align: 'justify' },
      );

    doc.moveDown(2);

    doc
      .font('Times-Italic')
      .fontSize(10)
      .text('Crisálida · Reporte generado automáticamente por el sistema.', {
        align: 'center',
      });

    doc.end();
  }

  private dibujarTituloSeccion(doc: PdfDocumentLike, titulo: string): void {
    doc.font('Times-Bold').fontSize(14).text(titulo);
    doc.moveDown(0.4);
  }

  private obtenerTextoPeriodo(filtro: {
    fecha?: string;
    mes?: number;
    anio?: number;
    desde?: string;
    hasta?: string;
  }): string {
    if (filtro.fecha) {
      return `Día ${filtro.fecha}`;
    }

    if (filtro.mes && filtro.anio) {
      return `Mes ${filtro.mes} del año ${filtro.anio}`;
    }

    if (filtro.anio && !filtro.mes) {
      return `Año ${filtro.anio}`;
    }

    if (filtro.desde || filtro.hasta) {
      return `Desde ${filtro.desde ?? 'inicio'} hasta ${filtro.hasta ?? 'hoy'}`;
    }

    return 'General';
  }
}
