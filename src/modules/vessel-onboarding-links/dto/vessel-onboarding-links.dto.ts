import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class VesselOnboardingLinksDto {
  @IsNumber()
  @ApiProperty()
  @IsNotEmpty()
  company_id: number;

  @IsNotEmpty()
  @ApiProperty()
  imo: string;
}
