import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ default: true })
  activo!: boolean;
}
