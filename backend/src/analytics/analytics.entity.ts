import { Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('visitas')
export class Visita {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;
}
