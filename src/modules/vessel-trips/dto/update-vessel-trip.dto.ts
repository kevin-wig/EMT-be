import { PartialType } from '@nestjs/swagger';
import { CreateVesselTripDto } from './create-vessel-trip.dto';

export class UpdateVesselTripDto extends PartialType(CreateVesselTripDto) {}
