import { ApiProperty } from '@nestjs/swagger';
import {
  FuelType,
  JourneyType,
  VoyageType,
} from '../../../shared/constants/global.constants';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  validateSync,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  Validate,
  IsArray,
  IsNotEmpty,
  IsString,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UniqueValueValidator } from '../../../shared/validators/unique-value.validator';
import { VesselTrip } from '../entities/vessel-trip.entity';

class GradeDto {
  @Transform((params) => +params.value)
  id: number;

  @IsEnum(FuelType)
  grade: FuelType;

  @Transform((params) => +params.value)
  @IsOptional()
  @IsNumber()
  inboundEu: number;

  @Transform((params) => +params.value)
  @IsOptional()
  @IsNumber()
  outboundEu: number;

  @Transform((params) => +params.value)
  @IsOptional()
  @IsNumber()
  withinEu: number;

  @Transform((params) => +params.value)
  @IsOptional()
  @IsNumber()
  euPort: number;
}

@ValidatorConstraint({ name: 'gradeCheck', async: false })
class ValidateGrade implements ValidatorConstraintInterface {
  validate(grades: any[]) {
    for (let i = 0; i < grades.length; i++) {
      const g = new GradeDto();
      const gradeItem = grades[i];
      Object.entries(gradeItem).forEach(
        (grade) =>
          (g[grade[0]] = isNaN(Number(grade[1])) ? grade[1] : +grade[1]),
      );
      const result = validateSync(g);
      if (result.length > 0) {
        return false;
      }
    }
    return true;
  }

  defaultMessage() {
    return 'Bad input for grades of voyage.';
  }
}

export class CreateVesselTripDto {
  @IsString()
  @ApiProperty()
  voyageId: string;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  vessel: number;

  @IsIn([JourneyType.CII, JourneyType.ETS])
  @ApiProperty()
  journeyType: JourneyType;

  @IsIn([VoyageType.ACTUAL, VoyageType.ARCHIVED, VoyageType.PREDICTED])
  @ApiProperty()
  voyageType: VoyageType;

  @ApiProperty()
  vesselName: string;

  @ApiProperty()
  imo: string;

  @IsDateString()
  @ApiProperty()
  fromDate: string;

  @IsDateString()
  @ApiProperty()
  toDate: string;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  distanceTraveled: number;

  @ApiProperty({ required: false })
  hoursUnderway: string;

  @IsOptional()
  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  mgo: number;

  @IsOptional()
  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  lfo: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  hfo: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  vlsfo: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  vlsfoAD: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  vlsfoEK: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  vlsfoXB: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  lng: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  lpgPp: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  lpgBt: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  bioFuel: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  fuelCost: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  bunkerCost: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  freightCharges: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  freightProfit: number;

  @IsString()
  @ApiProperty()
  originPort: string;

  @IsString()
  @ApiProperty()
  destinationPort: string;

  @IsBoolean()
  @ApiProperty()
  isAggregate: boolean;

  @IsOptional()
  @IsArray()
  @Validate(ValidateGrade)
  @ApiProperty()
  grades: GradeDto[];
}

export class CreateVesselTripUploadDto {
  @IsString()
  @ApiProperty()
  @Validate(UniqueValueValidator, [VesselTrip], { message: 'Voyage ID already exists in the database' })
  voyageId: string;


  @IsIn([JourneyType.CII, JourneyType.ETS])
  @ApiProperty()
  journeyType: JourneyType;

  @IsIn([VoyageType.ACTUAL, VoyageType.ARCHIVED, VoyageType.PREDICTED])
  @ApiProperty()
  voyageType: VoyageType;

  @IsOptional()
  @IsString()
  @ApiProperty()
  vesselName: string;

  @IsString()
  @ApiProperty()
  imo: string;

  @IsDateString()
  @ApiProperty()
  fromDate: string;

  @IsDateString()
  @ApiProperty()
  toDate: string;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  distanceTraveled: number;

  @ApiProperty({ required: false })
  hoursUnderway: string;

  @IsOptional()
  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  mgo: number;

  @IsOptional()
  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  lfo: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  hfo: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  vlsfoAD: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  vlsfoEK: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  vlsfoXB: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  lng: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  bioFuel: number;


  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  bunkerCost: number;

  @Transform((params) => +params.value)
  @IsNumber()
  @ApiProperty()
  freightProfit: number;

  @IsString()
  @ApiProperty()
  originPort: string;

  @IsString()
  @ApiProperty()
  destinationPort: string;

  @IsOptional()
  @IsArray()
  @Validate(ValidateGrade)
  @ApiProperty()
  grades: GradeDto[];
}

export class CreateVesselTripsDto {
  @IsArray()
  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => CreateVesselTripUploadDto)
  vesselTrips: CreateVesselTripUploadDto[];
}