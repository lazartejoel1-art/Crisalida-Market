import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Carrito {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  usuarioId: number;

  @Column()
  obraId: number;

  @Column()
  cantidad: number;
}
