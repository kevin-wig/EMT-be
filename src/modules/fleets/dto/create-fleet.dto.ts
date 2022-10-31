import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { Vessel } from '../../vessels/entities/vessel.entity';

export class CreateFleetDto {
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsNotEmpty()
  @ApiProperty()
  company: number;

  @IsNotEmpty()
  @ApiProperty()
  vessels: number[];
}
