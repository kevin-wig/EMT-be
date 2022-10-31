import { SuccessResponseDto } from '../../../shared/dtos/success-response.dto';

import { VesselTrip } from '../entities/vessel-trip.entity';

export class VesselTripResponseDto extends SuccessResponseDto<VesselTrip> {}

export class VesselTripsResponseDto extends SuccessResponseDto<VesselTrip[]> {}
