import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

import { StatusResponseDto } from '../../../shared/dtos/success-response.dto';
import { User } from '../../users/entities/user.entity';

export class AuthDto {
  @IsNotEmpty()
  @ApiProperty()
  token: string;
}

export class ChangePasswordDto extends AuthDto {
  @IsNotEmpty()
  @ApiProperty()
  password: string;
}

export class AccessTokenDto {
  @ApiProperty()
  access_token: string;
}

export class LoginSuccessResponseDto extends AccessTokenDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  otp_sent: string;
}

export class LoginRequestDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsNotEmpty()
  @ApiProperty()
  password: string;
}

export class EmailNotVerifiedDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  isNotActive: true;
}

export class ValidSuccessResponseDto extends StatusResponseDto {
  @ApiProperty()
  user: User;
}
