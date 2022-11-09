import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query, Req, Request, UnauthorizedException } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchVesselDto } from 'src/modules/vessels/dto/search-vessel.dto';
import { APIKEY_CREATION_SUCCESS, APIKEY_REFRESH_SUCCESS, SUCCESS } from 'src/shared/constants/message.constants';
import { FailedResponseDto } from 'src/shared/dtos/failed-response.dto';
import { PaginationParamsDto } from 'src/shared/dtos/pagination.dto';
import { SortOrderDto } from 'src/shared/dtos/sort-order.dto';
import { SuccessResponseDto } from 'src/shared/dtos/success-response.dto';
import { CreateApiKeyDto } from '../dto/create-apikey.dto';
import { GetCIIDataDto } from '../dto/get-cii-data.dto';
import { RefreshApiKeyDto } from '../dto/refresh-apikey.dto';

import { ApiKeyService } from '../services/api-key.service';

@Controller("api-key")
@ApiTags('third-party api')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  private async checkHeader(@Req() request: Request) {
    const { headers } = request;
    const apiKey = headers["x-api-key"];
    
    if (!apiKey) throw new UnauthorizedException("You are not authorized to access this route")
    
    // Validate API KEY
    const keyNotValid = await this.apiKeyService.isApiKeyValid(apiKey)
    if (keyNotValid) throw new UnauthorizedException("You are not authorized to access this route")
  }

  @Post()
  @ApiOperation({
    description: 'The route used to create api keys',
  })
  @ApiBody({ type: CreateApiKeyDto })
  @ApiResponse({ status: 201, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  create(@Body() createApiKeyDto: CreateApiKeyDto) {
    return this.apiKeyService.create(createApiKeyDto)
    .then((res) => ({
        message: APIKEY_CREATION_SUCCESS,
        data: res
    }))
    .catch((err) => {
        throw new BadRequestException(err.sqlMessage);
    })
  }

  @Post("refresh")
  @ApiOperation({
    description: 'The route used to create api keys',
  })
  @ApiBody({ type: RefreshApiKeyDto })
  @ApiResponse({ status: 201, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  refresh(@Body() refreshApiKeyDto: RefreshApiKeyDto) {
    return this.apiKeyService.refresh(refreshApiKeyDto)
    .then((res) => ({
        message: APIKEY_REFRESH_SUCCESS,
        data: res
    }))
    .catch((err) => {
        throw new BadRequestException(err.sqlMessage);
    })
  }

  @Delete(':id')
  @ApiOperation({
    description: 'The route used by user to remove specific fleet',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  remove(@Param('id') id: string) {
    return this.apiKeyService.delete(+id);
  }

  @Post('vessels/cii')
  @ApiOperation({
    description: 'The route used to get CII details for the authorized user',
  })
  @ApiHeader({
    name: 'x-api-key',
    required: true
  })
  async getCIIData(
    @Req() request: Request,
    @Body() getCiiDataDto: GetCIIDataDto
  ) {
    await this.checkHeader(request);
    
    return this.apiKeyService.getVesselCIIData(request, getCiiDataDto)
    .then((res) => ({
        message: SUCCESS,
        data: res
    }))
    .catch((err) => {
        throw new BadRequestException(err.sqlMessage || err);
    })
  } 
}
