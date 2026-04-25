import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Obra } from '../obras/obra.entity';

@Entity()
export class Artista {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column('text')
  descripcion: string;

  @Column({ nullable: true })
  foto: string;

  @OneToMany(() => Obra, (obra) => obra.artista)
  obras: Obra[];
}
