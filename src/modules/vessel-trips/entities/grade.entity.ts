import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { FuelType } from '../../../shared/constants/global.constants';
import { VesselTrip } from './vessel-trip.entity';

@Entity()
export class Grade {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => VesselTrip, (trip) => trip.id, { onDelete: 'CASCADE' })
  journey: VesselTrip;

  @Column({
    type: 'enum',
    enum: FuelType,
  })
  grade: FuelType;

  @Column({ type: 'float', nullable: true })
  inboundEu: number;

  @Column({ type: 'float', nullable: true })
  outboundEu: number;

  @Column({ type: 'float', nullable: true })
  withinEu: number;

  @Column({ type: 'float', nullable: true })
  euPort: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
