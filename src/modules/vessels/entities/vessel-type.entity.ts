import { Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Vessel } from './vessel.entity';

@Entity()
export class VesselType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  vessel_type: string;

  @OneToMany(() => Vessel, (vessel) => vessel.vesselType)
  vessels: Vessel[];
}
