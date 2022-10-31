import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { VoyageType } from 'src/shared/constants/global.constants';

export class SearchVesselTripDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  voyageId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  journeyType?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  vesselId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  fromDate: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  toDate: string;

  @ApiProperty()
  @IsOptional()
  @IsNumberString()
  originPort: number;

  @ApiProperty()
  @IsOptional()
  @IsNumberString()
  destinationPort: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  level?: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  voyageType?: VoyageType[];
}
