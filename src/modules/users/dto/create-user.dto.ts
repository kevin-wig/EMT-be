import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';

import { AuthMethod } from '../../../shared/constants/global.constants';

export class EmailDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class CreateUserDto extends EmailDto {
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
  @ValidateIf((dto) => dto.userRole !== 1)
  @IsNotEmpty()
  companyId: number;

  @ApiProperty()
  @IsNotEmpty()
  userRole: number;

  @IsOptional()
  isActive: boolean;
}
