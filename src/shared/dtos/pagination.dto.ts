import { Transform } from 'class-transformer';
import { transformLimit, transformPage } from '../dto-property.transformer';
import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationParamsDto {
  @ApiProperty()
  @IsOptional()
  @Transform((params) => transformPage(params.value))
  page?: number = 1;

  @ApiProperty()
  @IsOptional()
  @Transform((params) => transformLimit(params.value))
  limit?: number = 5;
}

export class PaginationDto extends PaginationParamsDto {
  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  totalCount: number;
}
