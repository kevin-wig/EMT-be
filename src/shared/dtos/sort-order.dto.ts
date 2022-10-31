import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class SortOrderDto {
  @ApiProperty()
  @IsOptional()
  order?: OrderDirection = OrderDirection.DESC;

  @ApiProperty()
  @IsOptional()
  sortBy?: string;
}
