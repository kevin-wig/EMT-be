import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { TokenType } from '../../../shared/constants/global.constants';

export class CreateTokenDto {
  @IsNotEmpty()
  @ApiProperty()
  token: string;

  @IsNotEmpty()
  @ApiProperty({ enum: TokenType })
  type: TokenType;
}
