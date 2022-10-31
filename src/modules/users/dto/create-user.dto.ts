import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

import { AuthMethod } from '../../../shared/constants/global.constants';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsOptional()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  firstname: string;

  @ApiProperty()
  @IsNotEmpty()
  lastname: string;

  @ApiProperty()
  @IsOptional()
  phoneNumber: string;

  @ApiProperty()
  authenticationMethod: AuthMethod;

  @ApiProperty()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty()
  @IsNotEmpty()
  userRole: number;

  @IsOptional()
  isActive: boolean;
}
