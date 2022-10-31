import { ApiProperty } from '@nestjs/swagger';

export class VesselCostsChartDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  year: number;

  @ApiProperty()
  totalEuaCost: number;

  @ApiProperty()
  freightProfit: number;

  @ApiProperty()
  bunkerCost: number;
}
