import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Port } from '../../vessels/entities/port.entity';
import { Vessel } from '../../vessels/entities/vessel.entity';
import { JourneyType, VoyageType } from '../../../shared/constants/global.constants';
import { Grade } from './grade.entity';

@Entity()
export class VesselTrip {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Vessel, (vessel) => vessel.id, { onDelete: 'CASCADE' })
  vessel: Vessel;

  @OneToMany(() => Grade, (grade) => grade.journey, { onDelete: 'SET NULL' })
  grades: Grade[];

  @Column()
  fromDate: Date;

  @Column()
  toDate: Date;

  @Column({ type: 'float', nullable: true })
  distanceTraveled: number;

  @Column({ nullable: true })
  hoursUnderway: string;

  @Column({
    type: 'enum',
    enum: JourneyType,
    default: JourneyType.CII,
  })
  journeyType: JourneyType;

  @Column({
    type: 'enum',
    enum: VoyageType,
  })
  voyageType: VoyageType;

  @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
  mgo: number;

  @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
  lfo: number;

  @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
  hfo: number;

  @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
  vlsfo: number;

  @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
  vlsfoAD: number;

  @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
  vlsfoEK: number;

  @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
  vlsfoXB: number;

  @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
  lpgPp: number;

  @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
  lpgBt: number;

  @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
  lng: number;

  @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
  bioFuel: number;

  @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
  fuelCost: number;

  @Column({ type: 'decimal', nullable: true, precision: 20, scale: 10 })
  freightCharges: number;

  @ManyToOne(() => Port, (port) => port.id)
  originPort: Port;

  @ManyToOne(() => Port, (port) => port.id)
  destinationPort: Port;

  @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
  freightProfit: number;

  @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
  bunkerCost: number;

  @Column()
  voyageId: string;

  @Column({ default: false })
  isAggregate: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
