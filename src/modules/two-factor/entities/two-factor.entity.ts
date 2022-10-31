import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class TwoFactor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  accessCode: string;

  @Column()
  accessType: string;

  @Column()
  user: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
