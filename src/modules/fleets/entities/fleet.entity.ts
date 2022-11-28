import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Company } from '../../companies/entities/company.entity';
import { Vessel } from '../../vessels/entities/vessel.entity';

@Entity()
export class Fleet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @ManyToOne(() => Company, (company) => company.id, { onDelete: 'CASCADE' })
  company: number;

  @OneToMany(() => Vessel, (vessel) => vessel.fleet)
  vessels: Vessel[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
