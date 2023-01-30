import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workbook } from 'exceljs';

import { CreateVesselDto } from '../dto/create-vessel.dto';
import { UpdateVesselDto } from '../dto/update-vessel.dto';
import { Vessel } from '../entities/vessel.entity';
import { Port } from '../entities/port.entity';
import { Ghg } from '../entities/ghg.entity';
import { Fuel } from '../entities/fuel.entity';
import { VesselTrip } from '../../vessel-trips/entities/vessel-trip.entity';
import { Fleet } from '../../fleets/entities/fleet.entity';
import {
  PaginationDto,
  PaginationParamsDto,
} from '../../../shared/dtos/pagination.dto';
import { SortOrderDto } from '../../../shared/dtos/sort-order.dto';
import { SearchVesselDto } from '../dto/search-vessel.dto';
import {
  FuelFactors,
  GraphLevel,
  ABound,
  BBound,
  CBound,
  DBound,
  ABound_BC,
  BBound_BC,
  CBound_BC,
  DBound_BC,
  VoyageType,
  Roles,
} from '../../../shared/constants/global.constants';
import { User } from '../../users/entities/user.entity';
import { ComparisonReportDto, ReportType } from '../dto/comparison-report.dto';
import { ChartsQueryDto } from '../../../shared/dtos/charts-query.dto';
import { ExcelService } from '../../../shared/services/excel.service';
import {
  CIIReportResponse,
  ETSReportResponse,
  GHGReportResponse,
} from '../dto/vessel-response.dto';
import {
  CII_HEADER,
  ETS_HEADER,
  ETS_HEADER_PER_VOYAGE,
  ETS_REPORT_HEADER,
  ETS_REPORT_KPI,
  GHG_REPORT_HEADER,
  GHG_REPORT_KPI,
} from '../../../shared/constants/excel.constants';
import { PdfService } from '../../../shared/services/pdf.service';
import { VesselType } from '../entities/vessel-type.entity';
import { Company } from 'src/modules/companies/entities/company.entity';
import * as moment from 'moment';
import { IPayload } from '../../auth/auth.types';
import { GetCIIDataDto } from '../../third-party/dto/get-cii-data.dto';
// Todo: factor and rate should be provided.
const FACTOR = 0.7;
const RATE = 2.5;

@Injectable()
export class VesselsService {
  constructor(
    @InjectRepository(Vessel)
    private vesselsRepository: Repository<Vessel>,
    @InjectRepository(VesselTrip)
    private vesselTripRepository: Repository<VesselTrip>,
    @InjectRepository(Port)
    private portRepository: Repository<Port>,
    @InjectRepository(Ghg)
    private ghgRepository: Repository<Ghg>,
    @InjectRepository(Fuel)
    private fuelRepository: Repository<Fuel>,
    @InjectRepository(VesselType)
    private vesselTypeRepository: Repository<VesselType>,
    @InjectRepository(Fleet)
    private fleetRepository: Repository<Fleet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companiesRepository: Repository<Company>,
    private excelService: ExcelService,
    private readonly pdfService: PdfService,
  ) {}

  public generateAggregateCheckQueryString() {
    return `((
        (aggregate_tbl.aggregate_count IS NULL OR aggregate_tbl.aggregate_count = 0)
        AND vessel_trip.is_aggregate <> 1
      ) OR vessel_trip.is_aggregate = 1)`;
  }

  public generateCiiQueryString(year: number, fuelTypes: string[] = [], data?: GetCIIDataDto) {
    let emissionsQuery: string;

    if (fuelTypes && fuelTypes.length > 0) {
      const types = fuelTypes.map((type) => type.toUpperCase());
      const realFuelTypes = Object.keys(FuelFactors).filter((typeName) => types.some((type) => typeName.includes(type)));
      const fuelCalc = realFuelTypes
        .map((type) => `${type.toLowerCase()} * ${FuelFactors[type] || 0}`)
        .join(' + ');
      emissionsQuery = `SUM(${fuelCalc})`;
    } else {
      const emission = `(COALESCE(mgo, ${data?.mgo || 0}) * 3.206 + COALESCE(lfo, ${data?.lfo || 0}) * 3.151 + COALESCE(hfo, ${data?.hfo || 0}) * 3.114 + COALESCE(vlsfo, 0) * 3.114 + COALESCE(lng, 0) * 2.75 + COALESCE(vlsfo_ad, ${data?.vlsfo_ad || 0}) * 3.151 + COALESCE(vlsfo_xb, ${data?.vlsfo_xb || 0}) * 3.206 + COALESCE(vlsfo_ek, ${data?.vlsfo_ek || 0}) * 3.114 + COALESCE(lpg_pp, ${data?.lpg_pp || 0}) * 3 + COALESCE(lpg_bt, ${data?.lpg_bt || 0}) * 3.03 + COALESCE(bio_fuel, ${data?.bio_fuel || 0}) * 2.8)`;
      emissionsQuery = `COALESCE(SUM(${emission}), ${emission})`;
    }

    const vesselTypeFactorQuery = `IF(COALESCE(vessel_type.vessel_type, (SELECT vessel_type FROM vessel_type WHERE id = ${data?.vesselType || -1})) = 'Chemical Tanker' OR COALESCE(vessel_type.vessel_type, (SELECT vessel_type FROM vessel_type WHERE id = ${data?.vesselType || -1})) = 'Oil Tanker', 5247, IF(COALESCE(vessel_type.vessel_type, (SELECT vessel_type FROM vessel_type WHERE id = ${data?.vesselType || -1})) = 'Bulk Carrier', 4745, 0))`;
    const vesselTypePowQuery = `IF(COALESCE(vessel_type.vessel_type, (SELECT vessel_type FROM vessel_type WHERE id = ${data?.vesselType || -1})) = 'Chemical Tanker' OR COALESCE(vessel_type.vessel_type, (SELECT vessel_type FROM vessel_type WHERE id = ${data?.vesselType || -1})) = 'Oil Tanker', -0.61, IF(COALESCE(vessel_type.vessel_type, (SELECT vessel_type FROM vessel_type WHERE id = ${data?.vesselType || -1})) = 'Bulk Carrier', -0.622, -0.61))`;
    const target2019Query = `POW(COALESCE(vessel.dwt, ${data?.dwt?.[0] || null}), ${vesselTypePowQuery}) *  ${vesselTypeFactorQuery}`;
    const requiredQuery = `
      CASE
        WHEN ${year || 'year_tbl.year'} = 2019 THEN ${target2019Query}
        WHEN ${year || 'year_tbl.year'} = 2020 THEN ${target2019Query} * 0.99
        WHEN ${year || 'year_tbl.year'} = 2021 THEN ${target2019Query} * 0.98
        WHEN ${year || 'year_tbl.year'} = 2022 THEN ${target2019Query} * 0.97
        WHEN ${year || 'year_tbl.year'} = 2023 THEN ${target2019Query} * 0.95
        WHEN ${year || 'year_tbl.year'} = 2024 THEN ${target2019Query} * 0.93
        WHEN ${year || 'year_tbl.year'} = 2025 THEN ${target2019Query} * 0.91
        WHEN ${year || 'year_tbl.year'} = 2026 THEN ${target2019Query} * 0.89
        ELSE ${target2019Query} * 0.89
      END
    `;
    const DWTQuery = `IF(COALESCE(vessel_type.vessel_type, (SELECT vessel_type FROM vessel_type WHERE id = ${data?.vesselType || -1})) = 'Bulk Carrier', LEAST(COALESCE(vessel.dwt, ${data?.dwt?.[0] || 0}), 279000), COALESCE(vessel.dwt, ${data?.dwt?.[0] || 0}))`;
    const ciiQuery = `(${emissionsQuery} / (${DWTQuery} * COALESCE(SUM(distance_traveled), ${data?.distanceTravelled || 0}))) * 1000000`;
    const emissionsQueryEts: string = emissionsQuery;
    const ciiRateQuery = `(${ciiQuery}) / (${requiredQuery})`;
    const ciiDifferenceQuery = `(${ciiQuery}) - (${requiredQuery})`;

    // TO DO: Should check if we should use this over all queries.
    const selectBoundQuery = (bound, boundBC) => {
      return `IF(COALESCE(vessel_type.vessel_type, (SELECT vessel_type FROM vessel_type WHERE id = ${data?.vesselType || -1})) = 'Chemical Tanker' OR COALESCE(vessel_type.vessel_type, (SELECT vessel_type FROM vessel_type WHERE id = ${data?.vesselType || -1})) = 'Oil Tanker', ${bound}, IF(COALESCE(vessel_type.vessel_type, (SELECT vessel_type FROM vessel_type WHERE id = ${data?.vesselType || -1})) = 'Bulk Carrier', ${boundBC}, 0))`;
    };

    const categoryQuery = `
      CASE
        WHEN ROUND(${ciiRateQuery}, 3) <= ${selectBoundQuery(
      ABound,
      ABound_BC,
    )} THEN 'A'
        WHEN ROUND(${ciiRateQuery}, 3) > ${selectBoundQuery(ABound, ABound_BC)}
          AND ROUND(${ciiRateQuery}, 3) <= ${selectBoundQuery(
      BBound,
      BBound_BC,
    )} THEN 'B'
        WHEN ROUND(${ciiRateQuery}, 3) > ${selectBoundQuery(BBound, BBound_BC)}
          AND ROUND(${ciiRateQuery}, 3) <= ${selectBoundQuery(
      CBound,
      CBound_BC,
    )} THEN 'C'
        WHEN ROUND(${ciiRateQuery}, 3) > ${selectBoundQuery(CBound, CBound_BC)}
          AND ROUND(${ciiRateQuery}, 3) <= ${selectBoundQuery(
      DBound,
      DBound_BC,
    )} THEN 'D'
        WHEN ROUND(${ciiRateQuery}, 3) > ${selectBoundQuery(
      DBound,
      DBound_BC,
    )} THEN 'E'
        ELSE 'A'
      END
    `;

    const etsQuery = `
      CASE
        WHEN year_tbl.year = 2023 THEN 0.2
        WHEN year_tbl.year = 2024 THEN 0.45
        WHEN year_tbl.year = 2025 THEN 0.7
        ELSE 1
      END
    `;

    return {
      emissionsQuery,
      emissionsQueryEts,
      ciiQuery,
      DWTQuery,
      requiredQuery,
      ciiRateQuery,
      ciiDifferenceQuery,
      categoryQuery,
      etsQuery,
    };
  }

  public generateLeftJoinTable(tables: string[], isCII = false) {
    let joinTable = '';

    if (tables.includes('vessel_trip')) {
      joinTable += `LEFT JOIN vessel_trip ON vessel_trip.vessel = vessel.id${isCII ? ` and vessel_trip.journey_type = 'CII'` : ''}\n`;
    }

    if (tables.includes('vessel')) {
      joinTable += 'LEFT JOIN vessel ON vessel_trip.vessel = vessel.id\n';
    }

    if (tables.includes('vessel_type')) {
      joinTable +=
        'LEFT JOIN vessel_type ON vessel.vessel_type_id = vessel_type.id\n';
    }

    if (tables.includes('company')) {
      joinTable += 'LEFT JOIN company ON vessel.company_id = company.id\n';
    }

    if (tables.includes('fleet')) {
      joinTable += 'LEFT JOIN fleet ON vessel.fleet = fleet.id\n';
    }

    if (tables.includes('grade')) {
      joinTable += 'LEFT JOIN grade ON vessel_trip.id = grade.journey\n';
    }

    if (tables.includes('origin_port')) {
      joinTable +=
        'LEFT JOIN port AS origin_port ON vessel_trip.origin_port = origin_port.id\n';
    }

    if (tables.includes('destination_port')) {
      joinTable +=
        'LEFT JOIN port AS destination_port ON vessel_trip.destination_port = destination_port.id\n';
    }

    if (tables.includes('aggregate_tbl')) {
      joinTable +=
        `LEFT JOIN (
          SELECT
            COUNT(vet.id) AS aggregate_count, vessel.company_id
          FROM vessel_trip AS vet
          JOIN vessel_trip AS vt ON vet.id = vet.id
          LEFT JOIN vessel ON vet.vessel = vessel.id
          LEFT JOIN vessel_type ON vessel.vessel_type_id = vet.id
          WHERE
            vet.id <> vt.id
            AND vt.is_aggregate = 1
            AND vt.from_date <= vet.from_date
            AND vt.to_date >= vet.to_date
            GROUP BY vessel.company_id
        ) AS aggregate_tbl ON aggregate_tbl.company_id = vessel.company_id`;
    }

    if (tables.includes('year_tbl_group_by')) {
      joinTable += `
        LEFT JOIN (
          SELECT DATE_FORMAT(to_date, '%Y') AS year FROM vessel_trip GROUP BY year
        ) AS year_tbl ON year_tbl.year = DATE_FORMAT(to_date, '%Y')\n
      `;
    }

    if (
      tables.includes('year_tbl') ||
      tables.find((t) => t.includes('year_tbl:'))
    ) {
      const yearTbl = tables.find(
        (table) => table.includes('year_tbl:') || table === 'year_tbl',
      );
      const year = yearTbl.split(':')[1];

      joinTable += `
        LEFT JOIN (${
          year !== undefined
            ? `SELECT ${year} AS year`
            : "SELECT DATE_FORMAT(to_date, '%Y') AS year FROM vessel_trip"
        }) AS year_tbl ON year_tbl.year = DATE_FORMAT(to_date, '%Y')\n
      `;
    }

    if (tables.includes('month_tbl_group_by')) {
      joinTable += `
        LEFT JOIN (
          SELECT DATE_FORMAT(to_date, '%m') AS month FROM vessel_trip GROUP BY month
        ) AS month_tbl ON month_tbl.month = DATE_FORMAT(to_date, '%m')\n
      `;
    }

    if (tables.includes('month_tbl')) {
      joinTable += `
        LEFT JOIN (
          SELECT DATE_FORMAT(to_date, '%m') AS month FROM vessel_trip
        ) AS month_tbl ON month_tbl.month = DATE_FORMAT(to_date, '%m')\n
      `;
    }

    return joinTable;
  }

  private generateWhereQueryForList(
    companyId: number,
    searchOption: SearchVesselDto,
    field = 'list',
  ) {
    const {
      search,
      fleet,
      category,
      type,
      vesselAge,
      eedi,
      dwt,
      grossTonnage,
      netTonnage,
      propulsionPower,
    } = searchOption;
    const currentDate = new Date().toISOString();

    return `
      ${field}.name LIKE '%${search ? search : ''}%'
      ${
        companyId
          ? `AND ${field}.${
              field === 'vessel' ? 'company_id' : 'companyId'
            } = ${companyId}`
          : ''
      }
      ${fleet ? `AND ${field}.fleetId = ${fleet}` : ''}
      ${category ? `AND ${field}.category = '${category}'` : ''}
      ${type ? `AND ${field}.vessel_type = '${type}'` : ''}
      ${
        vesselAge
          ? `${
              vesselAge[0]
                ? `AND ${field}.created_at < ('${currentDate}' - INTERVAL ${vesselAge[0]} YEAR)`
                : ''
            }
            ${
              vesselAge[1]
                ? `AND ${field}.created_at > ('${currentDate}' - INTERVAL ${vesselAge[1]} YEAR)`
                : ''
            }`
          : ''
      }
      ${
        eedi
          ? `${eedi[0] ? `AND ${field}.eedi >= ${eedi[0]}` : ''}
            ${eedi[1] ? `AND ${field}.eedi <= ${eedi[1]}` : ''}`
          : ''
      }
      ${
        dwt
          ? `${dwt[0] ? `AND ${field}.dwt >= ${dwt[0]}` : ''}
             ${dwt[1] ? `AND ${field}.dwt <= ${dwt[1]}` : ''}`
          : ''
      }
      ${
        netTonnage
          ? `${
              netTonnage[0]
                ? `AND ${field}.net_tonnage >= ${netTonnage[0]}`
                : ''
            }
             ${
               netTonnage[1]
                 ? `AND ${field}.net_tonnage <= ${netTonnage[1]}`
                 : ''
             }`
          : ''
      }
      ${
        propulsionPower
          ? `${
              propulsionPower[0]
                ? `AND ${field}.propulsion_power >= ${propulsionPower[0]}`
                : ''
            }
             ${
               propulsionPower[1]
                 ? `AND ${field}.propulsion_power <= ${propulsionPower[1]}`
                 : ''
             }`
          : ''
      }
      ${
        grossTonnage
          ? `${
              grossTonnage[0]
                ? `AND ${field}.gross_tonnage >= ${grossTonnage[0]}`
                : ''
            }
             ${
               grossTonnage[1]
                 ? `AND ${field}.gross_tonnage <= ${grossTonnage[1]}`
                 : ''
             }`
          : ''
      }
    `;
  }

  private generateWhereQuery(options: ComparisonReportDto) {
    const {
      companyIds,
      vesselIds,
      fleets,
      vesselAge,
      vesselType,
      eedi,
      vesselWeight,
      dwt,
    } = options;

    const currentDate = new Date().toISOString();

    let companyQuery = '';
    if (companyIds) {
      if (companyIds[0] === 'other_companies') {
        companyQuery = `vessel.company_id != ${companyIds[1] || 0} and vessel.company_id IS NOT NULL`;
      } else {
        companyQuery = `vessel.company_id in ('${companyIds.join("','")}')`;
      }
    }

    return `
    WHERE
      1
      ${vesselIds ? `AND vessel.id in ('${vesselIds.join("','")}')` : ''}
      ${companyQuery ? `AND ${companyQuery}` : ''}
      ${
        fleets && fleets.length > 0
          ? `AND vessel.fleet in ('${fleets.join("','")}')`
          : ''
      }
      ${vesselType ? `AND vessel_type.id = '${vesselType}'` : ''}
      ${
        vesselAge && vesselAge.length > 0
          ? `
          ${
            vesselAge[0]
              ? `AND vessel.date_of_built < ('${currentDate}' - INTERVAL ${vesselAge[0]} YEAR)`
              : ''
          }
          ${
            vesselAge[1]
              ? `AND vessel.date_of_built > ('${currentDate}' - INTERVAL ${vesselAge[1]} YEAR)`
              : ''
          }
          `
          : ''
      }
      ${
        eedi && eedi.length > 0
          ? `${eedi[0] ? `AND vessel.eedi >= ${eedi[0]}` : ''}
             ${eedi[1] ? `AND vessel.eedi <= ${eedi[1]}` : ''}`
          : ''
      }
      ${
        dwt && dwt.length > 0
          ? `${dwt[0] ? `AND vessel.dwt >= ${dwt[0]}` : ''}
             ${dwt[1] > 0 ? `AND vessel.dwt <= ${dwt[1]}` : ''}`
          : ''
      }
      ${
        vesselWeight && vesselWeight.length > 0
          ? `${
              vesselWeight[0]
                ? `AND vessel.net_tonnage >= ${vesselWeight[0]}`
                : ''
            }
       ${vesselWeight[1] ? `AND vessel.net_tonnage <= ${vesselWeight[1]}` : ''}`
          : ''
      }
    `;
  }

  private generateCiiQuery(year: number) {
    const {
      emissionsQuery,
      ciiQuery,
      requiredQuery,
      ciiRateQuery,
      ciiDifferenceQuery,
      categoryQuery,
    } = this.generateCiiQueryString(+year);

    return `
      SELECT
        res.*,
        vessel2019_tbl.cii2019
      FROM
      (
        SELECT
          vessel.id,
          IF (ISNULL(vessel.name), 'N/A', vessel.name) AS name,
          vessel.imo,
          vessel.created_at,
          vessel_type.vessel_type,
          vessel.eedi,
          vessel.eexi,
          vessel.dwt,
          vessel.net_tonnage,
          vessel.propulsion_power,
          vessel.gross_tonnage,
          company.id AS companyId,
          company.name AS company,
          fleet.id AS fleetId,
          fleet.name AS fleet,
          vessel_trip.bunker_cost AS bunkerCost,
          ${year} AS year,
          IF (ISNULL(year_tbl.year), NULL, ${emissionsQuery}) AS emissions,
          SUM(distance_traveled) AS distanceTraveled,
          IF (ISNULL(year_tbl.year), NULL, ${ciiQuery}) AS cii,
          ${requiredQuery} AS requiredCII,
          IF (ISNULL(year_tbl.year), NULL, ${ciiRateQuery}) AS ciiRate,
          IF (ISNULL(year_tbl.year), ${ciiRateQuery}, ${ciiDifferenceQuery}) AS ciiDifference,
          IF (ISNULL(year_tbl.year), 'A', ${categoryQuery}) AS category
        FROM vessel
        ${this.generateLeftJoinTable([
          'vessel_trip',
          'vessel_type',
          'company',
          'fleet',
          `year_tbl:${year}`,
        ], true)}
        GROUP BY vessel.id, year_tbl.year
        ORDER BY year_tbl.year DESC
      ) AS res
      LEFT JOIN (
        SELECT
          vessel.id AS vessel2019Id,
          ${ciiQuery} AS cii2019
        FROM vessel
        LEFT JOIN vessel_trip ON vessel_trip.vessel = vessel.id
        LEFT JOIN vessel_type ON vessel.vessel_type_id = vessel_type.id
        WHERE
          DATE_FORMAT(to_date, '%Y') = 2019
        GROUP BY vessel.id
      ) AS vessel2019_tbl ON vessel2019_tbl.vessel2019Id = res.id
      LEFT JOIN eu_ets ON eu_ets.vessel = res.id AND eu_ets.year = res.year

      WHERE res.cii IS NOT NULL

      GROUP BY res.id
    `;
  }

  public generateEtsQueryString(year?: number | string) {
    const gradeFactorQuery = `
      (CASE 
        ${Object.entries(FuelFactors)
          .map((fuel) => `WHEN grade.grade = '${fuel[0]}' THEN ${fuel[1]}`)
          .join(' ')}
        ELSE 0
      END)
      `;

    // const etsYearRateQuery = `
    //   (CASE
    //     WHEN ${year || 'year'} = 2023 THEN 54.26 * 0.3333
    //     WHEN ${year || 'year'} = 2024 THEN 55.26 * 0.6666
    //     WHEN ${year || 'year'} >= 2025 THEN 56.26
    //     ELSE 0
    //   END)
    // `;

    // We will change 2024, >=2025 values
    const etsYearRateQuery = `
      (CASE
        WHEN ${year || 'year'} = 2023 THEN 85 * 0.3333
        WHEN ${year || 'year'} = 2024 THEN 85 * 0.6666
        WHEN ${year || 'year'} >= 2025 THEN 85
        ELSE 0
      END)
    `;

    const co2InboundEu = `SUM(${gradeFactorQuery} * grade.inbound_eu)`;
    const co2OutboundEu = `SUM(${gradeFactorQuery} * grade.outbound_eu)`;
    const co2withinEu = `SUM(${gradeFactorQuery} * grade.within_eu)`;
    const co2EuPort = `SUM(${gradeFactorQuery} * grade.eu_port)`;
    const totalCo2Emission = `(SUM(${gradeFactorQuery} * grade.inbound_eu) + SUM(${gradeFactorQuery} * grade.outbound_eu) + SUM(${gradeFactorQuery} * grade.within_eu) + SUM(${gradeFactorQuery} * grade.eu_port))`;
    const totalCo2Ets = `(0.5 * (SUM(${gradeFactorQuery} * grade.inbound_eu) + SUM(${gradeFactorQuery} * grade.outbound_eu)) + SUM(${gradeFactorQuery} * grade.within_eu) + SUM(${gradeFactorQuery} * grade.eu_port))`;
    const euaCost = `${etsYearRateQuery} * (0.5 * (SUM(${gradeFactorQuery} * grade.inbound_eu) + SUM(${gradeFactorQuery} * grade.outbound_eu)) + SUM(${gradeFactorQuery} * grade.within_eu) + SUM(${gradeFactorQuery} * grade.eu_port))`;
    const fpPercent = `((${etsYearRateQuery} * (0.5 * (SUM(${gradeFactorQuery} * grade.inbound_eu) + SUM(${gradeFactorQuery} * grade.outbound_eu)) + SUM(${gradeFactorQuery} * grade.within_eu) + SUM(${gradeFactorQuery} * grade.eu_port))) / SUM(vessel_trip.freight_profit)) * 100`;
    const bcPercent = `((${etsYearRateQuery} * (0.5 * (SUM(${gradeFactorQuery} * grade.inbound_eu) + SUM(${gradeFactorQuery} * grade.outbound_eu)) + SUM(${gradeFactorQuery} * grade.within_eu) + SUM(${gradeFactorQuery} * grade.eu_port))) / SUM(vessel_trip.bunker_cost)) * 100`;

    return {
      gradeFactorQuery,
      etsYearRateQuery,
      co2InboundEu,
      co2OutboundEu,
      co2withinEu,
      co2EuPort,
      totalCo2Emission,
      totalCo2Ets,
      euaCost,
      fpPercent,
      bcPercent,
    };
  }

  private generateEtsQuery(year, searchOption?: SearchVesselDto) {
    const {
      etsYearRateQuery,
      co2InboundEu,
      co2OutboundEu,
      co2withinEu,
      co2EuPort,
    } = this.generateEtsQueryString(year);

    const { categoryQuery } = this.generateCiiQueryString(+year);

    return `
      SELECT
        *,
        SUM(res.fp) AS totalFp,
        SUM(res.bc) AS totalBc,
        SUM(_co2InboundEu) AS co2InboundEu,
        SUM(_co2OutboundEu) AS co2OutboundEu,
        SUM(_co2withinEu) AS co2withinEu,
        SUM(_co2EuPort) AS co2EuPort,
        SUM(_fuelConsumption) AS fuelConsumption,
        SUM(_co2InboundEu) + SUM(_co2OutboundEu) + SUM(_co2withinEu) + SUM(_co2EuPort) AS totalCo2Emission,
        0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort) AS totalCo2Ets,
        (${etsYearRateQuery} * (0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort))) AS euaCost,
        ((${etsYearRateQuery} * (0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort))) / SUM(res.fp)) * 100 fpPercent,
        ((${etsYearRateQuery} * (0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort))) / SUM(res.bc)) * 100 bcPercent
      FROM
      (SELECT
        vessel.id,
        vessel.name,
        vessel.created_at,
        year_tbl.year,
        vessel.company_id AS companyId,
        vessel.eedi,
        vessel.eexi,
        vessel.dwt,
        vessel.propulsion_power,
        vessel.net_tonnage,
        vessel.gross_tonnage,
        fleet.id AS fleetId,
        fleet.name AS fleet,
        ${co2InboundEu} AS _co2InboundEu,
        ${co2OutboundEu} AS _co2OutboundEu,
        ${co2withinEu} AS _co2withinEu,
        ${co2EuPort} AS _co2EuPort,
        vessel_type.vessel_type,
        vessel_trip.freight_profit AS fp,
        vessel_trip.bunker_cost AS bc,
        vessel.imo AS imo,
        IF (ISNULL(year_tbl.year), 'A', ${categoryQuery}) AS category,
        SUM(grade.inbound_eu) + SUM(grade.outbound_eu) + SUM(grade.within_eu) + SUM(grade.eu_port) AS _fuelConsumption,
        maxToDate,
        minFromDate
      FROM vessel
      ${this.generateLeftJoinTable([
        'vessel_type',
        'vessel_trip',
        'grade',
        'fleet',
        `year_tbl:${year}`,
      ])}
      LEFT JOIN (
        SELECT
          MAX(vessel_trip.to_date) AS maxToDate,
          MIN(vessel_trip.to_date) AS minFromDate
        FROM vessel_trip
        ${this.generateLeftJoinTable([
          'vessel',
          'company',
          'year_tbl_group_by',
        ])}
        WHERE
          vessel_trip.journey_type = 'ETS'
          AND DATE_FORMAT(to_date, '%Y') = ${year}
      ) AS dates ON 1
      WHERE vessel_trip.journey_type = 'ETS' AND DATE_FORMAT(to_date, '%Y') = ${year}
      GROUP BY vessel_trip.id) AS res
      GROUP BY res.id
    `;
  }

  private generateGhgQuery(searchOption: SearchVesselDto) {
    const {
      year,
      search,
      fleet,
      companyId,
      vesselAge,
      eedi,
      dwt,
      grossTonnage,
      netTonnage,
      propulsionPower,
    } = searchOption;
    const currentDate = new Date().toISOString();

    return `
      SELECT
        vessel.id,
        vessel.name,
        vessel.imo,
        vessel.created_at,
        vessel.eedi,
        fleet.name AS fleet,
        IF (ISNULL(year_tbl.year), NULL, ghg.attained) AS attained,
        IF (ISNULL(year_tbl.year), NULL, ghg.required) AS required,
        ghg.year,
        IF ((ghg.required - ghg.attained) > 0, (ghg.required - ghg.attained), 0 ) AS excess
      FROM ghg
      RIGHT JOIN vessel ON vessel.id = ghg.vessel
      ${this.generateLeftJoinTable(['fleet', 'company', 'vessel_type'])}
      LEFT JOIN (
        SELECT ${year} AS year
      ) AS year_tbl ON year_tbl.year = ghg.year
      WHERE
        vessel.company_id = ${companyId}
        AND vessel.name LIKE '%${search ? search : ''}%'
        ${fleet ? `AND vessel.fleet = ${fleet}` : ''}
        ${
          vesselAge
            ? `${
                vesselAge[0]
                  ? `AND vessel.created_at < ('${currentDate}' - INTERVAL ${vesselAge[0]} YEAR)`
                  : ''
              }
              ${
                vesselAge[1]
                  ? `AND vessel.created_at > ('${currentDate}' - INTERVAL ${vesselAge[1]} YEAR)`
                  : ''
              }`
            : ''
        }
        ${
          eedi
            ? `${eedi[0] ? `AND vessel.eedi >= ${eedi[0]}` : ''}
               ${eedi[1] ? `AND vessel.eedi <= ${eedi[1]}` : ''}`
            : ''
        }
        ${
          dwt
            ? `${dwt[0] ? `AND vessel.dwt >= ${dwt[0]}` : ''}
               ${dwt[1] ? `AND vessel.dwt <= ${dwt[1]}` : ''}`
            : ''
        }
        ${
          eedi
            ? `${eedi[0] ? `AND vessel.eedi >= ${eedi[0]}` : ''}
                ${eedi[1] ? `AND vessel.eedi <= ${eedi[1]}` : ''}`
            : ''
        }
          ${
            dwt
              ? `${dwt[0] ? `AND vessel.dwt >= ${dwt[0]}` : ''}
                 ${dwt[1] ? `AND vessel.dwt <= ${dwt[1]}` : ''}`
              : ''
          }
          ${
            netTonnage
              ? `${
                  netTonnage[0]
                    ? `AND vessel.net_tonnage >= ${netTonnage[0]}`
                    : ''
                }
                 ${
                   netTonnage[1]
                     ? `AND vessel.net_tonnage <= ${netTonnage[1]}`
                     : ''
                 }`
              : ''
          }
          ${
            propulsionPower
              ? `${
                  propulsionPower[0]
                    ? `AND vessel.propulsion_power >= ${propulsionPower[0]}`
                    : ''
                }
                 ${
                   propulsionPower[1]
                     ? `AND vessel.propulsion_power <= ${propulsionPower[1]}`
                     : ''
                 }`
              : ''
          }
          ${
            grossTonnage
              ? `${
                  grossTonnage[0]
                    ? `AND vessel.gross_tonnage >= ${grossTonnage[0]}`
                    : ''
                }
                 ${
                   grossTonnage[1]
                     ? `AND vessel.gross_tonnage <= ${grossTonnage[1]}`
                     : ''
                 }`
              : ''
          }
      GROUP BY vessel.id
    `;
  }

  private async getListData(
    subQuery: string,
    whereQuery: string,
    paginationOption: PaginationParamsDto,
    sortOption: SortOrderDto,
  ) {
    const { page, limit } = paginationOption;
    const { sortBy, order } = sortOption;

    const totalCount = await this.vesselsRepository.manager
      .query(
        `SELECT count(*) as count FROM (${subQuery}) AS list WHERE ${whereQuery}`,
      )
      .then(([row]) => +row.count);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    paginationOption.page = Math.max(1, Math.min(totalPages, page));

    const pagination: PaginationDto = {
      ...paginationOption,
      totalCount,
      totalPages,
    };

    const listData = await this.vesselsRepository.manager.query(`
      SELECT * FROM (${subQuery}) AS list
      WHERE ${whereQuery}
      ORDER BY
        ${sortBy ? sortBy : 'id'}
        ${order ? order : 'ASC'}
      ${limit ? `LIMIT ${limit}` : ''}
      ${page ? `OFFSET ${(pagination.page - 1) * limit}` : ''}
    `);

    const listDataNoPagination = await this.vesselsRepository.manager.query(`
    SELECT * FROM (${subQuery}) AS list
    WHERE ${whereQuery}
  `);

    let totalDistance = 0;

    if (listDataNoPagination.some((data) => data.distanceTraveled)) {
      totalDistance = listDataNoPagination.reduce(
        (accum, curr) => accum + curr.distanceTraveled,
        0,
      );
    }

    return {
      listData,
      pagination,
      sortOrder: sortOption,
      totalDistance,
    };
  }

  create(createVesselDto: CreateVesselDto) {
    return this.vesselsRepository.save(createVesselDto);
  }

  snakeToCamel(str) {
    return str
      .toLowerCase()
      .replace(/([_][a-z])/g, (group) => group.toUpperCase().replace('_', ''));
  }

  parseVesselData(creaateVesselDto) {
    return Object.entries(creaateVesselDto).reduce((newObject, item) => {
      newObject[this.snakeToCamel(item[0])] = item[1];
      return newObject;
    }, {});
  }

  async createVessels(createVesselsDto: any[], userDto: IPayload) {
    const isSuperAdmin = userDto.role === Roles.SUPER_ADMIN;
    const user = await this.userRepository.findOne(userDto.id);
    const vessels = [];

    for (let i = 0; i < createVesselsDto.length; i++) {
      let {
        fleet,
        vessel_type,
        company,
        imo,
        date_of_built,
        email,
        ...createData
      } = createVesselsDto[i];

      const companyData = await this.getCompanyByName(company, email);

      if (!isSuperAdmin && companyData?.id !== user?.companyId) {
        throw new UnauthorizedException(`You can't create vessel for other companies`);
      }

      const vesselByImo = await this.findBy({ imo });

      if (vesselByImo.length > 0)
        throw new BadRequestException(
          `Entry with IMO ${imo} at row ${
            i + 1
          } already exists on the database`,
        );

      if (vessels.find((vessel) => vessel.imo === imo))
        throw new BadRequestException(
          `Duplicate entries found for IMO ${imo} at row ${i + 1}`,
        );

      const fleetData = await this.getFleetByName(fleet);
      const vesselType = await this.getVesselTypeByName(vessel_type);

      const parsedData = this.parseVesselData({
        ...createData,
        fleet: fleetData?.id,
        email,
        imo,
        date_of_built: moment(date_of_built, 'DD/MM/YYYY').toISOString(),
        company_id: companyData?.id,
        vessel_type_id: vesselType?.id,
      });

      vessels.push(parsedData);
    }

    return await this.vesselsRepository.save(vessels);
  }

  async getFleetByName(name: string) {
    const exist = await this.fleetRepository.findOne({
      where: { name },
    });
    if (!exist) {
      if (name) {
        return await this.fleetRepository.save({ name });
      } else {
        return null;
      }
    } else {
      return exist;
    }
  }

  async getVesselTypeByName(vessel_type: string) {
    const exist = await this.vesselTypeRepository.findOne({
      where: { vessel_type },
    });
    if (!exist) {
      if (vessel_type) {
        return await this.vesselTypeRepository.save({ vessel_type });
      } else {
        return null;
      }
    } else {
      return exist;
    }
  }

  async getCompanyByName(company: string, email: string) {
    const exist = await this.companiesRepository.findOne({
      where: { name: company },
    });
    if (!exist) {
      if (company) {
        return await this.companiesRepository.save({
          name: company,
          primaryContactName: '',
          primaryContactEmailAddress: email,
          contactPhoneNumber: '',
          packageType: '',
          country: '',
        });
      } else {
        return null;
      }
    } else {
      return exist;
    }
  }

  async findAll() {
    return this.vesselsRepository.find({
      relations: ['company', 'fleet'],
    });
  }

  findOne(id: number) {
    return this.vesselsRepository.findOne(
      { id },
      { relations: ['company', 'fleet', 'vesselType'] },
    );
  }

  async findByCompany(companyId: number) {
    return this.vesselsRepository.find({ companyId });
  }

  async findBy(searchParam: object) {
    const key = Object.keys(searchParam)[0];
    const value = Object.values(searchParam)[0];

    return this.vesselsRepository.find({ where: { [key]: value } });
  }

  update(id: number, updateVesselDto: UpdateVesselDto) {
    return this.vesselsRepository.update(id, updateVesselDto);
  }

  remove(id: number) {
    return this.vesselsRepository.delete(id);
  }

  async getVesselBoundCIIs(id: number, level) {
    const bounds = [];

    if (level === GraphLevel.VOYAGE || level === GraphLevel.TRIP) {
      const { requiredQuery, categoryQuery } = this.generateCiiQueryString(0);
      return await this.vesselTripRepository.manager
        .query(
          `
        SELECT
          ${requiredQuery} AS requiredCII,
          IF(vessel_type.vessel_type = 'Chemical Tanker' OR vessel_type.vessel_type = 'Oil Tanker', ${ABound}, IF(vessel_type.vessel_type = 'Bulk Carrier', ${ABound_BC}, 0)) * (${requiredQuery}) AS aBound,
          IF(vessel_type.vessel_type = 'Chemical Tanker' OR vessel_type.vessel_type = 'Oil Tanker', ${BBound}, IF(vessel_type.vessel_type = 'Bulk Carrier', ${BBound_BC}, 0)) * (${requiredQuery}) AS bBound,
          IF(vessel_type.vessel_type = 'Chemical Tanker' OR vessel_type.vessel_type = 'Oil Tanker', ${CBound}, IF(vessel_type.vessel_type = 'Bulk Carrier', ${CBound_BC}, 0)) * (${requiredQuery}) AS cBound,
          IF(vessel_type.vessel_type = 'Chemical Tanker' OR vessel_type.vessel_type = 'Oil Tanker', ${DBound}, IF(vessel_type.vessel_type = 'Bulk Carrier', ${DBound_BC}, 0)) * (${requiredQuery}) AS dBound,
          vessel_trip.voyage_type AS voyageType,
          ${categoryQuery} AS category
        FROM vessel
        ${this.generateLeftJoinTable([
          'vessel_trip',
          'vessel_type',
          'year_tbl_group_by',
        ])}
        WHERE
          vessel.id = ${id}
        GROUP BY vessel.id`,
        )
        .then(([row]) => row);
    } else {
      for (let year = 2019; year <= 2026; year++) {
        const { requiredQuery, categoryQuery } =
          this.generateCiiQueryString(year);
        const result = await this.vesselTripRepository.manager.query(`
        SELECT
          ${year} AS year,
          ${requiredQuery} AS requiredCII,
          ${ABound} * (${requiredQuery}) AS aBound,
          ${BBound} * (${requiredQuery}) AS bBound,
          ${CBound} * (${requiredQuery}) AS cBound,
          ${DBound} * (${requiredQuery}) AS dBound,
          vessel_trip.voyage_type AS voyageType,
          ${categoryQuery} AS category
        FROM vessel
        ${this.generateLeftJoinTable(['vessel_trip', 'vessel_type'])}
        WHERE
          vessel.id = ${id}
        GROUP BY year`);
        bounds.push(result[0]);
      }
      return bounds;
    }
  }

  async getVesselCIIChart(
    id: number,
    query: ChartsQueryDto,
    level: GraphLevel,
    fromDate: string,
    toDate: string,
  ) {
    const { ciiQuery, DWTQuery, emissionsQuery, categoryQuery } =
      this.generateCiiQueryString(0);
    const { year } = query;
    const aggregateQuery = this.generateAggregateCheckQueryString();

    if (level === GraphLevel.VOYAGE || level === GraphLevel.TRIP) {
      return await this.vesselTripRepository.manager.query(`
        SELECT
          ${level === GraphLevel.TRIP ? 'vessel_trip.id,' : ''}
          vessel_trip.voyage_id AS voyageId,
          vessel_trip.guid AS guid,
          vessel_trip.voyage_type as voyageType,
          vessel_trip.distance_traveled as distance,
          ${DWTQuery} as dwt,
          ${emissionsQuery} as emissions,
          vessel.id as vesselId,
          ${ciiQuery} AS cii,
          ${categoryQuery} AS category
        FROM vessel_trip
        ${this.generateLeftJoinTable([
          'vessel',
          'vessel_type',
          'year_tbl_group_by',
          'aggregate_tbl',
        ])}
        WHERE
          vessel_trip.journey_type = 'CII'
          AND vessel = ${id}
          ${fromDate ? `AND vessel_trip.from_date >= '${fromDate}'` : ''}
          ${toDate ? `AND vessel_trip.to_date <= '${toDate}'` : ''}
          AND (${aggregateQuery})
        GROUP BY ${
          level === GraphLevel.VOYAGE
            ? 'vessel_trip.guid'
            : 'vessel_trip.id'
        }
      `);
    } else {
      return await this.vesselTripRepository.manager.query(`
        SELECT
          ${level === GraphLevel.YEAR ? 'year_tbl.year AS "key",' : ''}
          ${level === GraphLevel.MONTH ? 'month_tbl.month AS "key",' : ''}
          ${ciiQuery} AS cii,
          ${categoryQuery} AS category
        FROM vessel_trip
        ${this.generateLeftJoinTable([
          'vessel_type',
          'vessel',
          'year_tbl_group_by',
          'month_tbl_group_by',
        ])}
        WHERE
          vessel_trip.journey_type = 'CII'
          AND vessel = ${id}
          ${level === GraphLevel.MONTH ? `AND year_tbl.year=${year}` : ''}
        GROUP BY ${level.toLowerCase()}_tbl.${level.toLowerCase()}
      `);
    }
  }

  async getVesselStackBarChart({
    id,
    fromDate,
    toDate,
    vesselId,
    companyId,
    voyageType = [VoyageType.ACTUAL, VoyageType.PREDICTED],
  }: {
    id?: string;
    fromDate: string;
    toDate: string;
    vesselId?: string;
    companyId?: string;
    voyageType?: VoyageType[];
  }) {
    const aggregateQuery = this.generateAggregateCheckQueryString();

    return await this.vesselTripRepository.manager.query(`
      SELECT
        vessel_trip.voyage_id AS voyageId,
        vessel_trip.guid AS guid,
        SUM(coalesce(mgo, 0) * 3.206) AS mgo,
        SUM(coalesce(lfo, 0) * 3.151) AS lfo,
        SUM(coalesce(hfo, 0) * 3.114) AS hfo,
        SUM(coalesce(vlsfo, 0) * 3.114) AS vlsfo,
        SUM(coalesce(lng, 0) * 2.75) AS lng,
        SUM(coalesce(vlsfo_ad, 0) * 3.151) AS vlsfo_ad,
        SUM(coalesce(vlsfo_xb, 0) * 3.206) AS vlsfo_xb,
        SUM(coalesce(vlsfo_ek, 0) * 3.114) AS vlsfo_ek,
        SUM(coalesce(lpg_pp, 0) * 3) AS lpg_pp,
        SUM(coalesce(lpg_bt, 0) * 3.03) AS lpg_bt,
        SUM(coalesce(bio_fuel, 0) * 2.8) AS bio_fuel,
        SUM(vessel_trip.distance_traveled) AS distanceTraveled,
        vessel_trip.voyage_type as voyageType
      FROM vessel_trip
      ${this.generateLeftJoinTable(['vessel', 'year_tbl_group_by', 'aggregate_tbl'])}
      WHERE
        vessel_trip.journey_type = 'CII'
        ${`AND vessel_trip.voyage_type in ('${voyageType
          .filter((type) => type !== VoyageType.ARCHIVED)
          .join("','")}')`}
        ${id ? `AND vessel = ${id}` : ''}
        ${fromDate ? `AND vessel_trip.from_date >= '${fromDate}'` : ''}
        ${toDate ? `AND vessel_trip.to_date <= '${toDate}'` : ''}
        ${vesselId ? `AND vessel.id = ${vesselId}` : ''}
        ${companyId ? `AND vessel.company_id = ${companyId}` : ''}
        ${`AND (${aggregateQuery})`}
      GROUP BY vessel_trip.guid
    `);
  }

  async getVesselCIIKpi(id: number, year: number) {
    const { emissionsQuery, ciiQuery, categoryQuery } =
      this.generateCiiQueryString(0);

    return await this.vesselTripRepository.manager
      .query(
        `
      SELECT
        ${year} AS year,
        IF(ISNULL(year_tbl.year), 0, ${emissionsQuery}) AS emissions,
        IF(ISNULL(year_tbl.year), 0, SUM(distance_traveled)) AS distanceTraveled,
        IF(ISNULL(year_tbl.year), 0, ${ciiQuery}) AS cii,
        IF(ISNULL(year_tbl.year), 'A', ${categoryQuery}) AS category,
        vessel_type.vessel_type AS vesselType,
        vessel.dwt
      FROM vessel_trip
      ${this.generateLeftJoinTable([
        'vessel',
        'vessel_type',
        `year_tbl:${year}`,
      ])}
      WHERE
        vessel_trip.journey_type = 'CII'
        AND vessel = ${id}
        AND year_tbl.year = ${year}
      GROUP BY year_tbl.year
    `,
      )
      .then(([res]) => res);
  }

  async getVesselCII(
    id: number,
    mode: string,
    fromDate?: string,
    toDate?: string,
    voyageType: VoyageType[] = [VoyageType.ACTUAL, VoyageType.PREDICTED],
  ) {
    const {
      emissionsQuery,
      ciiQuery,
      requiredQuery,
      ciiRateQuery,
      ciiDifferenceQuery,
      categoryQuery,
    } = this.generateCiiQueryString(0);

    return await this.vesselTripRepository.manager.query(`
      SELECT
        ${
          mode === GraphLevel.VOYAGE
            ? 'vessel_trip.voyage_id as voyageId, vessel_trip.guid as guid,'
            : 'year_tbl.year,'
        }
        ${emissionsQuery} AS emissions,
        SUM(distance_traveled) AS distanceTraveled,
        SUM(mgo) AS mgo,
        SUM(lfo) AS lfo,
        SUM(hfo) AS hfo,
        SUM(vlsfo_ad) AS vlsfo_ad,
        SUM(vlsfo_xb) AS vlsfo_xb,
        SUM(vlsfo_ek) AS vlsfo_ek,
        SUM(lpg_pp) AS lpg_pp,
        SUM(lpg_bt) AS lpg_bt,
        SUM(bio_fuel) AS bio_fuel,
        ${ciiQuery} AS cii,
        ${requiredQuery} AS requiredCII,
        ${ciiRateQuery} AS ciiRate,
        ${ciiDifferenceQuery} AS ciiDifference,
        ${categoryQuery} AS category,
        ${ABound} * (${requiredQuery}) AS aBound,
        ${BBound} * (${requiredQuery}) AS bBound,
        ${CBound} * (${requiredQuery}) AS cBound,
        ${DBound} * (${requiredQuery}) AS dBound,
        ${ciiQuery} AS cii
      FROM vessel_trip
      ${this.generateLeftJoinTable([
        'vessel',
        'vessel_type',
        'year_tbl_group_by',
      ])}
      WHERE
        vessel_trip.journey_type = 'CII'
        ${`AND vessel_trip.voyage_type in ('${voyageType.join("','")}')`}
        AND vessel = ${id}
        ${
          mode === GraphLevel.VOYAGE && fromDate
            ? `AND vessel_trip.from_date >= '${fromDate}'`
            : ''
        }
        ${
          mode === GraphLevel.VOYAGE && toDate
            ? `AND vessel_trip.to_date <= '${toDate}'`
            : ''
        }
      GROUP BY ${
        mode === GraphLevel.VOYAGE ? 'vessel_trip.guid' : 'year_tbl.year'
      }
      ${
        mode === GraphLevel.VOYAGE ? '' : 'ORDER BY year_tbl.year'
      }
    `);
  }

  async getAllPorts() {
    return await this.portRepository.find();
  }

  async getGhg(id: number, year: number) {
    return await this.ghgRepository.findOne({
      where: { vessel: id, year },
    });
  }

  async getFuels() {
    return this.fuelRepository.find();
  }

  async getVesselTypes() {
    return await this.vesselTypeRepository
      .createQueryBuilder('vessel_type')
      .select(['id AS id', 'vessel_type AS name'])
      .execute();
  }

  async getVesselsList(
    paginationOption: PaginationParamsDto,
    sortOption: SortOrderDto,
    searchOption: SearchVesselDto,
    user: IPayload,
  ) {
    if (user.role !== Roles.SUPER_ADMIN) {
      const me = await this.userRepository.findOne(user.id);
      searchOption.companyId = me.companyId;
    }

    let { year } = searchOption;
    const companyId = searchOption.companyId;

    if (!year) {
      year = new Date().getFullYear();
    }

    const subQuery = this.generateCiiQuery(year);// .replace('WHERE res.cii IS NOT NULL', '');
    const whereQuery = this.generateWhereQueryForList(companyId, searchOption);

    return this.getListData(subQuery, whereQuery, paginationOption, sortOption);
  }

  async getVessels(searchOption: SearchVesselDto) {
    let { year } = searchOption;
    const { search, fleet, category } = searchOption;
    const companyId = searchOption.companyId;

    if (!year) {
      year = new Date().getFullYear();
    }

    const subQuery = this.generateCiiQuery(year);

    const whereQuery = `
        list.name LIKE '%${search ? search : ''}%'
        AND list.cii IS NOT NULL
        ${companyId ? `AND list.companyId = ${companyId}` : ''}
        ${fleet ? `AND list.fleetId = ${fleet}` : ''}
        ${category ? `AND list.category = '${category}'` : ''}
    `;

    return await this.vesselsRepository.manager.query(
      `SELECT * FROM (${subQuery}) AS list WHERE ${whereQuery}`,
    );
  }

  async getVesselsCiiKpiByCompany(
    companyId: number,
    year: number,
    type: string,
  ) {
    const { emissionsQuery } = this.generateCiiQueryString(year);
    const subQuery = `
      SELECT
        SUM(emissions) AS totalEmissions
      FROM (
        SELECT
          vessel.id,
          year_tbl.year,
          IF(ISNULL(year_tbl.year), NULL, ${emissionsQuery}) AS emissions
        FROM vessel
        ${this.generateLeftJoinTable([
          'vessel_trip',
          'vessel_type',
          `year_tbl:${year}`,
        ])}
        WHERE
          vessel_type = '${type}'
          AND vessel_trip.journey_type = 'CII'
          AND company_id = ${companyId}
          AND year_tbl.year = ${year} 
        GROUP BY vessel.id
      ) AS list
    `;

    return await this.vesselsRepository.manager
      .query(subQuery)
      .then(([row]) => ({
        totalEmissions: row.totalEmissions | 0,
        imoAverage: 2.6,
      }));
  }

  async getVesselsFuelCostByBunkeringCompany(companyId: number) {
    const { emissionsQuery } = this.generateCiiQueryString(0);

    // Todo: Total fuel cost sample should be provided
    const totalFuelCost = 100000;

    return await this.vesselTripRepository.manager
      .query(
        `
        SELECT
          year_tbl.year AS year,
          ${totalFuelCost} / (${emissionsQuery}) AS data
        FROM vessel
        ${this.generateLeftJoinTable(['vessel_trip', 'year_tbl'])}
        WHERE
          company_id = ${companyId}
        GROUP BY year_tbl.year
      `,
      )
      .then((res) => res.filter((row) => !!row.year));
  }

  async getVesselsEuaByBunkeringCompany(companyId: number) {
    const { etsQuery, emissionsQuery } = this.generateCiiQueryString(0);

    return await this.vesselTripRepository.manager
      .query(
        `
        SELECT
          vessel_trip.id,
          ${etsQuery} * ${emissionsQuery} * ${FACTOR} * ${RATE} AS euaCost
        FROM vessel
        ${this.generateLeftJoinTable(['vessel_trip', 'year_tbl'])}
        WHERE
          company_id = ${companyId}
        GROUP BY vessel_trip.id
      `,
      )
      .then((res) =>
        res
          .filter((row) => !!row.id)
          .map((row) => ({ ...row, name: `Vessel ${row.id}` })),
      );
  }

  async getVesselsCIIChartByCompany(
    companyId: number,
    query: ChartsQueryDto,
    level: GraphLevel,
  ) {
    const { ciiQuery, requiredQuery, categoryQuery } = this.generateCiiQueryString(0);
    const { year, month, type } = query;
    const aggregateQuery = this.generateAggregateCheckQueryString();

    return await this.vesselTripRepository.manager.query(`
      SELECT
          vessel.id,
          vessel.name,
          ${level === GraphLevel.YEAR ? 'year_tbl.year AS "key",' : ''}
          ${level === GraphLevel.MONTH ? 'month_tbl.month AS "key",' : ''}
          ${level === GraphLevel.VOYAGE ? 'vessel_trip.id AS "key", vessel_trip.voyage_id as voyageId, vessel_trip.guid as guid,' : ''}
          ${ciiQuery} / ${requiredQuery} AS cii,
          ${categoryQuery} AS category
        FROM vessel_trip
        ${this.generateLeftJoinTable([
          'vessel',
          'vessel_type',
          'year_tbl',
          'month_tbl_group_by',
          'aggregate_tbl',
        ])}
        WHERE
          vessel_type = '${type}'
          AND vessel.company_id = ${companyId}
          AND vessel_trip.journey_type = 'CII'
          ${level === GraphLevel.MONTH ? `AND year_tbl.year=${year}` : ''}
          ${(level === GraphLevel.VOYAGE && month) ? `AND month_tbl.month=${month}` : ''}
          AND (${aggregateQuery})
        GROUP BY vessel.id, ${
          level !== GraphLevel.VOYAGE
            ? `${level.toLowerCase()}_tbl.${level.toLowerCase()}`
            : 'vessel_trip.id'
        }
        ORDER BY from_date
    `);
  }

  async getVesselsCIIChartByBunkeringCompany(
    companyId: number,
    query: ChartsQueryDto,
    level: GraphLevel,
  ) {
    const { ciiQuery } = this.generateCiiQueryString(0);
    const { year, month } = query;

    const vessels = await this.findByCompany(companyId);

    const existCiiData = await this.vesselTripRepository.manager
      .query(
        `
        SELECT
            vessel.id,
            vessel.name,
            ${level === GraphLevel.YEAR ? 'year_tbl.year AS "key",' : ''}
            ${level === GraphLevel.MONTH ? 'month_tbl.month AS "key",' : ''}
            ${level === GraphLevel.VOYAGE ? 'vessel_trip.id AS "key",' : ''}
            ${ciiQuery} AS cii
          FROM vessel_trip
          ${this.generateLeftJoinTable([
            'vessel',
            'vessel_type',
            'year_tbl',
            'month_tbl_group_by',
          ])}
          WHERE
            vessel.company_id = ${companyId}
            AND vessel_trip.journey_type = 'CII'
            ${level === GraphLevel.MONTH ? `AND year_tbl.year=${year}` : ''}
            ${level === GraphLevel.VOYAGE ? `AND month_tbl.month=${month}` : ''}
          GROUP BY vessel.id, ${
            level !== GraphLevel.VOYAGE
              ? `${level.toLowerCase()}_tbl.${level.toLowerCase()}`
              : 'vessel_trip.id'
          }
        `,
      )
      .then((result) =>
        result.reduce((result, vessel) => {
          if (result.find((item) => item.id === vessel.id)) {
            result
              .find((item) => item.id === vessel.id)
              .data.push({
                key: vessel.key,
                cii: vessel.cii,
              });
          } else {
            result.push({
              id: vessel.id,
              name: vessel.name,
              data: [{ key: vessel.key, cii: vessel.cii }],
            });
          }
          return result;
        }, []),
      );

    const ciiChart = vessels.map((vessel) => {
      const existVessel = existCiiData.find((item) => item.id === vessel.id);
      return existVessel
        ? existVessel
        : { id: vessel.id, name: vessel.name, data: [] };
    });

    const bunkeringChart = await this.vesselTripRepository.manager
      .query(
        `
      SELECT
        vessel.id,
        eu_ets.year,
        eu_ets.bunker_cost AS bunkerCost
      FROM vessel
      LEFT JOIN eu_ets ON eu_ets.vessel = vessel.id
      WHERE
        vessel.company_id = ${companyId}
      GROUP BY vessel.id, eu_ets.year
    `,
      )
      .then((result) =>
        result.reduce((result, vessel) => {
          if (result.find((item) => item.id === vessel.id)) {
            result
              .find((item) => item.id === vessel.id)
              .data.push({
                key: vessel.year,
                bunkerCost: vessel.bunkerCost,
              });
          } else {
            result.push({
              id: vessel.id,
              name: vessel.name,
              data: [{ key: vessel.year, bunkerCost: vessel.bunkerCost }],
            });
          }
          return result;
        }, []),
      );

    return {
      ciiChart,
      bunkeringChart,
    };
  }

  async getVesselsCategoryChartByCompany(
    companyId: number,
    query: ChartsQueryDto,
    level: GraphLevel,
  ) {
    const { categoryQuery } = this.generateCiiQueryString(0);
    const { year, month, type } = query;
    const aggregateQuery = this.generateAggregateCheckQueryString();

    return await this.vesselTripRepository.manager.query(`
    SELECT
        vessel.id,
        vessel.name,
        ${level === GraphLevel.YEAR ? 'year_tbl.year AS "key",' : ''}
        ${level === GraphLevel.MONTH ? 'month_tbl.month AS "key",' : ''}
        ${level === GraphLevel.VOYAGE ? 'vessel_trip.id AS "key", vessel_trip.voyage_id as voyageId, vessel_trip.guid as guid,' : ''}
        ${categoryQuery} AS category
      FROM vessel
      ${this.generateLeftJoinTable([
        'vessel_trip',
        'vessel_type',
        'year_tbl',
        'month_tbl_group_by',
        'aggregate_tbl',
      ])}
      WHERE
        vessel.company_id = ${companyId}
        AND vessel_trip.journey_type = 'CII'
        AND vessel_type.vessel_type = '${type}'
        ${level === GraphLevel.MONTH ? `AND year_tbl.year=${year}` : ''}
        ${(level === GraphLevel.VOYAGE && month) ? `AND month_tbl.month=${month}` : ''}
        AND (${aggregateQuery})
      GROUP BY vessel.id, ${
        level !== GraphLevel.VOYAGE
          ? `${level.toLowerCase()}_tbl.${level.toLowerCase()}`
          : 'vessel_trip.id'
      }
      ORDER BY from_date
    `);
  }

  async getVesselsEtsChartByCompany(companyId: number, year: number) {
    const { totalCo2Ets, totalCo2Emission } = this.generateEtsQueryString(year);
    const aggregateQuery = this.generateAggregateCheckQueryString();

    const subQuery = `
      SELECT
        vessel.id,
        vessel.name,
        ${year} as year,
        IF(ISNULL(year_tbl.year), 0, ${totalCo2Emission}) AS emission,
        IF(ISNULL(year_tbl.year), 0, ${totalCo2Ets}) AS ets
      FROM vessel
      ${this.generateLeftJoinTable([
        'vessel_trip',
        'grade',
        `year_tbl:${year}`,
        'month_tbl_group_by',
        'aggregate_tbl',
      ])}
      WHERE
        vessel.company_id = ${companyId}
        AND year_tbl.year = ${year}
        ANd (${aggregateQuery})
      GROUP BY vessel.id
    `;

    return await this.vesselTripRepository.manager.query(subQuery);
  }

  async getVesselsCostsChartByCompany(companyId: number, year: number) {
    const { euaCost } = this.generateEtsQueryString(year);
    const aggregateQuery = this.generateAggregateCheckQueryString();

    const subQuery = `
      SELECT  
        vessel.id,
        vessel.name,
        ${year} as year,
        IF(ISNULL(year_tbl.year), 0, ${euaCost}) AS euaCost
      FROM vessel
      ${this.generateLeftJoinTable([
        'vessel_trip',
        'grade',
        `year_tbl:${year}`,
        'aggregate_tbl',
      ])}
      WHERE
        vessel.company_id = ${companyId}
        AND (${aggregateQuery})
      GROUP BY vessel.id
    `;

    const costSubQuery = `
      SELECT
        res.id,
        SUM(_bunkerCost) AS bunkerCost,
        SUM(_freightProfit) AS freightProfit
      FROM
        (SELECT
          vessel.id,
          IF(ISNULL(year_tbl.year), 0, vessel_trip.bunker_cost) AS _bunkerCost,
          IF(ISNULL(year_tbl.year), 0, vessel_trip.freight_profit) AS _freightProfit
        FROM vessel
        ${this.generateLeftJoinTable([
          'vessel_trip',
          'grade',
          'year_tbl_group_by',
        ])}
        WHERE
          vessel_trip.journey_type = 'ETS'
          AND vessel.company_id = ${companyId}
        GROUP BY vessel_trip.id) AS res
        GROUP BY res.id
	    `;

    return await this.vesselTripRepository.manager.query(`
      SELECT * FROM (${subQuery}) as emissionsList
      LEFT JOIN (${costSubQuery}) as costList ON emissionsList.id = costList.id
    `);
  }

  async getVesselsCIIReport(
    options: ComparisonReportDto,
    query: ChartsQueryDto,
    level: GraphLevel,
    isReport?: boolean,
  ): Promise<CIIReportResponse> {
    const { fuels, year } = options;

    const { emissionsQuery, ciiQuery } = this.generateCiiQueryString(0, fuels);
    const whereQuery = this.generateWhereQuery(options);

    const { year: graphYear, month } = query;

    const subQuery = `
      SELECT
        vessel.id,
        vessel.name,
        IF(vessel.dwt >= 279000, 279000, vessel.dwt) AS dwt,
        vessel.net_tonnage,
        ${level === GraphLevel.YEAR ? 'year_tbl.year AS "key",' : ''}
        ${level === GraphLevel.MONTH ? 'month_tbl.month AS "key",' : ''}
        ${level === GraphLevel.VOYAGE ? 'vessel_trip.id AS "key", vessel_trip.voyage_id AS "voyageId", vessel_trip.guid AS "guid",' : ''}
        ${emissionsQuery} AS emissions,
        ${ciiQuery} AS cii
      FROM vessel
      ${this.generateLeftJoinTable([
        'vessel_trip',
        'vessel_type',
        `year_tbl:${year}`,
        'month_tbl_group_by',
      ])}
      ${whereQuery}
        AND vessel_trip.journey_type = 'CII'
        AND year = ${year || new Date().getFullYear()}
        ${level === GraphLevel.MONTH ? `AND year_tbl.year=${graphYear}` : ''}
        ${(level === GraphLevel.VOYAGE && month) ? `AND month_tbl.month=${month}` : ''}
      GROUP BY vessel.id, ${
        level !== GraphLevel.VOYAGE
          ? `${level.toLowerCase()}_tbl.${level.toLowerCase()}`
          : 'vessel_trip.id'
      }
    `;

    const result = await this.vesselsRepository.manager.query(subQuery);

    const chartData = isReport
      ? result
      : result.reduce((result, vessel) => {
          if (result.find((item) => item.id === vessel.id)) {
            result
              .find((item) => item.id === vessel.id)
              .data.push({ key: vessel.key, name: vessel.voyageId, dwt: vessel.dwt, cii: vessel.cii });
          } else {
            result.push({
              id: vessel.id,
              name: vessel.name,
              data: [{ key: vessel.key, name: vessel.voyageId, dwt: vessel.dwt, cii: vessel.cii }],
              ...(level === GraphLevel.MONTH && { year: graphYear }),
            });
          }
          return result;
        }, []);

    const totalEmissions = await this.vesselsRepository.manager
      .query(
        `
        SELECT
          SUM(emissions) AS totalEmission
        FROM (
          SELECT
            DATE_FORMAT(to_date, '%Y') AS year,
            ${emissionsQuery} AS emissions
          FROM vessel
          ${this.generateLeftJoinTable([
            'vessel_trip',
            'vessel_type',
            `year_tbl:${year}`
          ])}
          ${whereQuery}
          GROUP BY vessel.id, year_tbl.year
        ) AS res
        WHERE year = ${year || new Date().getFullYear()}
        GROUP BY year
      `,
      )
      .then(([res]) => +res?.totalEmission || 0);

    return {
      totalEmissions,
      chartLevel: level,
      chartData,
      year,
    };
  }

  async getVesselsEtsReport(
    options: ComparisonReportDto,
  ): Promise<ETSReportResponse> {
    const { year } = options;

    const { totalCo2Ets, totalCo2Emission, euaCost } =
      this.generateEtsQueryString(year);
    const whereQuery = this.generateWhereQuery(options);

    const subQuery = `
      SELECT  
        vessel.id,
        vessel.name,
        vessel.dwt,
        vessel.net_tonnage,
        year_tbl.year,
        vessel.company_id AS companyId,
        IF(ISNULL(year_tbl.year), 0, ${totalCo2Emission}) AS emissions,
        IF(ISNULL(year_tbl.year), 0, ${totalCo2Ets}) AS ets,
        IF(ISNULL(year_tbl.year), NULL, ${euaCost}) AS euaCost
      FROM vessel
      ${this.generateLeftJoinTable([
        'vessel_trip',
        'grade',
        `year_tbl:${year}`,
      ])}
      ${whereQuery}
        AND year_tbl.year = ${year}
      GROUP BY vessel.id
    `;

    const chartData = await this.vesselsRepository.manager.query(subQuery);

    const totalValues = await this.vesselsRepository.manager
      .query(
        `
        SELECT
          SUM(emissions) AS totalEmissions,
          SUM(emissions) AS totalEuEmissions,
          SUM(ets) AS totalEts,
          SUM(euaCost) AS totalEuaCost
        FROM (${subQuery}) AS res
        WHERE year = ${year || new Date().getFullYear()}
        GROUP BY year
      `,
      )
      .then(
        ([res]) =>
          res || {
            totalEmissions: 0,
            totalEts: 0,
            totalEuaCost: 0,
            totalEuEmissions: 0,
          },
      );

    return {
      ...totalValues,
      chartData,
      year,
    };
  }

  async getVesselsGhgReport(
    options: ComparisonReportDto,
  ): Promise<GHGReportResponse> {
    const year = options.year || new Date().getFullYear();

    const whereQuery = this.generateWhereQuery(options);

    const subQuery = `
      SELECT
        vessel.id,
        vessel.name,
        ghg.attained,
        ghg.required,
        ghg.year,
        IF ((ghg.required - ghg.attained) >= 0, (ghg.required - ghg.attained), 0 ) AS excess,
        IF ((ghg.required - ghg.attained) < 0, (ghg.required - ghg.attained), 0 ) AS missing,
        ghg.required - ghg.attained AS netComplianceUnits,
        IF (ghg.attained > ghg.required, true, false) AS hasPenalty
      FROM ghg
      LEFT JOIN vessel ON vessel.id = ghg.vessel
      LEFT JOIN fleet ON vessel.fleet = fleet.id
      LEFT JOIN vessel_type ON vessel.vessel_type_id = vessel_type.id
      LEFT JOIN company ON vessel.company_id = company.id
      ${whereQuery}
        AND ghg.year = ${year} 
      GROUP BY vessel.id
    `;

    const totalData = await this.vesselsRepository.manager
      .query(
        `
          SELECT
            SUM(netComplianceUnits) AS totalNetComplianceUnits,
            SUM(excess) AS excessComplianceUnits
          FROM (${subQuery}) AS res
        `,
      )
      .then(([res]) => res);

    const excessVesselCount = await this.vesselsRepository.manager
      .query(
        `
          SELECT
            COUNT(id) AS count
          FROM (${subQuery}) AS res
          WHERE
            excess > 0
        `,
      )
      .then(([res]) => +res.count);

    const penaltyVesselCount = await this.vesselsRepository.manager
      .query(
        `
          SELECT
            COUNT(id) AS count
          FROM (${subQuery}) AS res
          WHERE
            hasPenalty = 1
        `,
      )
      .then(([res]) => +res.count);

    const chartData = await this.vesselsRepository.manager.query(subQuery);

    return {
      ...totalData,
      totalPenalties: 0,
      excessVesselCount,
      penaltyVesselCount,
      chartData,
      year,
    };
  }

  async getListForReport(options: ComparisonReportDto) {
    const whereQuery = this.generateWhereQuery(options);

    return await this.vesselsRepository.manager.query(`
      SELECT
        vessel.id,
        vessel.name
      FROM vessel
      ${whereQuery}
    `);
  }

  async getTotalEmissionOfCompany(companyId: number, year: number) {
    const data = await this.vesselTripRepository.manager.query(`
      SELECT
        SUM(mgo * 3.206 + lfo * 3.151 + hfo * 3.114 + vlsfo * 3.114 + lng + 2.75) AS totalEmissions
      FROM vessel_trip
      LEFT JOIN vessel ON vessel_trip.vessel = vessel.id
      WHERE
        vessel.company_id = ${companyId}
        AND DATE_FORMAT(to_date, '%Y') = ${year}
    `);
    return data[0]?.totalEmissions;
  }

  async getVesselsGhgList(
    paginationOption: PaginationParamsDto,
    sortOption: SortOrderDto,
    searchOption: SearchVesselDto,
  ) {
    const { page, limit } = paginationOption;
    const { sortBy, order } = sortOption;

    const query = this.generateGhgQuery(searchOption);

    const totalCount = await this.vesselsRepository.manager
      .query(`SELECT count(*) as count FROM (${query}) as content`)
      .then(([row]) => +row.count);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    paginationOption.page = Math.max(1, Math.min(totalPages, page));

    const pagination: PaginationDto = {
      ...paginationOption,
      totalCount,
      totalPages,
    };

    const listData = await this.vesselsRepository.manager.query(`
      ${query}
      ORDER BY
        ${sortBy ? sortBy : 'vessel.id'}
        ${sortBy ? order : ''}
      ${limit ? `LIMIT ${limit}` : ''}
      ${page ? `OFFSET ${(pagination.page - 1) * limit}` : ''}
    `);

    return {
      listData,
      pagination,
      sortOrder: sortOption,
    };
  }

  async getVesselsGhg(searchOption: SearchVesselDto) {
    const query = this.generateGhgQuery(searchOption);

    return this.vesselsRepository.manager.query(query);
  }

  async getGhgChartByCompany(companyId: number, year: number) {
    return await this.vesselsRepository.manager.query(`
      SELECT
        vessel.name,
        ghg.attained,
        ghg.required,
        ghg.year,
        IF ((ghg.required - ghg.attained) >= 0, (ghg.required - ghg.attained), 0 ) AS excess,
        IF ((ghg.required - ghg.attained) < 0, (ghg.required - ghg.attained), 0 ) AS missing
      FROM ghg
      ${this.generateLeftJoinTable([
        'vessel',
        'fleet',
        'vessel_type',
        'company',
      ])}
      WHERE
        vessel.company_id = ${companyId}
        AND ghg.year = ${year}
    `);
  }

  async getGhgKpiByCompany(companyId: number, year: number) {
    const subQuery = `
      SELECT
        vessel.id,
        IF ((ghg.required - ghg.attained) >= 0, (ghg.required - ghg.attained), 0 ) AS excess,
        ghg.required - ghg.attained AS netComplianceUnits,
        IF (ghg.attained > ghg.required, true, false) AS hasPenalty
      FROM ghg
      ${this.generateLeftJoinTable([
        'vessel',
        'fleet',
        'vessel_type',
        'company',
      ])}
      WHERE
        vessel.company_id = ${companyId}
        AND ghg.year = ${year}
    `;

    const netComplianceUnits = await this.vesselsRepository.manager
      .query(
        `
          SELECT
            SUM(netComplianceUnits) AS totalNetComplianceUnits
          FROM (${subQuery}) AS res
        `,
      )
      .then(([res]) => res?.totalNetComplianceUnits || 0);

    const excessVesselCount = await this.vesselsRepository.manager
      .query(
        `
          SELECT
            COUNT(id) AS count
          FROM (${subQuery}) AS res
          WHERE
            excess > 0
        `,
      )
      .then(([res]) => +res.count);

    const penaltyVesselCount = await this.vesselsRepository.manager
      .query(
        `
          SELECT
            COUNT(id) AS count
          FROM (${subQuery}) AS res
          WHERE
            hasPenalty = 1
        `,
      )
      .then(([res]) => +res.count);

    return {
      netComplianceUnits,
      excessVesselCount,
      penaltyVesselCount,
    };
  }

  async getEuEts(
    id: number,
    mode: string,
    fromDate?: string,
    toDate?: string,
    voyageType: VoyageType[] = [VoyageType.ACTUAL, VoyageType.PREDICTED],
  ) {
    const {
      etsYearRateQuery,
      co2InboundEu,
      co2OutboundEu,
      co2withinEu,
      co2EuPort,
    } = this.generateEtsQueryString();

    return await this.vesselsRepository.manager.query(`
      SELECT
        ${mode === GraphLevel.VOYAGE ? 'voyageId,' : ''}
        year,
        SUM(res.fp) AS totalFp,
        SUM(res.bc) AS totalBc,
        SUM(_co2InboundEu) + SUM(_co2OutboundEu) + SUM(_co2withinEu) + SUM(_co2EuPort) AS totalCo2Emission,
        SUM(_fuelConsumption) AS fuelConsumption,
        0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort) AS totalCo2Ets,
        (${etsYearRateQuery} * (0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort))) AS euaCost,
        ((${etsYearRateQuery} * (0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort))) / SUM(res.fp)) * 100 fpPercent,
        ((${etsYearRateQuery} * (0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort))) / SUM(res.bc)) * 100 bcPercent,
        maxToDate,
        minFromDate
      FROM (
        SELECT  
          vessel.id,
          vessel_trip.voyage_id AS voyageId,
          vessel_trip.guid AS guid,
          year_tbl.year,
          ${co2InboundEu} AS _co2InboundEu,
          ${co2OutboundEu} AS _co2OutboundEu,
          ${co2withinEu} AS _co2withinEu,
          ${co2EuPort} AS _co2EuPort,
          vessel_trip.freight_profit AS fp,
          vessel_trip.bunker_cost AS bc,
          SUM(grade.inbound_eu) + SUM(grade.outbound_eu) + SUM(grade.within_eu) + SUM(grade.eu_port) AS _fuelConsumption,
          MAX(vessel_trip.to_date) AS maxToDate,
          MIN(vessel_trip.from_date) AS minFromDate
        FROM vessel
        ${this.generateLeftJoinTable([
          'vessel_trip',
          'grade',
          'fleet',
          'year_tbl_group_by',
        ])}
        WHERE vessel_trip.journey_type = 'ETS'
        ${`AND vessel_trip.voyage_type in ('${voyageType.join("','")}')`}
        ${
          mode === GraphLevel.VOYAGE && fromDate
            ? `AND vessel_trip.from_date >= '${fromDate}'`
            : ''
        }
        ${
          mode === GraphLevel.VOYAGE && toDate
            ? `AND vessel_trip.to_date <= '${toDate}'`
            : ''
        }
        GROUP BY vessel_trip.id
      ) AS res
      WHERE res.id = ${id}
      GROUP BY ${mode === GraphLevel.VOYAGE ? 'res.voyageId' : 'res.year'}
    `);
  }

  async getEtsChartsPerVoyage(
    id: number | null,
    fromDate: string,
    toDate: string,
    companyId?: string | null | undefined,
  ) {
    const { co2InboundEu, co2OutboundEu, co2withinEu, co2EuPort } =
      this.generateEtsQueryString();

    const subQuery = `
      SELECT  
        vessel.id,
        vessel_trip.voyage_id as voyageId,
        vessel_trip.guid as guid,
        year_tbl.year,
        month_tbl.month,
        ${co2InboundEu} AS _co2InboundEu,
        ${co2OutboundEu} AS _co2OutboundEu,
        ${co2withinEu} AS _co2withinEu,
        ${co2EuPort} AS _co2EuPort,
        vessel_trip.from_date,
        vessel_trip.to_date,
        vessel_trip.voyage_type
      FROM vessel
      ${this.generateLeftJoinTable([
        'vessel_trip',
        'grade',
        'fleet',
        'year_tbl_group_by',
        'month_tbl_group_by',
      ])}
      WHERE
        vessel_trip.journey_type = 'ETS'
        ${id ? `AND vessel.id = ${id}` : ''}
        ${companyId ? `AND vessel.company_id = ${companyId}` : ''}
      GROUP BY vessel_trip.id
    `;

    const actual = await this.vesselsRepository.manager.query(`
      SELECT
        voyageId as "key",
        0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort) AS ets
      FROM (${subQuery}) AS res
      WHERE
        res.voyage_type = '${VoyageType.ACTUAL}'
      GROUP BY res.voyageId 
      ORDER BY res.to_date ASC
    `);
    const predicted = await this.vesselsRepository.manager.query(`
      SELECT
        voyageId as "key",
        0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort) AS ets
      FROM (${subQuery}) AS res
      WHERE
        res.voyage_type = '${VoyageType.PREDICTED}'
      GROUP BY res.voyageId
      ORDER BY res.to_date ASC
    `);
    return {
      actual,
      predicted,
    };
  }

  async getEuaCostCharts(
    id: number | null | undefined,
    query: ChartsQueryDto,
    level: GraphLevel,
    fromDate: string,
    toDate: string,
    companyId?: number | undefined,
  ) {
    const {
      etsYearRateQuery,
      co2InboundEu,
      co2OutboundEu,
      co2withinEu,
      co2EuPort,
    } = this.generateEtsQueryString();
    const year = query ? query.year : null;

    const subQuery = `
      SELECT  
        vessel.id,
        vessel_trip.voyage_id as voyageId,
        vessel_trip.guid as guid,
        year_tbl.year,
        month_tbl.month,
        ${co2InboundEu} AS _co2InboundEu,
        ${co2OutboundEu} AS _co2OutboundEu,
        ${co2withinEu} AS _co2withinEu,
        ${co2EuPort} AS _co2EuPort,
        vessel_trip.voyage_type,
        vessel_trip.from_date,
        vessel_trip.to_date
      FROM vessel
      ${this.generateLeftJoinTable([
        'vessel_trip',
        'grade',
        'fleet',
        'year_tbl_group_by',
        'month_tbl_group_by',
      ])}
      WHERE
        vessel_trip.journey_type = 'ETS'
        ${id ? `AND vessel.id = ${id}` : ''}
        ${
          level === GraphLevel.VOYAGE && fromDate
            ? `AND vessel_trip.from_date >= '${fromDate}'`
            : ''
        }
        ${
          level === GraphLevel.VOYAGE && toDate
            ? `AND vessel_trip.to_date <= '${toDate}'`
            : ''
        }
        ${companyId ? `AND vessel.company_id = ${companyId}` : ''}        
      GROUP BY vessel_trip.id
    `;

    if (level === GraphLevel.VOYAGE) {
      const actual = await this.vesselsRepository.manager.query(`
        SELECT
          voyageId as "key",
          (${etsYearRateQuery} * (0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort))) AS euaCost
        FROM (${subQuery}) AS res
        WHERE
          res.voyage_type = '${VoyageType.ACTUAL}'
        GROUP BY res.voyageId
        ORDER BY res.to_date ASC
      `);
      const predicted = await this.vesselsRepository.manager.query(`
        SELECT
          voyageId as "key",
          (${etsYearRateQuery} * (0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort))) AS euaCost
        FROM (${subQuery}) AS res
        WHERE
          res.voyage_type = '${VoyageType.PREDICTED}'
        GROUP BY res.voyageId
        ORDER BY res.to_date ASC
      `);
      return {
        actual,
        predicted,
      };
    } else {
      return await this.vesselsRepository.manager.query(`
        SELECT
          ${level === GraphLevel.YEAR ? 'year AS "key",' : ''}
          ${level === GraphLevel.MONTH ? 'month AS "key",' : ''}
          (${etsYearRateQuery} * (0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort))) AS euaCost
        FROM (${subQuery}) AS res
        WHERE
          1
          ${level === GraphLevel.MONTH ? `AND year=${year}` : ''}
        GROUP BY res.${level.toLowerCase()}
      `);
    }
  }

  async getEtsKpi(id: number, year: number) {
    const { totalCo2Ets, euaCost } = this.generateEtsQueryString(year);
    const etsData = await this.vesselsRepository.manager
      .query(
        `
        SELECT
          SUM(ets) AS ets,
          SUM(euaCost) AS euaCost
        FROM (
            SELECT
            vessel.id,
            year_tbl.year,
            IF(ISNULL(year_tbl.year), NULL, ${totalCo2Ets}) AS ets,
            IF(ISNULL(year_tbl.year), NULL, ${euaCost}) AS euaCost
          FROM vessel
          ${this.generateLeftJoinTable([
            'vessel_trip',
            'grade',
            `year_tbl:${year}`,
          ])}
          WHERE
            vessel.id = ${id}
            AND year_tbl.year = ${year} 
          GROUP BY vessel.id
        ) AS list
        GROUP BY year
       `,
      )
      .then(
        ([res]) =>
          res || {
            ets: 0,
            euaCost: 0,
          },
      );

    const costData = await this.vesselsRepository.manager
      .query(
        `
      SELECT
        SUM(bunker_cost) AS bunkerCost,
        SUM(freight_profit) AS freightProfit
      FROM
        (SELECT
          vessel_trip.id,
          vessel_trip.bunker_cost,
          vessel_trip.freight_profit
        FROM vessel
        ${this.generateLeftJoinTable([
          'vessel_trip',
          'grade',
          'year_tbl_group_by',
        ])}
        WHERE
          vessel_trip.journey_type = 'ETS'
          AND vessel.id = ${id}
          AND year_tbl.year = ${year}
        GROUP BY vessel_trip.id) AS res
    `,
      )
      .then(([res]) => ({
        bunkerCost: res ? res.bunkerCost || 0 : 0,
        freightProfit: res ? res.freightProfit || 0 : 0,
      }));

    return {
      ...etsData,
      ...costData,
    };
  }

  async getEuaPercentCharts(
    id: number | null,
    query: ChartsQueryDto,
    level: GraphLevel,
    fromDate: string,
    toDate: string,
    companyId?: number,
  ) {
    const {
      etsYearRateQuery,
      co2InboundEu,
      co2OutboundEu,
      co2withinEu,
      co2EuPort,
    } = this.generateEtsQueryString();
    const year = query ? query.year : null;

    return await this.vesselsRepository.manager.query(`
      SELECT
        ${level === GraphLevel.YEAR ? 'year AS "key",' : ''}
        ${level === GraphLevel.MONTH ? 'month AS "key",' : ''}
        ${level === GraphLevel.VOYAGE ? 'voyageId AS "key",' : ''}
        ((${etsYearRateQuery} * (0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort))) / SUM(res.fp)) * 100 AS fpPercent,
        ((${etsYearRateQuery} * (0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort))) / SUM(res.bc)) * 100 AS bcPercent
      FROM (            
      SELECT  
          vessel.id,
          vessel_trip.voyage_id AS voyageId,
          vessel_trip.guid AS guid,
          year_tbl.year,
          month_tbl.month,
          ${co2InboundEu} AS _co2InboundEu,
          ${co2OutboundEu} AS _co2OutboundEu,
          ${co2withinEu} AS _co2withinEu,
          ${co2EuPort} AS _co2EuPort,
          vessel_trip.freight_profit AS fp,
          vessel_trip.bunker_cost AS bc
        FROM vessel
        ${this.generateLeftJoinTable([
          'vessel_trip',
          'grade',
          'fleet',
          'year_tbl_group_by',
          'month_tbl_group_by',
        ])}
        WHERE
          vessel_trip.journey_type = 'ETS'
          ${id ? `AND vessel.id = ${id}` : ''}
          ${
            level === GraphLevel.VOYAGE && fromDate
              ? `AND vessel_trip.to_date >= '${fromDate}'`
              : ''
          }
          ${
            level === GraphLevel.VOYAGE && toDate
              ? `AND vessel_trip.to_date <= '${toDate}'`
              : ''
          }
          ${companyId ? `AND vessel.company_id = ${companyId}` : ''}
        GROUP BY vessel_trip.id
      ) AS res
      WHERE
        1
        ${level === GraphLevel.MONTH ? `AND year=${year}` : ''}
      GROUP BY ${
        level !== GraphLevel.VOYAGE
          ? `res.${level.toLowerCase()}`
          : 'res.voyageId'
      }
    `);
  }

  async getEtsKpiByCompany(companyId: number, year: number) {
    const { totalCo2Ets, euaCost } = this.generateEtsQueryString(year);
    const subQuery = `
      SELECT
        vessel.id,
        year_tbl.year,
        IF(ISNULL(year_tbl.year), NULL, ${totalCo2Ets}) AS ets,
        IF(ISNULL(year_tbl.year), NULL, ${euaCost}) AS euaCost
      FROM vessel
      ${this.generateLeftJoinTable([
        'vessel_trip',
        'grade',
        `year_tbl:${year}`,
      ])}
      WHERE
        company_id = ${companyId}
        AND year_tbl.year = ${year} 
      GROUP BY vessel.id
    `;

    const etsKpi = await this.vesselsRepository.manager
      .query(
        `
        SELECT
          SUM(ets) AS totalEts,
          SUM(euaCost) AS totalEuaCost
        FROM (${subQuery}) AS list`,
      )
      .then(([row]) => ({
        totalEts: row.totalEts | 0,
        totalEuaCost: row.totalEuaCost | 0,
      }));

    const costKpi = await this.vesselsRepository.manager
      .query(
        `
        SELECT
          *,
          SUM(bunker_cost) AS totalBunkerCost,
          SUM(freight_profit) AS freightProfit
        FROM
          (SELECT
            vessel_trip.id,
            vessel_trip.bunker_cost,
            vessel_trip.freight_profit
          FROM vessel
          ${this.generateLeftJoinTable([
            'vessel_trip',
            'grade',
            'year_tbl_group_by',
          ])}
          WHERE
            vessel_trip.journey_type = 'ETS'
            AND vessel.company_id = ${companyId}
            AND year_tbl.year = ${year}
          GROUP BY vessel_trip.id) AS res
	    `,
      )
      .then(([row]) => ({
        totalBunkerCost: row ? row.totalBunkerCost : 0,
        freightProfit: row ? row.freightProfit : 0,
      }));

    return {
      ...etsKpi,
      ...costKpi,
    };
  }

  async getEuEtsListByCompany(
    paginationOption: PaginationParamsDto,
    sortOption: SortOrderDto,
    searchOption: SearchVesselDto,
  ) {
    let { year } = searchOption;
    if (!year) {
      year = new Date().getFullYear();
    }
    const { companyId } = searchOption;

    const subQuery = this.generateEtsQuery(year, searchOption);
    const whereQuery = this.generateWhereQueryForList(companyId, searchOption);

    return this.getListData(subQuery, whereQuery, paginationOption, sortOption);
  }

  async getEuEtsByCompany(searchOption: SearchVesselDto) {
    let { year } = searchOption;
    if (!year) {
      year = new Date().getFullYear();
    }
    const { search, fleet, category, companyId } = searchOption;

    const subQuery = this.generateEtsQuery(year, searchOption);

    const whereQuery = `
        list.name LIKE '%${search ? search : ''}%'
        ${companyId ? `AND list.companyId = ${companyId}` : ''}
        ${fleet ? `AND list.fleetId = ${fleet}` : ''}
        ${category ? `AND list.category = '${category}'` : ''}
    `;

    return this.vesselsRepository.manager.query(
      `SELECT * FROM (${subQuery}) AS list WHERE ${whereQuery}`,
    );
  }

  async getReportsData(reportOptions) {
    let workbook: Workbook = new Workbook();
    for (let i = 0; i < reportOptions.length; i++) {
      const reportOption = reportOptions[i];
      let res;
      if (reportOption.reportType === ReportType.CII) {
        let level: GraphLevel;
        if (!reportOption.chartYear) {
          level = GraphLevel.YEAR;
        } else if (reportOption.chartYear) {
          level = GraphLevel.MONTH;
        }

        res = await this.getVesselsCIIReport(
          reportOption,
          {
            year: reportOption.chartYear as number,
            month: null,
            mode: reportOption.mode,
          } as any,
          level,
        );
        workbook = this.excelService.generateCIIReportSheet(
          workbook,
          res,
          `Report ${i + 1}`,
        );
      } else if (reportOption.reportType === ReportType.ETS) {
        res = await this.getVesselsEtsReport(reportOption);
        workbook = this.excelService.generateCommonReportSheet(
          workbook,
          res,
          ETS_REPORT_HEADER,
          ETS_REPORT_KPI,
          `Report ${i + 1}`,
        );
      } else if (reportOption.reportType === ReportType.GHG) {
        res = await this.getVesselsGhgReport(reportOption);
        workbook = this.excelService.generateCommonReportSheet(
          workbook,
          res,
          GHG_REPORT_HEADER,
          GHG_REPORT_KPI,
          `Report ${i + 1}`,
        );
      }
    }

    return workbook;
  }

  getReportPdf(screenshot: string) {
    return this.pdfService.generateTablePdf([], [], {}, screenshot);
  }

  getCiiPerVesselPdf(screenshot: string) {
    // Todo: export proper table for specific vessel as PDF if needed
    return this.pdfService.generateTablePdf([], [], {}, screenshot);
  }

  getEtsPerVesselPdf(screenshot: string) {
    // Todo: export proper table for specific vessel as PDF if needed
    return this.pdfService.generateTablePdf([], [], {}, screenshot);
  }

  async getCiiExcel(
    id: number,
    mode: string,
    fromDate: string,
    toDate: string,
  ) {
    const vessels = await this.getVesselCII(id, mode, fromDate, toDate);
    if (vessels) {
      return await this.excelService.generateTableExcel<any>(
        vessels,
        [
          {
            label: mode === GraphLevel.VOYAGE ? 'Voyage ID' : 'Year',
            key: mode === GraphLevel.VOYAGE ? 'voyageId' : 'year',
          },
          ...CII_HEADER,
        ],
        'CII',
      );
    } else {
      return null;
    }
  }

  async getEtsExcel(
    id: number,
    mode: string,
    fromDate: string,
    toDate: string,
  ) {
    const vessels = await this.getEuEts(id, mode, fromDate, toDate);
    if (vessels) {
      return await this.excelService.generateTableExcel<any>(
        vessels,
        [
          {
            label: mode === GraphLevel.VOYAGE ? 'Voyage ID' : 'Year',
            key: mode === GraphLevel.VOYAGE ? 'voyageId' : 'year',
          },
          ...(mode === GraphLevel.VOYAGE ? ETS_HEADER_PER_VOYAGE : ETS_HEADER),
        ],
        'CII',
      );
    } else {
      return null;
    }
  }
}
