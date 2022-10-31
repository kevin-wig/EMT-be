import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchUserDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Transform((params) => +params.value)
  companyId?: number;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @Transform((params) => +params.value)
  companyIds?: number[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  search?: string;
}
