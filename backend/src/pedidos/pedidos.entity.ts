import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  usuarioId: number;

  @Column({ type: 'decimal', default: 0 })
  total: number;

  @Column({ default: 'pendiente' })
  estado: string;

  @Column()
  buyerName: string;

  @Column()
  buyerEmail: string;

  // ✅ NUEVO: teléfono separado
  @Column({ nullable: true })
  buyerPhone: string;

  @Column({ nullable: true, type: 'text' })
  buyerNote: string;

  @Column({ default: 'QR' })
  metodoPago: string;

  // ✅ NUEVO: si ya pagó
  @Column({ default: false })
  yaPago: boolean;

  // ✅ NUEVO: comprobante
  @Column({ nullable: true, type: 'text' })
  comprobante: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  items: {
    obraId: number;
    cantidad: number;
    titulo?: string;
    precio?: number;
    subtotal?: number;

    // ✅ NUEVO: para mostrar en admin
    imagenUrl?: string;
    artistaNombre?: string;
  }[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
