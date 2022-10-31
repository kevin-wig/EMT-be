import { BasicResponseDto } from './success-response.dto';
import { ValidationError } from '../../exceptions/validation.exception';
import { ApiProperty } from '@nestjs/swagger';

export class FailedResponseDto extends BasicResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  errors?: ValidationError | string;
}
