import { ApiProperty } from '@nestjs/swagger';

export class VesselCiiChartDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  data: { year: string; cii: number }[];

  @ApiProperty()
  name: string;
}
