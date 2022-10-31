import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Vessel } from './vessel.entity';

@Entity()
export class Ghg {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: number;

  @Column({ type: 'float' })
  required: number;

  @Column({ type: 'float' })
  attained: number;

  @ManyToOne(() => Vessel, (vessel) => vessel.id)
  vessel: number;
}
