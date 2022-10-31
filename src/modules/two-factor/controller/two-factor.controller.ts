import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { TwoFactorService } from '../services/two-factor.service';
import { CreateTwoFactorDto } from '../dto/create-two-factor.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IRequest } from '../../auth/auth.types';
import { SuccessResponseDto } from '../../../shared/dtos/success-response.dto';
import { FailedResponseDto } from '../../../shared/dtos/failed-response.dto';
import { SUCCESS } from '../../../shared/constants/message.constants';
import { OtpExecuteSuccessResponseDto } from '../dto/two-factor-response.dto';

@ApiTags('two-factor')
@Controller('two-factor')
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  insert(createTwoFactorDto: CreateTwoFactorDto) {
    return this.twoFactorService.create(createTwoFactorDto);
  }

  @Post()
  @ApiOperation({
    description: 'The route used to create OTP access code',
  })
  @ApiBody({ type: CreateTwoFactorDto })
  @ApiResponse({ status: 201, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async create(@Body() createTwoFactorDto: CreateTwoFactorDto) {
    const res = await this.twoFactorService.create(createTwoFactorDto);

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Post(':action')
  @ApiOperation({
    description: 'The route used to execute two factor service',
  })
  @ApiBody({ type: CreateTwoFactorDto })
  @ApiResponse({ status: 201, type: OtpExecuteSuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @UseGuards(JwtAuthGuard)
  execute(
    @Body() createTwoFactorDto: CreateTwoFactorDto,
    @Param('action') action: string,
    @Req() req: IRequest,
  ) {
    const user = req.user;
    return this.twoFactorService.execute(createTwoFactorDto, action, user);
  }
}
