import {
  ListSuccessResponseDto,
  SuccessResponseDto,
} from '../../../shared/dtos/success-response.dto';
import { Company } from '../entities/company.entity';
import { VesselCiiDto } from '../../vessels/dto/vessel-cii.dto';
import { VesselCiiChartDto } from '../../vessels/dto/vessel-cii-chart.dto';
import { Ghg } from '../../vessels/entities/ghg.entity';
import { VesselEtsChartDto } from '../../vessels/dto/vessel-ets-chart.dto';
import { VesselCostsChartDto } from '../../vessels/dto/vessel-costs-chart.dto';
import { VesselChartDto } from '../../vessels/dto/vessel-chart.dto';

export class SuccessCompanyResponseDto extends SuccessResponseDto<Company> {}

export class SuccessEtsKpiResponseDto extends SuccessResponseDto<{
  totalEts: number;
  euaCost: number;
  freightProfit: number;
  totalBunkerCost: number;
}> {}

export class AllCompaniesDto extends SuccessResponseDto<Company[]> {}

export class CompanyListDto extends ListSuccessResponseDto<Company> {}

export class CompanyVesselCiiListDto extends ListSuccessResponseDto<VesselCiiDto> {}

export class CompanyVesselEuaChartDto extends SuccessResponseDto<
  VesselChartDto<any>[]
> {}

export class CompanyVesselCiiChartListDto extends SuccessResponseDto<
  VesselCiiChartDto[]
> {}

export class CompanyVesselEtsChartListDto extends SuccessResponseDto<
  VesselEtsChartDto[]
> {}

export class CompanyVesselCostsChartListDto extends SuccessResponseDto<
  VesselCostsChartDto[]
> {}

export class CompanyVesselGhgListDto extends ListSuccessResponseDto<Ghg> {}

export class CompanyVesselGhgChartDto extends SuccessResponseDto<Ghg> {}

export class CompanyEmissionsDto extends SuccessResponseDto<number> {}
