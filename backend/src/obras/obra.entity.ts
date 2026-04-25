import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Artista } from '../Artista/artista.entity';

@Entity()
export class Obra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column('text')
  descripcion: string;

  @Column('decimal')
  precio: number;

  @Column({ nullable: true })
  imagen: string;

  @Column()
  stock: number;

  @ManyToOne(() => Artista, (artista) => artista.obras)
  artista: Artista;
}
