import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchVesselDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Transform((params) => +params.value)
  companyId: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  fuel: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  category: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  type: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Transform((params) => +params.value)
  year: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Transform((params) => +params.value)
  fleet: number;

  @ApiProperty()
  @IsOptional()
  vesselAge: number[];

  @ApiProperty()
  @IsOptional()
  eexi: number[];

  @ApiProperty()
  @IsOptional()
  eedi: number[];

  @ApiProperty()
  @IsOptional()
  dwt: number[];

  @ApiProperty()
  @IsOptional()
  grossTonnage: number[];

  @ApiProperty()
  @IsOptional()
  netTonnage: number[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  iceClass: string;

  @ApiProperty()
  @IsOptional()
  propulsionPower: number[];
}
