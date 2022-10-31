import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Port {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  isEu: boolean;
}
