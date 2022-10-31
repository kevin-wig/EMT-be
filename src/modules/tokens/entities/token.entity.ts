import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TokenType } from '../../../shared/constants/global.constants';

@Entity()
export class Token {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  token: string;

  @Column({
    type: 'enum',
    enum: TokenType,
    default: TokenType.DEFAULT,
  })
  type: TokenType;

  @Column({ default: false })
  used: boolean;
}
