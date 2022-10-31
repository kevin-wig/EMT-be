import {
  ListSuccessResponseDto,
  SuccessResponseDto,
} from '../../../shared/dtos/success-response.dto';
import { Fleet } from '../entities/fleet.entity';

export class SuccessFleetResponseDto extends SuccessResponseDto<Fleet> {}

export class AllFleetResponseDto extends SuccessResponseDto<Fleet[]> {}

export class FleetsListDto extends ListSuccessResponseDto<Fleet> {}
