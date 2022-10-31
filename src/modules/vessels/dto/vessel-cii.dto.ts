import { ApiProperty } from '@nestjs/swagger';

export class VesselCiiDto {
  @ApiProperty()
  bunkerCost: number;

  @ApiProperty()
  category: 'A' | 'B' | 'C' | 'D';

  @ApiProperty()
  cii: number;

  @ApiProperty()
  cii2019: number;

  @ApiProperty()
  ciiDifference: number;

  @ApiProperty()
  ciiRate: number;

  @ApiProperty()
  company: string;

  @ApiProperty()
  companyId: number;

  @ApiProperty()
  distanceTraveled: number;

  @ApiProperty()
  emissions: number;

  @ApiProperty()
  fleet: string;

  @ApiProperty()
  fleetId: number;

  @ApiProperty()
  id: number;

  @ApiProperty()
  imo: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  requiredCII: number;

  @ApiProperty()
  year: null;
}
