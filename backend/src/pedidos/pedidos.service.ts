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

type PedidoItemCalculado = {
  obraId: number;
  cantidad: number;
  titulo?: string;
  precio?: number;
  subtotal?: number;
  imagenUrl?: string;
  artistaNombre?: string;
};

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,

    @InjectRepository(Obra)
    private readonly obraRepository: Repository<Obra>,
  ) {}

  async obtenerTodos(): Promise<Pedido[]> {
    return await this.pedidoRepository.find({
      order: {
        id: 'DESC',
      },
    });
  }

  async obtenerPorId(id: number): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id },
    });

    if (!pedido) {
      throw new NotFoundException(`No se encontró el pedido con id ${id}`);
    }

    return pedido;
  }

  async crear(data: CreatePedidoDto): Promise<Pedido> {
    const itemsEntrada = Array.isArray(data.items) ? data.items : [];

    const obraIds = itemsEntrada
      .map((item) => Number(item.obraId))
      .filter((id) => !Number.isNaN(id));

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

      let imagenUrl = '';
      if (obra?.imagen && String(obra.imagen).trim().length > 0) {
        imagenUrl = String(obra.imagen).startsWith('/uploads/')
          ? String(obra.imagen)
          : `/uploads/${String(obra.imagen)}`;
      }

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
        imagenUrl,
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

    return await this.pedidoRepository.save(pedido);
  }

  async actualizarEstado(id: number, estado: string): Promise<Pedido> {
    const estadosPermitidos = ['pendiente', 'pagado', 'entregado', 'cancelado'];

    const estadoNormalizado = estado.trim().toLowerCase();

    if (!estadosPermitidos.includes(estadoNormalizado)) {
      throw new BadRequestException(
        `Estado no válido. Usa uno de estos: ${estadosPermitidos.join(', ')}`,
      );
    }

    const pedido = await this.obtenerPorId(id);
    pedido.estado = estadoNormalizado;

    return await this.pedidoRepository.save(pedido);
  }

  async reportarPago(
    id: number,
    data: { yaPago?: boolean; comprobante?: string },
  ): Promise<Pedido> {
    const pedido = await this.obtenerPorId(id);

    pedido.yaPago = data.yaPago ?? true;
    pedido.comprobante = data.comprobante ?? pedido.comprobante ?? '';

    return await this.pedidoRepository.save(pedido);
  }
}
