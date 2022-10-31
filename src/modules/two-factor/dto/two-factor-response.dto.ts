import { ApiProperty } from '@nestjs/swagger';

export class OtpExecuteSuccessResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  isValid: true;
}
