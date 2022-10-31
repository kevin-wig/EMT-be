import { ApiProperty } from '@nestjs/swagger';

export class VesselEtsChartDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  year: number;

  @ApiProperty()
  emission: number;

  @ApiProperty()
  ets: number;

  @ApiProperty()
  name: string;
}
