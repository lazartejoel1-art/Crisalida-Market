import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '../pedidos/pedidos.entity';

type MetodoStats = Record<string, number>;

type ObraVendida = {
  obraId: number;
  titulo: string;
  artistaNombre: string;
  cantidadVendida: number;
  totalVendido: number;
  imagenUrl?: string;
};

type ClienteReporte = {
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  cantidadPedidos: number;
  totalComprado: number;
};

type ReporteFiltro = {
  fecha?: string;
  mes?: number;
  anio?: number;
  desde?: string;
  hasta?: string;
};

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidosRepo: Repository<Pedido>,
  ) {}

  async obtenerPedidos(): Promise<Pedido[]> {
    return await this.pedidosRepo.find({
      order: {
        id: 'DESC',
      },
    });
  }

  async ventasTotales(): Promise<{ total: number }> {
    const raw = await this.pedidosRepo
      .createQueryBuilder('pedido')
      .select('COALESCE(SUM(pedido.total), 0)', 'total')
      .getRawOne<{ total: string }>();

    return {
      total: Number(raw?.total ?? 0),
    };
  }

  private filtrarPedidosPorFecha(
    pedidos: Pedido[],
    filtro?: ReporteFiltro,
  ): Pedido[] {
    if (!filtro) return pedidos;

    return pedidos.filter((pedido: Pedido) => {
      if (!pedido.createdAt) return false;

      const fechaPedido = new Date(pedido.createdAt);
      if (Number.isNaN(fechaPedido.getTime())) return false;

      if (filtro.fecha) {
        const fechaObjetivo = new Date(filtro.fecha);
        if (Number.isNaN(fechaObjetivo.getTime())) return false;

        return (
          fechaPedido.getFullYear() === fechaObjetivo.getFullYear() &&
          fechaPedido.getMonth() === fechaObjetivo.getMonth() &&
          fechaPedido.getDate() === fechaObjetivo.getDate()
        );
      }

      if (filtro.mes && filtro.anio) {
        return (
          fechaPedido.getMonth() + 1 === Number(filtro.mes) &&
          fechaPedido.getFullYear() === Number(filtro.anio)
        );
      }

      if (filtro.anio && !filtro.mes) {
        return fechaPedido.getFullYear() === Number(filtro.anio);
      }

      if (filtro.desde || filtro.hasta) {
        const desde = filtro.desde ? new Date(filtro.desde) : null;
        const hasta = filtro.hasta ? new Date(filtro.hasta) : null;

        if (desde && !Number.isNaN(desde.getTime())) {
          desde.setHours(0, 0, 0, 0);
          if (fechaPedido < desde) return false;
        }

        if (hasta && !Number.isNaN(hasta.getTime())) {
          hasta.setHours(23, 59, 59, 999);
          if (fechaPedido > hasta) return false;
        }

        return true;
      }

      return true;
    });
  }

  private obtenerResumenMetodos(pedidos: Pedido[]): MetodoStats {
    return pedidos.reduce((acc: MetodoStats, pedido: Pedido) => {
      const metodo = String(pedido.metodoPago ?? 'OTRO').toUpperCase();
      acc[metodo] = (acc[metodo] ?? 0) + 1;
      return acc;
    }, {} as MetodoStats);
  }

  private obtenerClientes(pedidos: Pedido[]): ClienteReporte[] {
    const mapa = new Map<string, ClienteReporte>();

    pedidos.forEach((pedido: Pedido) => {
      const email = String(pedido.buyerEmail ?? '')
        .trim()
        .toLowerCase();
      const key = `${pedido.buyerName ?? ''}-${email}`;

      if (!mapa.has(key)) {
        mapa.set(key, {
          buyerName: pedido.buyerName ?? 'Cliente',
          buyerEmail: pedido.buyerEmail ?? '',
          buyerPhone: pedido.buyerPhone ?? '',
          cantidadPedidos: 0,
          totalComprado: 0,
        });
      }

      const cliente = mapa.get(key);
      if (!cliente) return;

      cliente.cantidadPedidos += 1;
      cliente.totalComprado += Number(pedido.total ?? 0);
    });

    return [...mapa.values()].sort((a, b) => b.totalComprado - a.totalComprado);
  }

  private obtenerObrasVendidas(pedidos: Pedido[]): ObraVendida[] {
    const mapa = new Map<number, ObraVendida>();

    pedidos.forEach((pedido: Pedido) => {
      const items = Array.isArray(pedido.items) ? pedido.items : [];

      items.forEach((item) => {
        const obraId = Number(item.obraId ?? 0);
        const cantidad = Number(item.cantidad ?? 0);
        const subtotal = Number(item.subtotal ?? 0);

        if (!mapa.has(obraId)) {
          mapa.set(obraId, {
            obraId,
            titulo: item.titulo ?? `Obra #${obraId}`,
            artistaNombre: item.artistaNombre ?? 'Sin artista',
            cantidadVendida: 0,
            totalVendido: 0,
            imagenUrl: item.imagenUrl ?? '',
          });
        }

        const obra = mapa.get(obraId);
        if (!obra) return;

        obra.cantidadVendida += cantidad;
        obra.totalVendido += subtotal;
      });
    });

    return [...mapa.values()].sort(
      (a, b) => b.cantidadVendida - a.cantidadVendida,
    );
  }

  async resumenGeneral(filtro?: ReporteFiltro): Promise<{
    totalPedidos: number;
    totalIngresos: number;
    totalPedidosHoy: number;
    totalIngresosHoy: number;
    totalPedidosFiltrados: number;
    totalIngresosFiltrados: number;
    porMetodo: MetodoStats;
    pedidosRecientes: Pedido[];
    pedidos: Pedido[];
    pedidosFiltrados: Pedido[];
    clientes: ClienteReporte[];
    obrasVendidas: ObraVendida[];
    artistasMasVendidos: ObraVendida[];
    artistasMenosVendidos: ObraVendida[];
  }> {
    const pedidos: Pedido[] = await this.obtenerPedidos();

    const totalPedidos = pedidos.length;

    const totalIngresos = pedidos.reduce((acc: number, pedido: Pedido) => {
      return acc + Number(pedido.total ?? 0);
    }, 0);

    const porMetodo = this.obtenerResumenMetodos(pedidos);
    const pedidosRecientes = pedidos.slice(0, 10);

    const hoy = new Date();

    const inicioHoy = new Date(hoy);
    inicioHoy.setHours(0, 0, 0, 0);

    const finHoy = new Date(hoy);
    finHoy.setHours(23, 59, 59, 999);

    const pedidosHoy = pedidos.filter((pedido: Pedido) => {
      if (!pedido.createdAt) return false;

      const fechaPedido = new Date(pedido.createdAt);
      return fechaPedido >= inicioHoy && fechaPedido <= finHoy;
    });

    const totalPedidosHoy = pedidosHoy.length;

    const totalIngresosHoy = pedidosHoy.reduce(
      (acc: number, pedido: Pedido) => {
        return acc + Number(pedido.total ?? 0);
      },
      0,
    );

    const pedidosFiltrados = this.filtrarPedidosPorFecha(pedidos, filtro);

    const totalPedidosFiltrados = pedidosFiltrados.length;

    const totalIngresosFiltrados = pedidosFiltrados.reduce(
      (acc: number, pedido: Pedido) => {
        return acc + Number(pedido.total ?? 0);
      },
      0,
    );

    const clientes = this.obtenerClientes(pedidosFiltrados);
    const obrasVendidas = this.obtenerObrasVendidas(pedidosFiltrados);

    const artistasMasVendidos = [...obrasVendidas]
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
      .slice(0, 5);

    const artistasMenosVendidos = [...obrasVendidas]
      .sort((a, b) => a.cantidadVendida - b.cantidadVendida)
      .slice(0, 5);

    return {
      totalPedidos,
      totalIngresos,
      totalPedidosHoy,
      totalIngresosHoy,
      totalPedidosFiltrados,
      totalIngresosFiltrados,
      porMetodo,
      pedidosRecientes,
      pedidos,
      pedidosFiltrados,
      clientes,
      obrasVendidas,
      artistasMasVendidos,
      artistasMenosVendidos,
    };
  }
}
