import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailVerificationDto {
  @IsNotEmpty()
  @ApiProperty()
  token: string;
}

export class CreatePasswordDto extends EmailVerificationDto {
  @IsNotEmpty()
  @ApiProperty()
  password: string;
}

export class EmailRequestDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;
}
