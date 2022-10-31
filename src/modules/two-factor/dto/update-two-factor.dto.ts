import { PartialType } from '@nestjs/swagger';

import { CreateTwoFactorDto } from './create-two-factor.dto';

export class UpdateTwoFactorDto extends PartialType(CreateTwoFactorDto) {}
