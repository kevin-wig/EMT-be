import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTwoFactorDto {
  @ApiProperty()
  @IsNotEmpty()
  accessCode: string;

  @ApiProperty()
  @IsOptional()
  accessType: string;

  @ApiProperty()
  @IsOptional()
  user: number;
}
