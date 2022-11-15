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
  Res,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { CompaniesService } from '../services/companies.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HasRole } from '../../users/decorators/user-role.decorator';
import { GraphLevel, Roles } from '../../../shared/constants/global.constants';
import { PaginationParamsDto } from '../../../shared/dtos/pagination.dto';
import { SortOrderDto } from '../../../shared/dtos/sort-order.dto';
import { SearchCompanyDto } from '../dto/search-company.dto';
import { SearchVesselDto } from '../../vessels/dto/search-vessel.dto';
import { FailedResponseDto } from '../../../shared/dtos/failed-response.dto';
import {
  COMPANY_NOT_FOUND,
  SUCCESS,
} from '../../../shared/constants/message.constants';
import {
  AllCompaniesDto,
  CompanyEmissionsDto,
  CompanyListDto,
  CompanyVesselCiiChartListDto,
  CompanyVesselCiiListDto,
  CompanyVesselCostsChartListDto,
  CompanyVesselEtsChartListDto,
  CompanyVesselGhgChartDto,
  CompanyVesselGhgListDto,
  SuccessCompanyResponseDto,
  SuccessEtsKpiResponseDto,
} from '../dto/company-response.dto';
import { StatusResponseDto } from '../../../shared/dtos/success-response.dto';
import { IPayload, IRequest } from '../../auth/auth.types';
import { UsersService } from '../../users/services/users.service';
import { ChartsQueryDto } from '../../../shared/dtos/charts-query.dto';
import { YearQueryDto } from '../../../shared/dtos/year-query.dto';

@UseGuards(JwtAuthGuard)
@ApiTags('company')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly usersService: UsersService,
  ) {}

  private async isEnableToAccessToCompanyData(user: IPayload, id: number) {
    if (user.role !== Roles.SUPER_ADMIN) {
      const authUser = await this.usersService.findOneById(user.id);
      if (authUser.companyId !== +id) {
        throw new ForbiddenException();
      }
    }
  }

  @Post()
  @ApiOperation({
    description: 'The route used by user to create new company',
  })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({ status: 201, type: SuccessCompanyResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN)
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService
      .create(createCompanyDto)
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
    description: 'The route used by user to get all companies',
  })
  @ApiResponse({ status: 200, type: AllCompaniesDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  // @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  async findAll(@Req() req: IRequest) {
    let res;

    if (req?.user?.role === Roles.SUPER_ADMIN) {
      res = await this.companiesService.findAll();
    } else {
      res = await this.companiesService.findManyBy({ primaryContactEmailAddress: req?.user?.email });
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

  @Get('list')
  @ApiOperation({
    description: 'The route used by user to retrieve companies',
  })
  @ApiResponse({ status: 200, type: CompanyListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  async find(
    @Query() paginationParams: PaginationParamsDto,
    @Query() sortParams: SortOrderDto,
    @Query() searchParams: SearchCompanyDto,
    @Req() req: IRequest,
  ) {
    const user = req.user;
    const res = await this.companiesService.find(
      paginationParams,
      sortParams,
      searchParams,
      user,
    );

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Get('vessels/cii/:id/kpi')
  @ApiOperation({
    description:
      'The route used by user to retrieve vessels CII KPIs data belong to specific company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselCiiListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getVesselsCiiKpi(
    @Param('id') id: string,
    @Req() req: IRequest,
    @Query() query: ChartsQueryDto,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    let { year, type } = query;

    if (!year) {
      year = new Date().getFullYear();
    }

    const res = await this.companiesService.getVesselsCiiKpi(+id, year, type);

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Get('vessels/cii/:id')
  @ApiOperation({
    description:
      'The route used by user to retrieve vessels cii list data belong to specific company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselCiiListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getVesselsCiiList(
    @Param('id') id: string,
    @Query() paginationParams: PaginationParamsDto,
    @Query() sortParams: SortOrderDto,
    @Query() searchParams: SearchVesselDto,
    @Req() req: IRequest,
  ) {
    const user = req.user;
    await this.isEnableToAccessToCompanyData(req.user, +id);

    searchParams.companyId = +id;

    const res = await this.companiesService.getVesselsCiiList(
      paginationParams,
      sortParams,
      searchParams,
      user,
    );

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Get('vessels/cii/:id/export/excel')
  @ApiOperation({
    description:
      'The route used by user to export vessels cii list as excel belong to specific company',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async exportCiiAsExcel(
    @Param('id') id: string,
    @Query() searchParams: SearchVesselDto,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    searchParams.companyId = +id;
    const workbook = await this.companiesService.getVesselsCiiExcel(
      searchParams,
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

  @Post('vessels/cii/:id/export/pdf')
  @UseInterceptors(FileInterceptor('screenshot', { dest: './upload' }))
  @ApiOperation({
    description:
      'The route used by user to export vessels CII list as PDF belong to specific company',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async exportCiiAsPdf(
    @Param('id') id: string,
    @Query() searchParams: SearchVesselDto,
    @UploadedFile() screenshot: Express.Multer.File,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    searchParams.companyId = +id;
    const pdf = await this.companiesService.getVesselsCiiPdf(
      searchParams,
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

  @Get('vessels/ets/:id')
  @ApiOperation({
    description:
      'The route used by user to retrieve vessels ETS data belong to specific company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselCiiListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getVesselsEts(
    @Param('id') id: string,
    @Query() paginationParams: PaginationParamsDto,
    @Query() sortParams: SortOrderDto,
    @Query() searchParams: SearchVesselDto,
    @Req() req: IRequest,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    searchParams.companyId = +id;
    const res = await this.companiesService.getVesselsEtsList(
      paginationParams,
      sortParams,
      searchParams,
    );

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Get('vessels/ets/:id/kpi')
  @ApiOperation({
    description: 'The route used by user to get KPIs of company',
  })
  @ApiResponse({ status: 200, type: SuccessEtsKpiResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getVesselsEtsKpi(
    @Param('id') id: string,
    @Query() yearQuery: YearQueryDto,
    @Req() req: IRequest,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    let { year } = yearQuery;
    if (!year) {
      year = new Date().getFullYear();
    }

    const res = await this.companiesService.getVesselsEtsKpi(+id, year);

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Get('vessels/ets/:id/export/excel')
  @ApiOperation({
    description:
      'The route used by user to export vessels ETS list belong to specific company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselCiiListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async exportEtsAsExcel(
    @Param('id') id: string,
    @Query() searchParams: SearchVesselDto,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    searchParams.companyId = +id;
    const workbook = await this.companiesService.getVesselsEtsExcel(
      searchParams,
    );

    if (workbook) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=vessels-ets-${Date.now()}.xlsx`,
      );

      await workbook.xlsx.write(res);

      res.end();
    } else {
      throw new BadRequestException();
    }
  }

  @Post('vessels/ets/:id/export/pdf')
  @UseInterceptors(FileInterceptor('screenshot', { dest: './upload' }))
  @ApiOperation({
    description:
      'The route used by user to export vessels ETS list as pdf belong to specific company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselCiiListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async exportEtsAsPdf(
    @Param('id') id: string,
    @Query() searchParams: SearchVesselDto,
    @UploadedFile() screenshot: Express.Multer.File,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    searchParams.companyId = +id;
    const pdf = await this.companiesService.getVesselsEtsPdf(
      searchParams,
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

  @Get('vessels/charts/emissions/:id')
  @ApiOperation({
    description:
      'The route used by user to get vessels CII chart data belong to specific company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselCiiChartListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getVesselsEmissionsChart(
    @Param('id') id: string,
    @Query() query: ChartsQueryDto,
    @Req() req: IRequest,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    const { year, month, isVoyage } = query;
    let level: GraphLevel;

    if (isVoyage) {
      level = GraphLevel.VOYAGE;
    } else if (!year && !month) {
      level = GraphLevel.YEAR;
    } else if (year && !month) {
      level = GraphLevel.MONTH;
    } else {
      level = GraphLevel.VOYAGE;
    }

    const res = await this.companiesService.getVesselsEmissionsChart(
      +id,
      query,
      level,
    );

    if (res) {
      return {
        message: SUCCESS,
        data: {
          chart: res,
          level,
        },
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Get('vessels/charts/bunkering/emissions/:id')
  @ApiOperation({
    description:
      'The route used by user to get vessels cii chart data belong to bunkering company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselCiiChartListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getVesselsBunkeringChart(
    @Param('id') id: string,
    @Query() query: ChartsQueryDto,
    @Req() req: IRequest,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    const { year, month } = query;
    let level: GraphLevel;

    if (!year && !month) {
      level = GraphLevel.YEAR;
    } else if (year && !month) {
      level = GraphLevel.MONTH;
    } else {
      level = GraphLevel.VOYAGE;
    }

    const res = await this.companiesService.getVesselsCiiChartBunkeringCompany(
      +id,
      query,
      level,
    );

    if (res) {
      return {
        message: SUCCESS,
        data: {
          ...res,
        },
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Get('vessels/charts/bunkering/fuel-cost/:id')
  @ApiOperation({
    description:
      'The route used by user to get second chart data of bunkering company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselCiiListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getVesselsFuelCostBunkeringChart(
    @Param('id') id: string,
    @Req() req: IRequest,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    const res =
      await this.companiesService.getVesselsFuelCostChartBunkeringCompany(+id);

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Get('vessels/charts/bunkering/eua-voyage/:id')
  @ApiOperation({
    description:
      'The route used by user to get EUA chart data per voyage of bunkering company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselCiiListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getVesselsEuaChart(@Param('id') id: string, @Req() req: IRequest) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    const res = await this.companiesService.getVesselsEuaChartBunkeringCompany(
      +id,
    );

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Get('vessels/charts/category/:id')
  @ApiOperation({
    description:
      'The route used by user to get vessels category chart data belong to specific company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselCiiChartListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getVesselsCategoryChart(
    @Param('id') id: string,
    @Query() query: ChartsQueryDto,
    @Req() req: IRequest,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    const { year, month, isVoyage } = query;
    let level: GraphLevel;

    if (isVoyage) {
      level = GraphLevel.VOYAGE;
    } else if (!year && !month) {
      level = GraphLevel.YEAR;
    } else if (year && !month) {
      level = GraphLevel.MONTH;
    } else {
      level = GraphLevel.VOYAGE;
    }

    const res = await this.companiesService.getVesselsCategoryChart(
      +id,
      query,
      level,
    );

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Get('vessels/charts/ets/:id')
  @ApiOperation({
    description:
      'The route used by user to get vessels ETS chart data belong to specific company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselEtsChartListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getVesselsEtsChart(
    @Param('id') id: string,
    @Query() yearQuery: YearQueryDto,
    @Req() req: IRequest,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    let { year } = yearQuery;

    if (!year) {
      year = new Date().getFullYear();
    }

    const res = await this.companiesService.getVesselsEtsChart(+id, year);

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Get('vessels/charts/costs/:id')
  @ApiOperation({
    description:
      'The route used by user to get vessels freight profit and bunker cost chart of a company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselCostsChartListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getVesselsCostsChart(
    @Param('id') id: string,
    @Query() yearQuery: YearQueryDto,
    @Req() req: IRequest,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    let { year } = yearQuery;

    if (!year) {
      year = new Date().getFullYear();
    }

    const res = await this.companiesService.getVesselsCostsChart(+id, year);

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Get('vessels/ghg/:id')
  @ApiOperation({
    description:
      'The route used by user to get vessels ghg list belong to specific company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselGhgListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getVesselsGhg(
    @Param('id') id: string,
    @Query() paginationParams: PaginationParamsDto,
    @Query() sortParams: SortOrderDto,
    @Query() searchParams: SearchVesselDto,
    @Req() req: IRequest,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    searchParams.companyId = +id;
    const res = await this.companiesService.getVesselsGhgs(
      paginationParams,
      sortParams,
      searchParams,
    );

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Get('vessels/ghg/:id/export/excel')
  @ApiOperation({
    description:
      'The route used by user to get vessels ghg list belong to specific company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselGhgListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async exportVesselsGhgAsExcel(
    @Param('id') id: string,
    @Query() searchParams: SearchVesselDto,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    searchParams.companyId = +id;
    const workbook = await this.companiesService.getVesselsGhgsExcel(
      searchParams,
    );

    if (workbook) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=vessels-ghg-${Date.now()}.xlsx`,
      );

      await workbook.xlsx.write(res);

      res.end();
    } else {
      throw new BadRequestException();
    }
  }

  @Post('vessels/ghg/:id/export/pdf')
  @UseInterceptors(FileInterceptor('screenshot', { dest: './upload' }))
  @ApiOperation({
    description:
      'The route used by user to export vessels GHG list as pdf belong to specific company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselCiiListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async exportGhgAsPdf(
    @Param('id') id: string,
    @Query() searchParams: SearchVesselDto,
    @UploadedFile() screenshot: Express.Multer.File,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    searchParams.companyId = +id;
    const pdf = await this.companiesService.getVesselsGhgPdf(
      searchParams,
      screenshot.filename,
    );

    if (pdf) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=vessels-ghg-${Date.now()}.pdf`,
      );

      pdf.pipe(res);
      pdf.end();
    } else {
      throw new BadRequestException();
    }
  }

  @Get('vessels/charts/ghg/:id')
  @ApiOperation({
    description:
      'The route used by user to get vessels GHG chart belong to specific company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselGhgChartDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getVesselsGhgCharts(
    @Param('id') id: string,
    @Query('year') year: string,
    @Req() req: IRequest,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    const res = await this.companiesService.getVesselsGhgChart(+id, +year);

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Get('vessels/ghg/kpi/:id')
  @ApiOperation({
    description:
      'The route used by user to get vessels GHG KPIs belong to specific company',
  })
  @ApiResponse({ status: 200, type: CompanyVesselGhgChartDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getVesselsGhgKpi(
    @Param('id') id: string,
    @Query('year') year: string,
    @Req() req: IRequest,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    const res = await this.companiesService.getVesselsGhgKpi(+id, +year);

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException();
    }
  }

  @Get('emissions/:id')
  @ApiOperation({
    description: 'The route used by user to get emissions of company',
  })
  @ApiResponse({ status: 200, type: CompanyEmissionsDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getTotalEmissions(
    @Param('id') id: string,
    @Query('year') year: string,
    @Req() req: IRequest,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    const res = await this.companiesService.getTotalEmissions(+id, +year);

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get(':id')
  @ApiOperation({
    description: 'The route used by user to get detail of company',
  })
  @ApiResponse({ status: 200, type: SuccessCompanyResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  async findOne(@Param('id') id: string, @Req() req: IRequest) {
    // await this.isEnableToAccessToCompanyData(req.user, +id);

    const res = await this.companiesService.findOne(+id);

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException(COMPANY_NOT_FOUND);
    }
  }

  @Patch(':id')
  @ApiOperation({
    description: 'The route used by user to update company',
  })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiResponse({ status: 200, type: SuccessCompanyResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Req() req: IRequest,
  ) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    return this.companiesService
      .update(+id, updateCompanyDto)
      .then((res) => ({
        message: SUCCESS,
        data: res,
      }))
      .catch((err) => {
        throw new BadRequestException(err.sqlMessage);
      });
  }

  @Delete(':id')
  @ApiOperation({
    description: 'The route used by user to remove company',
  })
  @ApiResponse({ status: 200, type: StatusResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN)
  async remove(@Param('id') id: string, @Req() req: IRequest) {
    await this.isEnableToAccessToCompanyData(req.user, +id);

    return this.companiesService
      .remove(+id)
      .then(() => ({
        message: SUCCESS,
      }))
      .catch((err) => {
        throw new BadRequestException(err.sqlMessage);
      });
  }
}
