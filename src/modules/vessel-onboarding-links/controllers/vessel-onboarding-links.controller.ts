import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CompaniesService } from 'src/modules/companies/services/companies.service';
import { HasRole } from 'src/modules/users/decorators/user-role.decorator';
import { VesselsService } from 'src/modules/vessels/services/vessels.service';
import { SUCCESS } from 'src/shared/constants/message.constants';
import { FailedResponseDto } from 'src/shared/dtos/failed-response.dto';
import { SuccessResponseDto } from 'src/shared/dtos/success-response.dto';
import { Roles } from '../../../shared/constants/global.constants';
import { VesselOnboardingLinksDto } from '../dto/vessel-onboarding-links.dto';
import { VesselOnboardingLinksService } from '../services/vessel-onboarding-links.service';

@ApiTags('vessel-onboarding-links')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vessel-onboarding-links')
export class VesselOnboardingLinksController {
  constructor(
    private readonly vesselOnboardingLinksService: VesselOnboardingLinksService,
    private vesselsService: VesselsService,
    private companiesService: CompaniesService,
  ) {}

  //Get all Vessel Onboarding Links
  @Get()
  @ApiOperation({
    description: 'The route used by a super user to get all onboarding links',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN)
  async findAll() {
    return this.vesselOnboardingLinksService
      .findAll()
      .then((res) => ({
        message: SUCCESS,
        data: res,
      }))
      .catch((err) => {
        throw new BadRequestException(err.sqlMessage);
      });
  }

  //Get Vessel IMO List
  @Get('imoList')
  @ApiOperation({
    description: 'The route used by a super user to get vessel IMO list',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN)
  async getImoList() {
    return this.vesselOnboardingLinksService
      .getImoList()
      .then((res) => ({
        message: SUCCESS,
        data: res,
      }))
      .catch((err) => {
        throw new BadRequestException(err.sqlMessage);
      });
  }

  //Get all Vessel Onboarding Links for a specific company
  @Get(':id')
  @ApiOperation({
    description:
      'The route used by a super user to get an onboarding link between a company and a vessel using a company ID',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN)
  async findByCompanyId(@Param('id') company_id: number) {
    return this.vesselOnboardingLinksService
      .findByCompanyId(company_id)
      .then((res) => ({
        message: SUCCESS,
        data: res,
      }))
      .catch((err) => {
        throw new BadRequestException(err.sqlMessage);
      });
  }

  //Create a Vessel Onboarding Link
  @Post()
  @ApiOperation({
    description:
      'The route used by a super user to create an onboarding link between a company and a vessel',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN)
  async createOnboardingLink(
    @Body() vesselOnboardingLinksDto: VesselOnboardingLinksDto,
  ) {
    const { company_id, imo } = vesselOnboardingLinksDto;

    const getCOMPANY = await this.companiesService.findOne(company_id);
    if (!getCOMPANY) throw new BadRequestException('Company does not exist');

    const getIMO = await this.vesselOnboardingLinksService.findBy({ imo });
    if (getIMO.length > 0)
      throw new BadRequestException(
        `IMO already linked to ${getCOMPANY?.name}`,
      );

    return this.vesselOnboardingLinksService
      .createOnboardingLink(vesselOnboardingLinksDto)
      .then((res) => ({
        message: SUCCESS,
        data: res,
      }))
      .catch((err) => {
        throw new BadRequestException(err.sqlMessage);
      });
  }

  @Delete(':imo')
  @ApiOperation({
    description:
      'The route used by a super user to remove an onboarding link using a vessel imo',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN)
  async remove(@Param('imo') imo: string) {
    return this.vesselOnboardingLinksService
      .removeByImo(imo)
      .then(() => ({
        message: SUCCESS,
      }))
      .catch((err) => {
        throw new BadRequestException(err.sqlMessage);
      });
  }
}
