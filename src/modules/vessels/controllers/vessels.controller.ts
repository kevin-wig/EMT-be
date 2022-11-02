import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ExecutionContext,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
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

import { VesselsService } from '../services/vessels.service';
import { CreateVesselDto } from '../dto/create-vessel.dto';
import { UpdateVesselDto } from '../dto/update-vessel.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HasRole } from '../../users/decorators/user-role.decorator';
import { GraphLevel, Roles } from '../../../shared/constants/global.constants';
import { PaginationParamsDto } from '../../../shared/dtos/pagination.dto';
import { SortOrderDto } from '../../../shared/dtos/sort-order.dto';
import { SearchVesselDto } from '../dto/search-vessel.dto';
import { FailedResponseDto } from '../../../shared/dtos/failed-response.dto';
import { SUCCESS } from '../../../shared/constants/message.constants';
import {
  FuelsResponseDto,
  PortsResponseDto,
  VesselResponseDto,
  VesselsListResponseDto,
  VesselsResponseDto,
  VesselTypeResponseDto,
} from '../dto/vessel-response.dto';
import { SuccessResponseDto } from '../../../shared/dtos/success-response.dto';
import { IPayload, IRequest } from '../../auth/auth.types';
import { UsersService } from '../../users/services/users.service';
import { ComparisonReportDto, ReportType } from '../dto/comparison-report.dto';
import { ChartsQueryDto } from '../../../shared/dtos/charts-query.dto';
import { YearQueryDto } from '../../../shared/dtos/year-query.dto';
import { request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { hostname } from 'os';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { VesselOnboardingLinksService } from 'src/modules/vessel-onboarding-links/services/vessel-onboarding-links.service';
import { CompaniesService } from 'src/modules/companies/services/companies.service';

@ApiTags('vessel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vessels')
export class VesselsController {
  constructor(
    private readonly vesselsService: VesselsService,
    private readonly usersService: UsersService,
    private readonly companiesService: CompaniesService,
    private vesselOnboardingLinksService: VesselOnboardingLinksService,
  ) {}

  private async isEnableToAccessVesselData(user: IPayload, id: number) {
    if (user.role !== Roles.SUPER_ADMIN) {
      const authUser = await this.usersService.findOneById(user.id);
      const vessel = await this.vesselsService.findOne(id);

      if (authUser.companyId !== vessel.companyId) {
        throw new ForbiddenException();
      }
    }
  }

  @Post()
  @ApiOperation({
    description: 'The route used by user to create vessel data',
  })
  @ApiBody({ type: CreateVesselDto })
  @ApiResponse({ status: 201, type: VesselResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN /*, Roles.COMPANY_EDITOR*/)
  async create(@Body() createVesselDto: { [key: string]: CreateVesselDto }) {
    return this.vesselsService
      .createVessels(Object.values(createVesselDto))
      .then((res) => ({
        message: SUCCESS,
        data: res,
      }))
      .catch((error) => {
        throw new BadRequestException(error.message || error.sqlMessage);
      });
  }

  @Post('create')
  @ApiOperation({
    description: 'The route used by user to create vessel data',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  async createOne(@Body() createVesselDto: CreateVesselDto, @Req() request) {
    const userRole = request.role;
    const { companyId, imo } = createVesselDto;
    const imoList = await this.vesselOnboardingLinksService.findByCompany(
      companyId,
    );
    const limitVesselOnboarding = (
      await this.companiesService.findOne(companyId)
    ).limitVesselOnboarding;

    if (
      limitVesselOnboarding &&
      userRole === Roles.COMPANY_EDITOR &&
      !imoList.includes(imo)
    ) {
      throw new BadRequestException(
        'IMO does not exist within company onboarding list',
      );
    }
    const getIMO = await this.vesselsService.findBy({ imo });

    if (getIMO.length > 0)
      throw new BadRequestException('IMO is already assigned');
    return this.vesselsService
      .create(createVesselDto)
      .then((res) => ({
        message: SUCCESS,
        data: res,
      }))
      .catch((err) => {
        throw new BadRequestException(err.sqlMessage);
      });
  }

  @Get()
  @ApiOperation({
    description: 'The route used by user to get all vessel data',
  })
  @ApiResponse({ status: 200, type: VesselsResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  async findAll() {
    const res = await this.vesselsService.findAll();

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get('list')
  @ApiOperation({
    description: 'The route used by user to retrieve vessel data',
  })
  @ApiResponse({ status: 200, type: VesselsListResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async find(
    @Query() paginationParams: PaginationParamsDto,
    @Query() sortParams: SortOrderDto,
    @Query() searchParams: SearchVesselDto,
  ) {
    const res = await this.vesselsService.getVesselsList(
      paginationParams,
      sortParams,
      searchParams,
    );

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get('ports')
  @ApiOperation({
    description: 'The route used by user to get all ports data',
  })
  @ApiResponse({ status: 200, type: PortsResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getPorts() {
    const res = await this.vesselsService.getAllPorts();

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get('fuels')
  @ApiOperation({
    description: 'The route used by user to get all fuels data',
  })
  @ApiResponse({ status: 200, type: FuelsResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getFuels() {
    const res = await this.vesselsService.getFuels();

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get('types')
  @ApiOperation({
    description: 'The route used by user to get all vessels types',
  })
  @ApiResponse({ status: 200, type: VesselTypeResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getTypes() {
    const res = await this.vesselsService.getVesselTypes();

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get(':id')
  @ApiOperation({
    description: 'The route used by user to get specific vessel',
  })
  @ApiResponse({ status: 200, type: VesselResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async findOne(@Param('id') id: string, @Req() req: IRequest) {
    await this.isEnableToAccessVesselData(req.user, +id);

    const res = await this.vesselsService.findOne(+id);

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Patch(':id')
  @ApiOperation({
    description: 'The route used by user to update specific vessel',
  })
  @ApiBody({ type: UpdateVesselDto })
  @ApiResponse({ status: 200, type: VesselResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  async update(
    @Param('id') id: string,
    @Body() updateVesselDto: UpdateVesselDto,
    @Req() req: IRequest,
  ) {
    await this.isEnableToAccessVesselData(req.user, +id);

    const res = await this.vesselsService.update(+id, updateVesselDto);

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get('charts/cii/:id')
  @ApiOperation({
    description:
      'The route used by user to get CII chart data of specific vessel',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getEmissionsGraph(
    @Param('id') id: string,
    @Query() query: ChartsQueryDto,
    @Req() req: IRequest,
  ) {
    await this.isEnableToAccessVesselData(req.user, +id);

    const { year, month, mode, fromDate, toDate, voyageType } = query;
    let level: GraphLevel;

    if (mode === GraphLevel.VOYAGE || mode === GraphLevel.TRIP) {
      level = mode;
    } else if (!year && !month) {
      level = GraphLevel.YEAR;
    } else if (year && !month) {
      level = GraphLevel.MONTH;
    }

    const ciis = await this.vesselsService.getVesselCIIChart(
      +id,
      query,
      level,
      fromDate,
      toDate,
    );
    const boundCiis = await this.vesselsService.getVesselBoundCIIs(+id, level);

    return {
      message: SUCCESS,
      data: {
        ciis,
        boundCiis: boundCiis,
        level,
      },
    };
  }

  @Get('charts/stack-bar/:id')
  @ApiOperation({
    description:
      'The route used by user to get Stack bar chart data of specific vessel',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getStackBarGraph(
    @Param('id') id: string,
    @Req() req: IRequest,
    @Query() query: ChartsQueryDto,
  ) {
    await this.isEnableToAccessVesselData(req.user, +id);

    const { fromDate, toDate } = query;

    const data = await this.vesselsService.getVesselStackBarChart({
      id,
      fromDate,
      toDate,
    });

    return {
      message: SUCCESS,
      data,
    };
  }

  @Get('cii/:id')
  @ApiOperation({
    description: 'The route used by user to get cii data of specific vessel',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getCII(
    @Param('id') id: string,
    @Req() req: IRequest,
    @Query() query: ChartsQueryDto,
  ) {
    await this.isEnableToAccessVesselData(req.user, +id);

    const { mode, fromDate, toDate, voyageType } = query;
    const ciis = await this.vesselsService.getVesselCII(
      +id,
      mode,
      fromDate,
      toDate,
      voyageType,
    );

    return {
      message: SUCCESS,
      data: ciis,
    };
  }

  @Get('cii/:id/kpi')
  @ApiOperation({
    description: 'The route used by user to get cii data of specific vessel',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getCIIKpi(
    @Param('id') id: string,
    @Req() req: IRequest,
    @Query() query: ChartsQueryDto,
  ) {
    await this.isEnableToAccessVesselData(req.user, +id);

    const { year } = query;
    const kpi = await this.vesselsService.getVesselCIIKpi(+id, year);

    return {
      message: SUCCESS,
      data: kpi,
    };
  }

  @Post('cii/:id/export/pdf')
  @UseInterceptors(FileInterceptor('screenshot', { dest: './upload' }))
  @ApiOperation({
    description: 'The route used by user to get cii pdf of specific vessel',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getCiiPdf(
    @Param('id') id: string,
    @Query() query: ChartsQueryDto,
    @UploadedFile() screenshot: Express.Multer.File,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    await this.isEnableToAccessVesselData(req.user, +id);

    const pdf = await this.vesselsService.getCiiPerVesselPdf(
      screenshot.filename,
    );

    if (pdf) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=vessels-cii-${Date.now()}.pdf`,
      );

      pdf.pipe(res);
      pdf.end();
    } else {
      throw new BadRequestException();
    }
  }

  @Get('cii/:id/export/excel')
  @ApiOperation({
    description: 'The route used by user to get cii excel of specific vessel',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getCiiExcel(
    @Param('id') id: string,
    @Query() query: ChartsQueryDto,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    await this.isEnableToAccessVesselData(req.user, +id);

    const { mode, fromDate, toDate } = query;

    const workbook = await this.vesselsService.getCiiExcel(
      +id,
      mode,
      fromDate,
      toDate,
    );

    if (workbook) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=vessels-cii-${Date.now()}.xlsx`,
      );

      await workbook.xlsx.write(res);

      res.end();
    } else {
      throw new BadRequestException();
    }
  }

  @Delete(':id')
  @ApiOperation({
    description: 'The route used by user to remove specific vessel',
  })
  @ApiBody({ type: UpdateVesselDto })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  async remove(@Param('id') id: string, @Req() req: IRequest) {
    await this.isEnableToAccessVesselData(req.user, +id);

    await this.vesselsService.remove(+id);

    return {
      message: SUCCESS,
    };
  }

  @Get('eu-ets/:id')
  @ApiOperation({
    description: 'The route used by user to get EU ETS data of specific vessel',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getEuEts(
    @Param('id') id: string,
    @Req() req: IRequest,
    @Query() query: ChartsQueryDto,
  ) {
    await this.isEnableToAccessVesselData(req.user, +id);

    const { mode, fromDate, toDate, voyageType } = query;

    const ets = await this.vesselsService.getEuEts(
      +id,
      mode,
      fromDate,
      toDate,
      voyageType,
    );

    return {
      message: SUCCESS,
      data: ets,
    };
  }

  @Get('eu-ets/:id/charts/eua-cost')
  @ApiOperation({
    description:
      'The route used by user to get EU ETS chart of specific vessel',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getEuaCostCharts(
    @Param('id') id: string,
    @Req() req: IRequest,
    @Query() query: ChartsQueryDto,
  ) {
    await this.isEnableToAccessVesselData(req.user, +id);

    const { year, month, mode, fromDate, toDate } = query;
    let level: GraphLevel;

    if (mode === GraphLevel.VOYAGE) {
      level = GraphLevel.VOYAGE;
    } else if (!year && !month) {
      level = GraphLevel.YEAR;
    } else if (year && !month) {
      level = GraphLevel.MONTH;
    }

    const ets = await this.vesselsService.getEuaCostCharts(
      +id,
      query,
      level,
      fromDate,
      toDate,
    );

    return {
      message: SUCCESS,
      data: ets,
    };
  }

  @Get('eu-ets/:id/charts/ets')
  @ApiOperation({
    description:
      'The route used by user to get EU ETS chart of specific vessel per voyage',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getEtsCharts(
    @Param('id') id: string,
    @Req() req: IRequest,
    @Query() query: ChartsQueryDto,
  ) {
    await this.isEnableToAccessVesselData(req.user, +id);

    const { fromDate, toDate } = query;

    const ets = await this.vesselsService.getEtsChartsPerVoyage(
      +id,
      fromDate,
      toDate,
    );

    return {
      message: SUCCESS,
      data: ets,
    };
  }

  @Get('eu-ets/:id/charts/eua-percent')
  @ApiOperation({
    description:
      'The route used by user to get EU ETS chart of specific vessel',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getEuaPercentCharts(
    @Param('id') id: string,
    @Req() req: IRequest,
    @Query() query: ChartsQueryDto,
  ) {
    await this.isEnableToAccessVesselData(req.user, +id);

    const { year, month, mode, fromDate, toDate } = query;
    let level: GraphLevel;

    if (mode === GraphLevel.VOYAGE) {
      level = mode;
    } else if (!year && !month) {
      level = GraphLevel.YEAR;
    } else if (year && !month) {
      level = GraphLevel.MONTH;
    }

    const ets = await this.vesselsService.getEuaPercentCharts(
      +id,
      query,
      level,
      fromDate,
      toDate,
    );

    return {
      message: SUCCESS,
      data: ets,
    };
  }

  @Get('eu-ets/:id/kpi')
  @ApiOperation({
    description:
      'The route used by user to get EU ETS KPIs of a specific vessel',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getEuaEtsKpi(
    @Param('id') id: string,
    @Req() req: IRequest,
    @Query() yearQuery: YearQueryDto,
  ) {
    await this.isEnableToAccessVesselData(req.user, +id);

    let { year } = yearQuery;

    if (!year) {
      year = new Date().getFullYear();
    }

    const ets = await this.vesselsService.getEtsKpi(+id, year);

    return {
      message: SUCCESS,
      data: ets,
    };
  }

  @Post('eu-ets/:id/export/pdf')
  @UseInterceptors(FileInterceptor('screenshot', { dest: './upload' }))
  @ApiOperation({
    description: 'The route used by user to get ETS pdf of specific vessel',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getEtsPdf(
    @Param('id') id: string,
    @Query() query: ChartsQueryDto,
    @UploadedFile() screenshot: Express.Multer.File,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    await this.isEnableToAccessVesselData(req.user, +id);

    const pdf = await this.vesselsService.getEtsPerVesselPdf(
      screenshot.filename,
    );

    if (pdf) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=vessels-cii-${Date.now()}.pdf`,
      );

      pdf.pipe(res);
      pdf.end();
    } else {
      throw new BadRequestException();
    }
  }

  @Get('eu-ets/:id/export/excel')
  @ApiOperation({
    description: 'The route used by user to get cii excel of specific vessel',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getEtsExcel(
    @Param('id') id: string,
    @Query() query: ChartsQueryDto,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    await this.isEnableToAccessVesselData(req.user, +id);

    const { mode, fromDate, toDate } = query;

    const workbook = await this.vesselsService.getEtsExcel(
      +id,
      mode,
      fromDate,
      toDate,
    );

    if (workbook) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=vessels-cii-${Date.now()}.xlsx`,
      );

      await workbook.xlsx.write(res);

      res.end();
    } else {
      throw new BadRequestException();
    }
  }

  @Get('ghg/:id')
  @ApiOperation({
    description: 'The route used by user to get ghg data of specific vessel',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getGhg(
    @Param('id') id: string,
    @Query('year') year: string,
    @Req() req: IRequest,
  ) {
    await this.isEnableToAccessVesselData(req.user, +id);

    const res = await this.vesselsService.getGhg(+id, +year);

    return {
      message: SUCCESS,
      data: res || {},
    };
  }

  @Post('report')
  @ApiOperation({
    description: 'The route used by user to retrieve comparison report',
  })
  @ApiResponse({ status: 200, type: VesselsListResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async comparisonReport(
    @Query() query: ChartsQueryDto,
    @Body() options: ComparisonReportDto,
  ) {
    const { reportType } = options;
    let res;

    const { year, month, isVoyage } = query;
    let level: GraphLevel;

    if (isVoyage) {
      level = GraphLevel.VOYAGE;
    } else if (!year && !month) {
      level = GraphLevel.YEAR;
    } else if (year && !month) {
      level = GraphLevel.MONTH;
    }

    if (reportType === ReportType.CII) {
      res = await this.vesselsService.getVesselsCIIReport(
        options,
        query,
        level,
      );
      //} else if (reportType === ReportType.ETS) {
      //res = await this.vesselsService.getVesselsEtsReport(options);
    } /*if (reportType === ReportType.GHG)*/ else {
      res = await this.vesselsService.getVesselsGhgReport(options);
    }

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Post('report/list')
  @ApiOperation({
    description:
      'The route used to retrieve vessels list for comparison report',
  })
  @ApiResponse({ status: 200, type: VesselsListResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async listForComparisonReport(@Body() options: ComparisonReportDto) {
    const res = await this.vesselsService.getListForReport(options);

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Post('report/export/excel')
  @ApiOperation({
    description: 'The route used to export comparison report as Excel file',
  })
  @ApiResponse({ status: 200, type: VesselsListResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async exportComparisonReport(
    @Body() options: { [key: string]: ComparisonReportDto },
    @Res() res: Response,
  ) {
    const workbook = await this.vesselsService.getReportsData(
      Object.values(options),
    );

    if (workbook) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=vessels-report-${Date.now()}.xlsx`,
      );

      await workbook.xlsx.write(res);

      res.end();
    } else {
      throw new BadRequestException();
    }
  }

  @Post('report/export/pdf')
  @UseInterceptors(FileInterceptor('screenshot', { dest: './upload' }))
  @ApiOperation({
    description: 'The route used to export comparison report as PDF file',
  })
  @ApiResponse({ status: 200, type: VesselsListResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async exportComparisonReportAsPdf(
    @UploadedFile() screenshot: Express.Multer.File,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    const pdf = await this.vesselsService.getReportPdf(screenshot.filename);

    if (pdf) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=vessels-cii-${Date.now()}.pdf`,
      );

      pdf.pipe(res);
      pdf.end();
    } else {
      throw new BadRequestException();
    }
  }
}
