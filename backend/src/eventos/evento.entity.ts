import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ArtistaInvitadoEvento = {
  nombre: string;
  especialidad?: string;
  descripcion?: string;
  imagenUrl?: string;
};

@Entity()
export class Evento {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  titulo!: string;

  @Column('text', { nullable: true })
  descripcion!: string;

  @Column({ nullable: true })
  fecha!: string;

  @Column({ nullable: true })
  lugar!: string;

  @Column({ nullable: true })
  flyer!: string;

  @Column({ nullable: true })
  flyerUrl!: string;

  @Column('jsonb', { nullable: true })
  artistasInvitados!: ArtistaInvitadoEvento[];

  @Column({ default: true })
  activo!: boolean;
}
