import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Company } from '../../companies/entities/company.entity';
import { Fleet } from '../../fleets/entities/fleet.entity';
import { VesselTrip } from '../../vessel-trips/entities/vessel-trip.entity';
import { VesselType } from './vessel-type.entity';

@Entity()
export class Vessel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  imo: string;

  @Column({ nullable: true })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ nullable: true })
  vesselTypeId: number;

  @ManyToOne(() => VesselType, (vesselType) => vesselType.id, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'vessel_type_id' })
  vesselType: VesselType;

  @ManyToOne(() => Fleet, (fleet) => fleet.id, { onDelete: 'SET NULL' })
  fleet: number;

  @OneToMany(() => VesselTrip, (trip) => trip.vessel)
  trip: VesselTrip[];

  @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
  dwt: number;

  @Column({ nullable: true })
  netTonnage: number;

  @Column({ nullable: true })
  grossTonnage: number;

  @Column({ nullable: true })
  iceClass: string;

  @Column({ nullable: true })
  powerOutput: number;

  @Column({ nullable: true })
  propulsionPower: number;

  @Column({ nullable: true })
  dateOfBuilt: Date;

  @Column({ nullable: true })
  eedi: number;

  @Column({ nullable: true })
  eexi: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
