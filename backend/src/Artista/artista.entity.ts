import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Obra } from '../obras/obra.entity';

@Entity()
export class Artista {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column('text')
  descripcion!: string;

  @Column({ nullable: true })
  foto!: string;

  @Column({ nullable: true })
  fotoUrl!: string;

  @Column({ nullable: true })
  instagram!: string;

  @Column({ nullable: true })
  facebook!: string;

  @Column({ nullable: true })
  tiktok!: string;

  @Column({ nullable: true })
  correo!: string;

  @OneToMany(() => Obra, (obra) => obra.artista)
  obras!: Obra[];
}
