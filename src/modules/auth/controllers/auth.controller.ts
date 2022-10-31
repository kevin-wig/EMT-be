import {
  Controller,
  Request,
  Post,
  UseGuards,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as Req } from 'express';

import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthService } from '../services/auth.service';
import { IAuthGuardRequest } from '../auth.types';
import {
  AccessTokenDto,
  ChangePasswordDto,
  EmailNotVerifiedDto,
  LoginRequestDto,
  LoginSuccessResponseDto,
  ValidSuccessResponseDto,
} from '../dto/auth.dto';
import {
  CreatePasswordDto,
  EmailVerificationDto,
  EmailRequestDto,
} from '../dto/email-verification.dto';
import { FailedResponseDto } from '../../../shared/dtos/failed-response.dto';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { BasicResponseDto } from '../../../shared/dtos/success-response.dto';
import {
  ERROR,
  FAILED_CHANGE_PASSWORD,
  RECEIVE_MESSAGE,
  SUCCESS,
} from '../../../shared/constants/message.constants';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @ApiOperation({ description: 'The route used by user to log in' })
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({ status: 200, type: LoginSuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @ApiResponse({ status: 403, type: EmailNotVerifiedDto })
  @Post('login')
  async login(
    @Body() data: LoginRequestDto,
    @Request() req: IAuthGuardRequest,
  ) {
    return this.authService.login(req.user);
  }

  @Post('register')
  @ApiOperation({ description: 'The route used by new user to register' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 200, type: AccessTokenDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async register(@Request() req: Req) {
    return this.authService.register(req.body);
  }

  @Post('forgot-password')
  @ApiOperation({
    description: 'The route used by user when he or she forgot password',
  })
  @ApiBody({ type: EmailRequestDto })
  @ApiResponse({ status: 201, type: BasicResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async forgotPassword(@Body() emailRequestDto: EmailRequestDto) {
    await this.authService.forgotPassword(emailRequestDto.email);
    return {
      status: SUCCESS,
      message: RECEIVE_MESSAGE,
    };
  }

  @Post('change-password')
  @ApiOperation({
    description: 'The route used by user to change password',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 201, type: BasicResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async changePassword(@Body() { token, password }: ChangePasswordDto) {
    const res = await this.authService.changePassword(password, token);
    if (res) {
      return { status: SUCCESS };
    } else {
      throw new BadRequestException(FAILED_CHANGE_PASSWORD);
    }
  }

  @Post('validate-email-verify')
  @ApiOperation({
    description: 'The route used to validate email',
  })
  @ApiBody({ type: EmailVerificationDto })
  @ApiResponse({ status: 201, type: ValidSuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async validateEmailVerifyToken(@Body() { token }: EmailVerificationDto) {
    const user = await this.authService.validateEmailVerifyToken(token);

    if (user) {
      return { status: SUCCESS, user };
    } else {
      return { status: ERROR };
    }
  }

  @Post('create-password')
  @ApiOperation({
    description: 'The route used by user to create password',
  })
  @ApiBody({ type: CreatePasswordDto })
  @ApiResponse({ status: 201, type: ValidSuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async createPassword(@Body() { token, password }: CreatePasswordDto) {
    const user = await this.authService.createPassword(token, password);

    if (user) {
      return { status: SUCCESS, user };
    } else {
      throw new BadRequestException();
    }
  }

  @Post('resend-email-verify')
  @ApiOperation({
    description: 'The route used to resend email verify',
  })
  @ApiBody({ type: EmailRequestDto })
  @ApiResponse({ status: 201, type: ValidSuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async resendEmailVerify(@Body() { email }: EmailRequestDto) {
    const user = await this.authService.resendEmailVerify(email);

    if (user) {
      return { status: 'SUCCESS', user };
    } else {
      throw new BadRequestException();
    }
  }
}
