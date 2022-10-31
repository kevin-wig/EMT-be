import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsNotEmpty()
  @ApiProperty()
  primaryContactName: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  primaryContactEmailAddress: string;

  @IsNotEmpty()
  @ApiProperty()
  packageType: string;

  @IsNotEmpty()
  @ApiProperty()
  country: string;

  @IsNotEmpty()
  @ApiProperty()
  contactPhoneNumber: string;

  @ApiProperty()
  limitVesselOnboarding: boolean;
}
