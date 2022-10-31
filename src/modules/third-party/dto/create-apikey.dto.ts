import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { User } from 'src/modules/users/entities/user.entity';

export class CreateApiKeyDto {
  @IsNotEmpty()
  @ApiProperty()
  name: string

  @IsOptional()
  @ApiProperty()
  description: string;

  @IsNotEmpty()
  @ApiProperty()
  email: string;
}