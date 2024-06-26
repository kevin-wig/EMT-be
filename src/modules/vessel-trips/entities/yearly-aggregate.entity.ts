import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  import { Vessel } from '../../vessels/entities/vessel.entity';
  import { JourneyType, VoyageType } from '../../../shared/constants/global.constants';
  import { Grade } from './grade.entity';
  
  @Entity()
  export class YearlyAggregate {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => Vessel, (vessel) => vessel.id, { onDelete: 'SET NULL' })
    vessel: Vessel;
  
    @OneToMany(() => Grade, (grade) => grade.journey)
    grades: Grade[];
  
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
  
    @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
    freightProfit: number;
  
    @Column({ type: 'decimal', nullable: true, precision: 25, scale: 10 })
    bunkerCost: number;
  
    @Column()
    voyageId: string;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  