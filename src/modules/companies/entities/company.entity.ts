import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Vessel } from '../../vessels/entities/vessel.entity';
import { Fleet } from '../../fleets/entities/fleet.entity';
import { VesselOnboardingLinks } from 'src/modules/vessel-onboarding-links/entities/vessel-onboarding-links.entity';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  primaryContactName: string;

  @Column({ unique: true })
  primaryContactEmailAddress: string;

  @Column({ nullable: true })
  contactPhoneNumber: string;

  @Column()
  packageType: string;

  @Column()
  country: string;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => Vessel, (vessel) => vessel.company)
  vessels: Vessel[];

  @OneToMany(() => Fleet, (fleet) => fleet.company)
  fleets: Fleet[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  limitVesselOnboarding: boolean;

  @OneToMany(() => VesselOnboardingLinks, (vesselOnboardingLinks) => vesselOnboardingLinks.company)
  vesselOnboardingLinks: VesselOnboardingLinks[];
}
