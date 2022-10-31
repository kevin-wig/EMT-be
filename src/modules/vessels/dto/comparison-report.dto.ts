import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum ReportType {
  CII = 'cii',
  ETS = 'ets',
  GHG = 'ghg',
}

export class ComparisonReportDto {
  @ApiProperty()
  @IsEnum(ReportType)
  reportType: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  companyIds: string[];;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  fuels: string[];

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Transform((params) => +params.value)
  year: number;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  fleets: string[];;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  vesselIds: string[];;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  vesselAge: number[];

  @ApiProperty()
  @IsOptional()
  @IsArray()
  eedi: number[];

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Transform((params) => +params.value)
  grossTonnage: number;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  dwt: number[];

  @ApiProperty()
  @IsOptional()
  @IsArray()
  vesselWeight: number[];

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  vesselType: number;
}
