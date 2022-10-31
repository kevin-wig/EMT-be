import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { User } from 'src/modules/users/entities/user.entity';

export class RefreshApiKeyDto {
  @IsNotEmpty()
  @ApiProperty()
  apiKey: string;
}