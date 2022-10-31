import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { FleetsService } from '../services/fleets.service';
import { CreateFleetDto } from '../dto/create-fleet.dto';
import { UpdateFleetDto } from '../dto/update-fleet.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HasRole } from '../../users/decorators/user-role.decorator';
import { Roles } from '../../../shared/constants/global.constants';
import { PaginationParamsDto } from '../../../shared/dtos/pagination.dto';
import { SortOrderDto } from '../../../shared/dtos/sort-order.dto';
import { SearchUserDto } from '../../users/dto/search-user.dto';
import { FailedResponseDto } from '../../../shared/dtos/failed-response.dto';
import {
  AllFleetResponseDto,
  FleetsListDto,
  SuccessFleetResponseDto,
} from '../dto/fleet-response.dto';
import { SUCCESS } from '../../../shared/constants/message.constants';
import { UsersService } from '../../users/services/users.service';
import { IRequest } from '../../auth/auth.types';
import { CreateVesselDto } from '../../vessels/dto/create-vessel.dto';
import { VesselsService } from '../../vessels/services/vessels.service';

@UseGuards(JwtAuthGuard)
@ApiTags('fleet')
@ApiBearerAuth()
@Controller('fleets')
export class FleetsController {
  constructor(
    private readonly fleetsService: FleetsService,
    private readonly usersService: UsersService,
    private readonly vesselsService: VesselsService,
  ) {}

  @Post()
  @ApiOperation({
    description: 'The route used by user to create new fleet',
  })
  @ApiBody({ type: CreateFleetDto })
  @ApiResponse({ status: 201, type: SuccessFleetResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  async create(@Body() createFleetDto: CreateFleetDto, @Req() req: IRequest) {
    const user = req.user;

    if (user.role === Roles.COMPANY_EDITOR) {
      const authUser = await this.usersService.findOneById(user.id);
      createFleetDto.company = authUser.companyId;
    }

    return this.fleetsService
      .create(createFleetDto)
      .then((res) => ({
        status: SUCCESS,
        data: res,
      }))
      .catch((err) => {
        throw new BadRequestException(err.sqlMessage);
      });
  }

  @Get()
  @ApiOperation({
    description: 'The route used by user to get all fleets',
  })
  @ApiResponse({ status: 200, type: AllFleetResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async findAll(@Req() req: IRequest) {
    const res = await this.fleetsService.findAll(req.user);

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Get('list')
  @ApiOperation({
    description: 'The route used by user to retrieve fleets',
  })
  @ApiResponse({ status: 200, type: FleetsListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async find(
    @Query() paginationParams: PaginationParamsDto,
    @Query() sortParams: SortOrderDto,
    @Query() searchParams: SearchUserDto,
    @Req() req: IRequest,
  ) {
    const user = req.user;

    if (user.role !== Roles.SUPER_ADMIN) {
      const authUser = await this.usersService.findOneById(user.id);

      if (
        searchParams.companyId &&
        searchParams.companyId !== authUser.companyId
      ) {
        throw new ForbiddenException();
      }

      searchParams.companyId = authUser.companyId;
      searchParams.companyIds = [authUser.companyId];
    }

    const res = await this.fleetsService.find(
      paginationParams,
      sortParams,
      searchParams,
    );

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get(':id')
  @ApiOperation({
    description: 'The route used by user to get detail of specific fleet',
  })
  @ApiResponse({ status: 200, type: SuccessFleetResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  async findOne(@Param('id') id: string, @Req() req: IRequest) {
    const user = req.user;
    const res = await this.fleetsService.findOne(+id);

    if (user.role !== Roles.SUPER_ADMIN) {
      const authUser = await this.usersService.findOneById(user.id);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (res.company.id !== authUser.companyId) {
        throw new ForbiddenException();
      }
    }

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Patch(':id')
  @ApiOperation({
    description: 'The route used by user to update specific fleet',
  })
  @ApiBody({ type: UpdateFleetDto })
  @ApiResponse({ status: 201, type: SuccessFleetResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  async update(
    @Param('id') id: string,
    @Body() updateFleetDto: UpdateFleetDto,
  ) {
    const res = await this.fleetsService.update(+id, updateFleetDto);

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Delete(':id')
  @ApiOperation({
    description: 'The route used by user to remove specific fleet',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  remove(@Param('id') id: string) {
    return this.fleetsService.remove(+id);
  }

  @Post(':id/vessel')
  @ApiOperation({
    description:
      'The route used by user to create vessel included in specific fleet',
  })
  @ApiBody({ type: CreateVesselDto })
  @ApiResponse({ status: 201, type: SuccessFleetResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  async createVessel(
    @Param('id') id: string,
    @Body() createVesselDto: CreateVesselDto,
  ) {
    createVesselDto.fleet = +id;
    const res = this.vesselsService.create(createVesselDto);

    if (res) {
      return {
        message: SUCCESS,
      };
    } else {
      throw new BadRequestException();
    }
  }
}
