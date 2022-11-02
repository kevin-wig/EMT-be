import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { VoyageType } from '../constants/global.constants';

export class ChartsQueryDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  mode: string;

  @ApiProperty()
  @IsOptional()
  @Transform((params) => +params.value)
  @IsNumber()
  year: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Transform((params) => +params.value)
  month: number;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Transform((params) => !!params.value)
  isVoyage: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fromDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  toDate: string;


  @ApiProperty()
  @IsOptional()
  @IsArray()
  voyageType?: VoyageType[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  type?: string;
}
