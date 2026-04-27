import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Pedido } from './pedidos.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { Obra } from '../obras/obra.entity';
import { sendPedidoEmail } from '../mail/mail.service';

type PedidoItemCalculado = {
  obraId: number;
  cantidad: number;
  titulo?: string;
  precio?: number;
  subtotal?: number;
  imagenUrl?: string;
  artistaNombre?: string;
};

function cleanImageUrl(image?: string | null): string {
  if (!image) return '';

  let value = String(image).trim();

  if (!value) return '';

  if (value.startsWith('/uploads/https://')) {
    value = value.replace('/uploads/', '');
  }

  if (value.startsWith('uploads/https://')) {
    value = value.replace('uploads/', '');
  }

  if (value.startsWith('/uploads/http://')) {
    value = value.replace('/uploads/', '');
  }

  if (value.startsWith('uploads/http://')) {
    value = value.replace('uploads/', '');
  }

  return value;
}

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,

    @InjectRepository(Obra)
    private readonly obraRepository: Repository<Obra>,
  ) {}

  private async enriquecerPedidosConImagenes(
    pedidos: Pedido[],
  ): Promise<Pedido[]> {
    const obraIds = pedidos
      .flatMap((pedido) => {
        const items = Array.isArray(pedido.items) ? pedido.items : [];
        return items.map((item) => Number(item.obraId));
      })
      .filter((id) => !Number.isNaN(id) && id > 0);

    const obraIdsUnicos = [...new Set(obraIds)];

    if (obraIdsUnicos.length === 0) {
      return pedidos;
    }

    const obras = await this.obraRepository.find({
      where: {
        id: In(obraIdsUnicos),
      },
      relations: ['artista'],
    });

    const obrasMap = new Map<number, Obra>(
      obras.map((obra) => [Number(obra.id), obra]),
    );

    return pedidos.map((pedido) => {
      const items = Array.isArray(pedido.items) ? pedido.items : [];

      return {
        ...pedido,
        items: items.map((item) => {
          const obra = obrasMap.get(Number(item.obraId));

          const imageValue = cleanImageUrl(
            item.imagenUrl || obra?.imagenUrl || obra?.imagen,
          );

          return {
            ...item,
            titulo: item.titulo || obra?.titulo || `Obra #${item.obraId}`,
            imagenUrl: imageValue,
            artistaNombre: item.artistaNombre || obra?.artista?.nombre || '',
          };
        }),
      };
    });
  }

  async obtenerTodos(): Promise<Pedido[]> {
    const pedidos = await this.pedidoRepository.find({
      order: {
        id: 'DESC',
      },
    });

    return this.enriquecerPedidosConImagenes(pedidos);
  }

  async obtenerPorId(id: number): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id },
    });

    if (!pedido) {
      throw new NotFoundException(`No se encontró el pedido con id ${id}`);
    }

    const pedidos = await this.enriquecerPedidosConImagenes([pedido]);

    return pedidos[0];
  }

  async crear(data: CreatePedidoDto): Promise<Pedido> {
    const itemsEntrada = Array.isArray(data.items) ? data.items : [];

    const obraIds = itemsEntrada
      .map((item) => Number(item.obraId))
      .filter((id) => !Number.isNaN(id) && id > 0);

    const obras = await this.obraRepository.find({
      where: {
        id: In(obraIds),
      },
      relations: ['artista'],
    });

    const obrasMap = new Map<number, Obra>(
      obras.map((obra) => [Number(obra.id), obra]),
    );

    const itemsCalculados: PedidoItemCalculado[] = itemsEntrada.map((item) => {
      const obra = obrasMap.get(Number(item.obraId));
      const precio = Number(obra?.precio ?? 0);
      const cantidad = Number(item.cantidad ?? 0);
      const subtotal = precio * cantidad;
      const imageValue = cleanImageUrl(obra?.imagenUrl || obra?.imagen);

      const artistaNombre =
        obra?.artista && typeof obra.artista.nombre === 'string'
          ? obra.artista.nombre
          : '';

      return {
        obraId: Number(item.obraId),
        cantidad,
        titulo: obra?.titulo ?? 'Obra',
        precio,
        subtotal,
        imagenUrl: imageValue,
        artistaNombre,
      };
    });

    const totalCalculado = itemsCalculados.reduce((acc, item) => {
      return acc + Number(item.subtotal ?? 0);
    }, 0);

    const pedido = this.pedidoRepository.create({
      buyerName: data.buyerName,
      buyerEmail: data.buyerEmail,
      buyerPhone: data.buyerPhone ?? '',
      buyerNote: data.buyerNote ?? '',
      metodoPago: data.metodoPago,
      items: itemsCalculados,
      usuarioId: data.usuarioId,
      total: totalCalculado,
      estado: 'pendiente',
      yaPago: data.yaPago ?? false,
      comprobante: data.comprobante ?? '',
    });

    const savedPedido = await this.pedidoRepository.save(pedido);

    void sendPedidoEmail(savedPedido).catch((error) => {
      console.error('Error enviando email de pedido:', error);
    });

    return savedPedido;
  }

  async actualizarEstado(id: number, estado: string): Promise<Pedido> {
    const estadosPermitidos = ['pendiente', 'pagado', 'entregado', 'cancelado'];
    const estadoNormalizado = estado.trim().toLowerCase();

    if (!estadosPermitidos.includes(estadoNormalizado)) {
      throw new BadRequestException(
        `Estado no válido. Usa uno de estos: ${estadosPermitidos.join(', ')}`,
      );
    }

    const pedido = await this.pedidoRepository.findOne({
      where: { id },
    });

    if (!pedido) {
      throw new NotFoundException(`No se encontró el pedido con id ${id}`);
    }

    pedido.estado = estadoNormalizado;

    return await this.pedidoRepository.save(pedido);
  }

  async reportarPago(
    id: number,
    data: { yaPago?: boolean; comprobante?: string },
  ): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id },
    });

    if (!pedido) {
      throw new NotFoundException(`No se encontró el pedido con id ${id}`);
    }

    pedido.yaPago = data.yaPago ?? true;
    pedido.comprobante = data.comprobante ?? pedido.comprobante ?? '';

    return await this.pedidoRepository.save(pedido);
  }

  async vaciarPedidos(): Promise<{ message: string }> {
    const tableName = this.pedidoRepository.metadata.tablePath;

    await this.pedidoRepository.query(
      `TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`,
    );

    return {
      message: 'Pedidos vaciados correctamente',
    };
  }
}
