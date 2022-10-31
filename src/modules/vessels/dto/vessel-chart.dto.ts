import { ApiProperty } from '@nestjs/swagger';

export class VesselChartDto<T> {
  @ApiProperty()
  id: number;

  @ApiProperty()
  data: T[];

  @ApiProperty()
  name: string;
}
