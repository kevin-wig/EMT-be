import { Company } from 'src/modules/companies/entities/company.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class VesselOnboardingLinks {
  @PrimaryGeneratedColumn('uuid')
  link_id: string;

  @Column({ nullable: true })
  company_id: number;
  @ManyToOne(() => Company, (company) => company.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column()
  imo: string;
}
