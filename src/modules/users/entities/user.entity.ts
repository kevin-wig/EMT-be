import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';

import { UserRole } from './user-role.entity';
import { Company } from '../../companies/entities/company.entity';
import { AuthMethod } from '../../../shared/constants/global.constants';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isActive: boolean;

  @ManyToOne(() => UserRole, (userRole) => userRole.id)
  userRole: number;

  @Column({
    type: 'enum',
    enum: AuthMethod,
    default: AuthMethod.EMAIL,
  })
  authenticationMethod: AuthMethod;

  @Column({ nullable: true })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
