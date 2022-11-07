import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { User } from 'src/modules/users/entities/user.entity';

export class GetCIIDataDto {
  @IsNotEmpty()
  @ApiProperty({ required: true })
  imo: string;

  @IsNotEmpty()
  @ApiProperty()
  vesselType: number;

  @IsOptional()
  @ApiProperty()
  dwt: number[];

  @IsOptional()
  @ApiProperty()
  distanceTravelled: number;

  @IsOptional()
  @ApiProperty()
  mgo: number;

  @IsOptional()
  @ApiProperty()
  lfo: number;

  @IsOptional()
  @ApiProperty()
  hfo: number;

  @IsOptional()
  @ApiProperty()
  vlsfo_ad: number;

  @IsOptional()
  @ApiProperty()
  vlsfo_xb: number;

  @IsOptional()
  @ApiProperty()
  vlsfo_ek: number;

  @IsOptional()
  @ApiProperty()
  lpg_pp: number;

  @IsOptional()
  @ApiProperty()
  lpg_bt: number;

  @IsOptional()
  @ApiProperty()
  bio_fuel: number;

  @IsOptional()
  @ApiProperty({ required: false })
  from_date: Date;

  @IsOptional()
  @ApiProperty({ required: false })
  to_date: Date;
}