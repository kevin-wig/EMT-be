import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class YearQueryDto {
  @ApiProperty()
  @IsOptional()
  @Transform((params) => +params.value)
  @IsNumber()
  year: number;
}
