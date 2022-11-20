import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateVesselDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsNotEmpty()
  @ApiProperty()
  imo: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  companyId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  fleet: number;

  @IsNotEmpty()
  @ApiProperty()
  dwt: number;

  @IsNotEmpty()
  @ApiProperty()
  netTonnage: number;

  @IsNotEmpty()
  @IsOptional()
  @ApiProperty()
  grossTonnage: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  vesselTypeId: number;

  @IsNotEmpty()
  @ApiProperty()
  iceClass: string;

  @IsNotEmpty()
  @ApiProperty()
  propulsionPower: number;

  @IsString()
  @IsOptional()
  @ApiProperty()
  dateOfBuilt: string;

  @IsOptional()
  @ApiProperty()
  eedi: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  eexi: number;

  @IsOptional()
  @ApiProperty()
  fleetName: string;

  @IsOptional()
  @ApiProperty()
  vesselTypeName: string;
}
