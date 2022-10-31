import { Controller, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { TokensService } from './tokens.service';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { FailedResponseDto } from '../../shared/dtos/failed-response.dto';
import { SuccessResponseDto } from '../../shared/dtos/success-response.dto';
import { SUCCESS } from '../../shared/constants/message.constants';

@ApiTags('token')
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Post()
  @ApiOperation({
    description: 'The route used to create token',
  })
  @ApiBody({ type: CreateTokenDto })
  @ApiResponse({ status: 201, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async create(@Body() createTokenDto: CreateTokenDto) {
    const res = await this.tokensService.create(createTokenDto);

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Patch(':id')
  @ApiOperation({
    description: 'The route used to update token',
  })
  @ApiBody({ type: UpdateTokenDto })
  @ApiResponse({ status: 201, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateTokenDto: UpdateTokenDto,
  ) {
    const res = await this.tokensService.update(+id, updateTokenDto);

    return {
      message: SUCCESS,
      data: res,
    };
  }
}
