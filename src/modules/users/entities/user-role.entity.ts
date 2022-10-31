import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

import { User } from './user.entity';

@Entity()
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  role: string;

  @OneToMany(() => User, (user) => user.userRole)
  user: User[];
}
