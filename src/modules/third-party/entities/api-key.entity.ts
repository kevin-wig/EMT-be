import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
  } from 'typeorm';
  
  import { User } from '../../users/entities/user.entity';
  
  @Entity()
  export class ApiKey {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    name: string;
  
    @Column()
    description: string;

    @Column()
    apiKey: string;

    @Column()
    email: string;

    @Column('boolean', {default: true})
    isActive: boolean;
  
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    expiresAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  