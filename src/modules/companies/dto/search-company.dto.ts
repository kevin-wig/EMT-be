import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchCompanyDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  search?: string;
}
