import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

import { VesselTripsService } from '../services/vessel-trips.service';
import { CreateVesselTripDto, CreateVesselTripsDto, CreateVesselTripUploadDto } from '../dto/create-vessel-trip.dto';
import { UpdateVesselTripDto } from '../dto/update-vessel-trip.dto';
import { FailedResponseDto } from '../../../shared/dtos/failed-response.dto';
import { SUCCESS } from '../../../shared/constants/message.constants';
import {
  VesselTripResponseDto,
  VesselTripsResponseDto,
} from '../dto/vessel-response.dto';
import { SuccessResponseDto } from '../../../shared/dtos/success-response.dto';
import { Roles } from '../../../shared/constants/global.constants';
import { IRequest } from '../../auth/auth.types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaginationParamsDto } from '../../../shared/dtos/pagination.dto';
import { SortOrderDto } from '../../../shared/dtos/sort-order.dto';
import { SearchVesselTripDto } from '../dto/search-vessel-trip.dto';
import { HasRole } from 'src/modules/users/decorators/user-role.decorator';
import { UsersService } from '../../users/services/users.service';
import { InternalServerErrorException } from '@nestjs/common';
import { VesselsService } from '../../vessels/services/vessels.service';

@ApiTags('vessel-trip')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vessel-trips')
export class VesselTripsController {
  constructor(
    private readonly vesselTripsService: VesselTripsService,
    private readonly vesselsService: VesselsService,
    private readonly usersService: UsersService,
  ) { }

  @Post()
  @ApiOperation({
    description: 'The route used by user to create vessel trip data',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  async create(
    @Body() { vesselTrips }: CreateVesselTripsDto,
  ) {
    await this.vesselTripsService.createTrips(vesselTrips);
    return {
      message: SUCCESS,
    };
  }

  @Post('create')
  @ApiOperation({
    description: 'The route used by user to create vessel trip data',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  async createOne(
    @Body() createVesselTrip: CreateVesselTripDto,
    @Query() query,
    @Req() req: IRequest
  ) {
    const me = req.user;
    if (me.role === Roles.COMPANY_EDITOR) {
      const meDetail = await this.usersService.findOneById(me.id);
      const vessel = await this.vesselsService.findOne(createVesselTrip.vessel);
      if (vessel.companyId !== meDetail.companyId) {
        throw new UnauthorizedException('You cannot create vessel trips for other companies!')
      }
    }
    await this.vesselTripsService.create(createVesselTrip, query.aggregate);
    return {
      message: SUCCESS,
    };
  }

  @Get('list')
  @ApiOperation({
    description: 'The route used by user to get vessel trips list',
  })
  @ApiResponse({ status: 200, type: VesselTripsResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async find(
    @Query() paginationParams: PaginationParamsDto,
    @Query() sortParams: SortOrderDto,
    @Query() searchParams: SearchVesselTripDto,
    @Req() req: IRequest,
  ) {
    const user = req.user;

    try {
      if (user.role !== Roles.SUPER_ADMIN) {
        if (searchParams.companyId) {
          const userDetail = await this.usersService.findOneById(user.id);
          searchParams.companyId = userDetail.companyId.toString();
        }
      }

      const res = await this.vesselTripsService.getTripsList(
        paginationParams,
        sortParams,
        searchParams,
      );

      return {
        message: SUCCESS,
        data: res,
      };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  @Get('cii')
  @ApiOperation({
    description: 'The route used by user to get CII data of vessel trips',
  })
  @ApiResponse({ status: 200, type: VesselTripsResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getCII(@Query() searchParams: SearchVesselTripDto) {
    const res = await this.vesselTripsService.getCiiByTrip(searchParams);

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get('cii/chart')
  @ApiOperation({
    description: 'The route used by user to get CII data of vessel trips',
  })
  @ApiResponse({ status: 200, type: VesselTripsResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getCIIChart(@Query() searchParams: SearchVesselTripDto, @Req() req) {
    const user = req.user;
    const res = await this.vesselTripsService.getCiiChart(searchParams, user);

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get('cii/chart/stack-bar')
  @ApiOperation({
    description: 'The route used by user to get CII data of vessel trips',
  })
  @ApiResponse({ status: 200, type: VesselTripsResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getCIIStackBarChart(@Query() searchParams: SearchVesselTripDto) {
    const res = await this.vesselTripsService.getCiiStackBarChart(searchParams);

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get('vessel-voyage/:vesselId')
  @ApiOperation({
    description: 'The route used by user to get voyages per vessel',
  })
  @ApiResponse({ status: 200, type: VesselTripsResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getVoyagePerVessel(
    @Param('vesselId') vesselId: string,
    @Query() searchParams: SearchVesselTripDto,
  ) {
    const res = await this.vesselTripsService.getVoyagesByVesselId(
      +vesselId,
      searchParams,
    );

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get('vessel-voyage/:vesselId/chart')
  @ApiOperation({
    description: 'The route used by user to get voyages per vessel fuel chart',
  })
  @ApiResponse({ status: 200, type: VesselTripsResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getVoyagesByVesselFuelChart(
    @Param('vesselId') vesselId: string,
    @Query() searchParams: SearchVesselTripDto,
    @Req() req,
  ) {
    const user = req.user;
    if (user.role !== Roles.SUPER_ADMIN) {
      const me = await this.usersService.findOneById(user.id);
      searchParams.companyId = me.companyId.toString();
    }

    const res = await this.vesselTripsService.getVoyagesByVesselFuelChart(
      +vesselId,
      searchParams,
    );

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get('vessel-voyage/:vesselId/excel')
  @ApiOperation({
    description: 'The route used by user to export voyages per vessel',
  })
  @ApiResponse({ status: 200, type: VesselTripsResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async exportVoyagePerVesselAsExcel(
    @Param('vesselId') vesselId: string,
    @Query() searchParams: SearchVesselTripDto,
    @Res() res: Response,
  ) {
    const workbook = await this.vesselTripsService.getVoyagePerVesselExcel(
      +vesselId,
      searchParams,
    );

    if (workbook) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=vessels-trips-${Date.now()}.xlsx`,
      );

      await workbook.xlsx.write(res);

      res.end();
    }
  }

  @Get('ets')
  @ApiOperation({
    description: 'The route used by user to get ETS data of vessel trip',
  })
  @ApiResponse({ status: 200, type: VesselTripsResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getETS(@Query() searchParams: SearchVesselTripDto) {
    const { id } = searchParams;
    const res = await this.vesselTripsService.getEtsByVoyage(+id);

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get('ets/chart/ets')
  @ApiOperation({
    description: 'The route used by user to get ETS chart of vessel trip',
  })
  @ApiResponse({ status: 200, type: VesselTripsResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getETSChart(@Query() searchParams: SearchVesselTripDto) {
    const res = await this.vesselTripsService.getEtsCharts(searchParams);

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get('ets/chart/eua-cost')
  @ApiOperation({
    description: 'The route used by user to get EUA cost chart of vessel trip',
  })
  @ApiResponse({ status: 200, type: VesselTripsResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getEuaCostChart(@Query() searchParams: SearchVesselTripDto) {
    const res = await this.vesselTripsService.getEuaCostCharts(searchParams);

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get('ets/chart/eua-percent')
  @ApiOperation({
    description:
      'The route used by user to get EUA percent chart of vessel trip',
  })
  @ApiResponse({ status: 200, type: VesselTripsResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getETSPercentChart(@Query() searchParams: SearchVesselTripDto) {
    const res = await this.vesselTripsService.getEtsPercentCharts(searchParams);

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get(':id')
  @ApiOperation({
    description:
      'The route used by user to get vessel trips of specific vessel',
  })
  @ApiResponse({ status: 200, type: VesselTripsResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async findOne(@Param('id') id: string) {
    const res = await this.vesselTripsService.findOne(+id);

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Patch(':id')
  @ApiOperation({
    description: 'The route used by user to update vessel trip',
  })
  @ApiBody({ type: UpdateVesselTripDto })
  @ApiResponse({ status: 200, type: VesselTripResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateVesselTripDto: UpdateVesselTripDto,
  ) {
    const res = await this.vesselTripsService.update(+id, updateVesselTripDto);

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Delete(':id')
  @ApiOperation({
    description: 'The route used by user to remove vessel trip',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async remove(@Param('id') id: string) {
    await this.vesselTripsService.remove(+id);

    return {
      message: SUCCESS,
    };
  }

  @Get('export/excel')
  @ApiOperation({
    description: 'The route used by user to trip data as excel',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async exportExcel(
    @Query() searchParams: SearchVesselTripDto,
    @Query() sortParams: SortOrderDto,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    const workbook = await this.vesselTripsService.getTripsExcel(
      searchParams,
      sortParams,
    );

    if (workbook) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=vessels-trips-${Date.now()}.xlsx`,
      );

      await workbook.xlsx.write(res);

      res.end();
    }
  }

  @Post('export/pdf')
  @UseInterceptors(FileInterceptor('screenshot', { dest: './upload' }))
  @ApiOperation({
    description: 'The route used by user to export trip data as PDF',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async exportPdf(
    @UploadedFile() screenshot: Express.Multer.File,
    @Query() searchParams: SearchVesselTripDto,
    @Query() sortParams: SortOrderDto,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    const pdf = await this.vesselTripsService.getTripsPdf(
      searchParams,
      sortParams,
      screenshot.filename,
    );

    if (pdf) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=vessels-ets-${Date.now()}.pdf`,
      );

      pdf.pipe(res);
      pdf.end();
    } else {
      throw new BadRequestException();
    }
  }
}
