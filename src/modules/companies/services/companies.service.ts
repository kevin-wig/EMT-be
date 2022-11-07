import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { Company } from '../entities/company.entity';
import { VesselsService } from '../../vessels/services/vessels.service';
import {
  PaginationDto,
  PaginationParamsDto,
} from '../../../shared/dtos/pagination.dto';
import { SortOrderDto } from '../../../shared/dtos/sort-order.dto';
import { SearchCompanyDto } from '../dto/search-company.dto';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { SearchVesselDto } from '../../vessels/dto/search-vessel.dto';
import { GraphLevel } from '../../../shared/constants/global.constants';
import { ChartsQueryDto } from '../../../shared/dtos/charts-query.dto';
import {
  VesselsCiiTable,
  VesselsEtsTable,
  VesselsGhgTable,
} from '../dto/vessels.dto';
import {
  getCIITableHeader,
  getEtsTableHeader,
  getGHGTableHeader,
} from '../../../shared/utils/helpers';
import { ExcelService } from '../../../shared/services/excel.service';
import { FleetsService } from '../../fleets/services/fleets.service';
import { FilterDto } from '../../../shared/dtos/excel.dto';
import { PdfService } from '../../../shared/services/pdf.service';
import { IPayload } from '../../auth/auth.types';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companiesRepository: Repository<Company>,
    private vesselsService: VesselsService,
    private excelService: ExcelService,
    private pdfService: PdfService,
    private fleetService: FleetsService,
  ) {}

  private async fetchFilterParams(searchOption: SearchVesselDto) {
    const { fleet, companyId, ...params } = searchOption;
    const searchParams: FilterDto = params as any;
    if (fleet) {
      const fleetRecord = await this.fleetService.findOne(fleet);
      searchParams.fleet = fleetRecord.name;
    } else if (companyId) {
      const companyRecord = await this.findOne(companyId);
      searchParams.company = companyRecord.name;
    }
    return searchParams;
  }

  create(createCompanyDto: CreateCompanyDto) {
    return this.companiesRepository.save(createCompanyDto);
  }

  findAll() {
    return this.companiesRepository.find({
      order: { id: 'ASC' },
      relations: ['users', 'fleets', 'vessels'],
    });
  }

  findBy(param) {
    return this.companiesRepository.findOne(param);
  }

  findManyBy(param) {
    return this.companiesRepository.find({ where: param });
  }

  async find(
    paginationOption: PaginationParamsDto,
    sortOption: SortOrderDto,
    searchOption: SearchCompanyDto,
  ) {
    const { page, limit } = paginationOption;
    const { sortBy, order } = sortOption;
    const { search } = searchOption;

    const filter = [];
    if (search) {
      filter.push({ name: Like(`%${search}%`) });
      filter.push({ primaryContactEmailAddress: Like(`%${search}%`) });
    }

    const fetchOptions: FindManyOptions = {
      where: filter,
      relations: ['users', 'fleets', 'vessels'],
      order: {
        [sortBy ? sortBy : 'id']: order ? order : 'ASC',
      },
    };

    const totalCount = await this.companiesRepository.count(fetchOptions);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    paginationOption.page = Math.max(1, Math.min(totalPages, page));

    const pagination: PaginationDto = {
      ...paginationOption,
      totalCount,
      totalPages,
    };

    fetchOptions.skip = (paginationOption.page - 1) * limit;
    fetchOptions.take = limit;
    const listData = await this.companiesRepository.find(fetchOptions);

    return {
      listData,
      pagination,
      sortOrder: sortOption,
    };
  }

  findOne(id: number) {
    return this.companiesRepository.findOne({
      where: { id },
      relations: ['users', 'fleets', 'vessels', 'vesselOnboardingLinks'],
    });
  }

  update(id: number, updateCompanyDto: UpdateCompanyDto) {
    return this.companiesRepository.update(id, updateCompanyDto);
  }

  remove(id: number) {
    return this.companiesRepository.delete(id);
  }

  async getVesselsCiiList(
    paginationOption: PaginationParamsDto,
    sortOption: SortOrderDto,
    searchOption: SearchVesselDto,
    user: IPayload,
  ) {
    return await this.vesselsService.getVesselsList(
      paginationOption,
      sortOption,
      searchOption,
      user,
    );
  }

  async getVesselsCiiExcel(searchOption: SearchVesselDto) {
    const vessels = await this.vesselsService.getVessels(searchOption);

    if (vessels) {
      let workbook =
        await this.excelService.generateTableExcel<VesselsCiiTable>(
          vessels,
          getCIITableHeader(searchOption.year),
          'Vessels CII',
        );

      const searchParams = await this.fetchFilterParams(searchOption);

      workbook = await this.excelService.addFilterTableSheet(
        workbook,
        searchParams,
      );

      return workbook;
    } else {
      return null;
    }
  }

  async getVesselsCiiPdf(searchOption: SearchVesselDto, screenshot: string) {
    const vessels = await this.vesselsService.getVessels(searchOption);

    if (vessels) {
      const searchParams = await this.fetchFilterParams(searchOption);
      return this.pdfService.generateTablePdf<VesselsCiiTable>(
        vessels,
        getCIITableHeader(searchOption.year),
        searchParams,
        screenshot,
      );
    } else {
      return null;
    }
  }

  async getVesselsCiiKpi(id: number, year: number, type: string) {
    return await this.vesselsService.getVesselsCiiKpiByCompany(id, year, type);
  }

  async getVesselsEmissionsChart(
    id: number,
    query: ChartsQueryDto,
    level: GraphLevel,
  ) {
    const vessels = await this.vesselsService.findByCompany(id);

    const data = await this.vesselsService.getVesselsCIIChartByCompany(
      id,
      query,
      level,
    );

    const existData = data.reduce((result, vessel) => {
      if (result.find((item) => item.id === vessel.id)) {
        result
          .find((item) => item.id === vessel.id)
          .data.push({
            key: vessel.key,
            cii: vessel.cii,
            category: vessel.category,
          });
      } else {
        result.push({
          id: vessel.id,
          name: vessel.name,
          data: [
            { key: vessel.key, cii: vessel.cii, category: vessel.category },
          ],
        });
      }
      return result;
    }, []);

    return vessels
      .map((vessel) => {
        const existVessel = existData.find((item) => item.id === vessel.id);
        return existVessel;
      })
      .filter((vessel) => vessel !== undefined);
  }

  async getVesselsFuelCostChartBunkeringCompany(id: number) {
    return await this.vesselsService.getVesselsFuelCostByBunkeringCompany(id);
  }

  async getVesselsEuaChartBunkeringCompany(id: number) {
    return await this.vesselsService.getVesselsEuaByBunkeringCompany(id);
  }

  async getVesselsCiiChartBunkeringCompany(
    id: number,
    query: ChartsQueryDto,
    level: GraphLevel,
  ) {
    return await this.vesselsService.getVesselsCIIChartByBunkeringCompany(
      id,
      query,
      level,
    );
  }

  async getVesselsCategoryChart(
    id: number,
    query: ChartsQueryDto,
    level: GraphLevel,
  ) {
    const data = await this.vesselsService.getVesselsCategoryChartByCompany(
      id,
      query,
      level,
    );

    return data.reduce((result, vessel) => {
      if (result.find((item) => item.id === vessel.id)) {
        result
          .find((item) => vessel.id === item.id)
          .data.push({
            key: vessel.key,
            category: vessel.category,
          });
      } else {
        result.push({
          id: vessel.id,
          name: vessel.name,
          data: [{ key: vessel.key, category: vessel.category }],
        });
      }
      return result;
    }, []);
  }

  async getVesselsEtsChart(id: number, year: number) {
    return await this.vesselsService.getVesselsEtsChartByCompany(id, year);
  }

  async getVesselsCostsChart(id: number, year: number) {
    return await this.vesselsService.getVesselsCostsChartByCompany(id, year);
  }

  async getVesselsEtsList(
    paginationOption: PaginationParamsDto,
    sortOption: SortOrderDto,
    searchOption: SearchVesselDto,
  ) {
    return await this.vesselsService.getEuEtsListByCompany(
      paginationOption,
      sortOption,
      searchOption,
    );
  }

  async getVesselsEtsExcel(searchOption: SearchVesselDto) {
    const vessels = await this.vesselsService.getEuEtsByCompany(searchOption);
    if (vessels) {
      let workbook =
        await this.excelService.generateTableExcel<VesselsEtsTable>(
          vessels,
          getEtsTableHeader(searchOption.year),
          'Vessels ETS',
        );

      const searchParams = await this.fetchFilterParams(searchOption);

      workbook = await this.excelService.addFilterTableSheet(
        workbook,
        searchParams,
      );

      return workbook;
    } else {
      return null;
    }
  }

  async getVesselsEtsPdf(searchOption: SearchVesselDto, screenshot: string) {
    const vessels = await this.vesselsService.getEuEtsByCompany(searchOption);

    if (vessels) {
      const searchParams = await this.fetchFilterParams(searchOption);
      return this.pdfService.generateTablePdf<VesselsEtsTable>(
        vessels,
        getEtsTableHeader(searchOption.year),
        searchParams,
        screenshot,
      );
    } else {
      return null;
    }
  }

  async getVesselsEtsKpi(id: number, year: number) {
    return await this.vesselsService.getEtsKpiByCompany(id, year);
  }

  async getVesselsGhgs(
    paginationOption: PaginationParamsDto,
    sortOption: SortOrderDto,
    searchOption: SearchVesselDto,
  ) {
    return await this.vesselsService.getVesselsGhgList(
      paginationOption,
      sortOption,
      searchOption,
    );
  }

  async getVesselsGhgsExcel(searchOption: SearchVesselDto) {
    const vessels = await this.vesselsService.getVesselsGhg(searchOption);

    if (vessels) {
      let workbook =
        await this.excelService.generateTableExcel<VesselsGhgTable>(
          vessels,
          getGHGTableHeader(searchOption.year),
          'Vessels GHG',
        );

      const searchParams = await this.fetchFilterParams(searchOption);
      workbook = await this.excelService.addFilterTableSheet(
        workbook,
        searchParams,
      );

      return workbook;
    } else {
      return null;
    }
  }

  async getVesselsGhgPdf(searchOption: SearchVesselDto, screenshot: string) {
    const vessels = await this.vesselsService.getVesselsGhg(searchOption);

    if (vessels) {
      const searchParams = await this.fetchFilterParams(searchOption);
      return this.pdfService.generateTablePdf<VesselsEtsTable>(
        vessels,
        getGHGTableHeader(searchOption.year),
        searchParams,
        screenshot,
      );
    } else {
      return null;
    }
  }

  async getVesselsGhgChart(id: number, year: number) {
    return await this.vesselsService.getGhgChartByCompany(id, year);
  }

  async getVesselsGhgKpi(id: number, year: number) {
    return await this.vesselsService.getGhgKpiByCompany(id, year);
  }

  async getTotalEmissions(id: number, year: number) {
    return await this.vesselsService.getTotalEmissionOfCompany(id, year);
  }
}
