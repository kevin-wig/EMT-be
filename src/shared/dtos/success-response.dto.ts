import { PaginationDto } from './pagination.dto';
import { SortOrderDto } from './sort-order.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class BasicPaginationDto {
  pagination?: PaginationDto;

  sortOrder?: SortOrderDto;
}

export class StatusResponseDto {
  @ApiProperty()
  status: 'SUCCESS' | 'ERROR';
}

export class BasicResponseDto extends StatusResponseDto {
  @ApiProperty()
  @IsOptional()
  message: string;
}

export class SuccessResponseDto<T> extends BasicPaginationDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data?: T;
}

export class ListSuccessResponseDto<T> {
  @ApiProperty()
  listData: T[];

  @ApiProperty()
  pagination: PaginationDto;

  @ApiProperty()
  sortOrder: SortOrderDto;
}
