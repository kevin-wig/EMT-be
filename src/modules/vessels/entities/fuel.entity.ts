import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Fuel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'float' })
  factor: number;
}
