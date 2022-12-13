import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, LessThan, MoreThan, Repository } from 'typeorm';

import { CreateVesselTripDto, CreateVesselTripUploadDto } from '../dto/create-vessel-trip.dto';
import { UpdateVesselTripDto } from '../dto/update-vessel-trip.dto';
import { VesselTrip } from '../entities/vessel-trip.entity';
import { Port } from '../../vessels/entities/port.entity';
import { Vessel } from '../../vessels/entities/vessel.entity';
import {
  PaginationDto,
  PaginationParamsDto,
} from '../../../shared/dtos/pagination.dto';
import { SearchVesselTripDto } from '../dto/search-vessel-trip.dto';
import { SortOrderDto } from '../../../shared/dtos/sort-order.dto';
import { VesselsService } from '../../vessels/services/vessels.service';
import { ExcelService } from '../../../shared/services/excel.service';
import { Grade } from '../entities/grade.entity';
import {
  CII_HEADER,
  ETS_HEADER_PER_VOYAGE,
  VESSEL_TRIPS_CII_HEADER,
  VESSEL_TRIPS_ETS_HEADER,
} from '../../../shared/constants/excel.constants';
import {
  ABound,
  ABound_BC,
  BBound,
  BBound_BC,
  CBound,
  CBound_BC,
  DBound,
  DBound_BC,
  FuelFactors,
  FuelType,
  GraphLevel,
  JourneyType, Roles,
  VoyageType,
} from '../../../shared/constants/global.constants';
import { VesselTripTable } from '../dto/export-vessel-trip.dto';
import { pick } from '../../../shared/utils/pick';
import { PdfService } from '../../../shared/services/pdf.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { YearlyAggregate } from '../entities/yearly-aggregate.entity';
import * as moment from "moment";
import { date } from 'joi';
import { IPayload } from '../../auth/auth.types';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class VesselTripsService {
  public gradeFactorQuery: string;
  public etsYearRateQuery: string;

  constructor(
    @InjectRepository(VesselTrip)
    private vesselTripRepository: Repository<VesselTrip>,
    @InjectRepository(VesselTrip)
    private yearlyAggregateRepository: Repository<YearlyAggregate>,
    @InjectRepository(Port)
    private portRepository: Repository<Port>,
    @InjectRepository(Vessel)
    private vesselRepository: Repository<Vessel>,
    @InjectRepository(Grade)
    private gradeRepository: Repository<Grade>,
    private vesselsService: VesselsService,
    private usersService: UsersService,
    private excelService: ExcelService,
    private pdfService: PdfService,
  ) {
    this.gradeFactorQuery = `
      (CASE
        ${Object.entries(FuelFactors)
        .map((fuel) => `WHEN grade.grade = '${fuel[0]}' THEN ${fuel[1]}`)
        .join(' ')}
        ELSE 0
      END)
      `;
    // this.etsYearRateQuery = `
    //   (CASE
    //     WHEN year = 2023 THEN 54.26 * 0.3333
    //     WHEN year = 2024 THEN 55.26 * 0.6666
    //     WHEN year >= 2025 THEN 56.26
    //     ELSE 0
    //   END)
    // `;

    // We will change 2024, >=2025 values later
    this.etsYearRateQuery = `
      (CASE
        WHEN year = 2023 THEN 85 * 0.3333
        WHEN year = 2024 THEN 85 * 0.6666
        WHEN year >= 2025 THEN 85
        ELSE 0
      END)
    `;
  }

  public generateWhereQuery(searchOption: SearchVesselTripDto) {
    const {
      id,
      voyageId,
      vesselId,
      fromDate,
      toDate,
      voyageType = [VoyageType.ACTUAL, VoyageType.PREDICTED, VoyageType.ARCHIVED],
      search,
      companyId,
      originPort,
      destinationPort,
      journeyType,
    } = searchOption;

    return `
      WHERE
        1
        ${`AND vessel_trip.voyage_type in ('${voyageType.join("','")}')`}
        ${voyageId ? `AND voyage_id = ${voyageId}` : ''}
        ${journeyType ? `AND vessel_trip.journey_type = '${journeyType}'` : ''}
        ${id ? `AND vessel_trip.id = ${id}` : ''}
        ${fromDate ? `AND '${fromDate}' <= vessel_trip.from_date` : ''}
        ${toDate ? `AND '${toDate}' >= vessel_trip.to_date` : ''}
        ${search ? `AND (vessel_trip.voyage_id LIKE '%${search}%' OR vessel.name LIKE '%${search}%')` : ''}
        ${vesselId ? `AND vessel = ${vesselId}` : ''}
        ${companyId ? `AND company.id = ${companyId}` : ''}
        ${(companyId && !vesselId) ? `AND vessel IS NOT NULL` : ''}
        ${originPort ? `AND origin_port.id = ${originPort}` : ''}
        ${destinationPort ? `AND destination_port.id = ${destinationPort}` : ''}
        `;
  }

  async getPortIdByName(name: string) {
    const exist = await this.portRepository.findOne({
      where: { name },
    });
    if (!exist) {
      return await this.portRepository.save({ name });
    } else {
      return exist;
    }
  }

  async getVesselByName(name: string) {
    const exist = await this.vesselRepository.findOne({
      where: { name },
    });
    if (!exist) {
      if (name) {
        return await this.vesselRepository.save({ name });
      } else {
        return null;
      }
    } else {
      return exist;
    }
  }

  async getVesselByImo(imo: string) {
    const exist = await this.vesselRepository.findOne({
      where: { imo },
    });

    if (!exist) {
      if (imo) {
        return await this.vesselRepository.save({
          name: `IMO-${imo}`,
          imo
        });
      } else {
        return null;
      }
    } else {
      return exist;
    }
  }

  async isVesselInUse(createVesselTripDto: CreateVesselTripDto) {
    const { vessel, toDate, fromDate } = createVesselTripDto;
    const voyages = await this.vesselTripRepository.find({ where: { vessel: vessel } });
    const _fromDate = moment(fromDate)
    const _toDate = moment(toDate)

    const isTripOccupied = voyages.some(
      (voyage) => (
        (_fromDate.isSameOrAfter(voyage.fromDate) && _fromDate.isSameOrBefore(voyage.toDate)) ||
        (_toDate.isSameOrAfter(voyage.fromDate) && _toDate.isSameOrBefore(voyage.toDate))
     ));

    return isTripOccupied;
  }

  async create(createVesselTripDto: CreateVesselTripDto, aggregate = false) {
    const { journeyType, vessel, vesselName } = createVesselTripDto;
    const { originPort, destinationPort, ...createData } = createVesselTripDto;
    const fromPort: any = await this.getPortIdByName(originPort);
    const toPort: any = await this.getPortIdByName(destinationPort);

    if (await this.isVesselInUse(createVesselTripDto)) throw new BadRequestException(`This vessel is now on a voyage. You can not have overlapping dates in 2 different voyages of one vessel`)

    if (journeyType === JourneyType.ETS) {
      const { grades, ...newTripData } = createVesselTripDto;

      const savedGrades = await this.gradeRepository.save(grades);

      const data = {
        ...newTripData,
        originPort: fromPort,
        destinationPort: toPort,
        grades: savedGrades,
      } as DeepPartial<VesselTrip>

      return await this.vesselTripRepository.save(data);
      // return aggregate ? await this.yearlyAggregateRepository.save(data) :  await this.vesselTripRepository.save(data);
    } else {

      const data = {
        ...createData,
        originPort: fromPort,
        destinationPort: toPort,
      } as DeepPartial<VesselTrip>

      return await this.vesselTripRepository.save(data);
      // return aggregate ? await this.yearlyAggregateRepository.save(data) :  await this.vesselTripRepository.save(data);
    }
  }

  async createTrips(createVesselTripsDto: CreateVesselTripUploadDto[]) {
    const vesselTrips = [];

    const dates = [];

    for (let i = 0; i < createVesselTripsDto.length; i++) {
      const { imo, vesselName, originPort, destinationPort, fromDate, toDate, ...createData } =
        createVesselTripsDto[i];
      const fromPort = await this.getPortIdByName(originPort);
      const toPort = await this.getPortIdByName(destinationPort);
      let vessel = await this.getVesselByName(vesselName);

      if (!vessel) {
        vessel = await this.getVesselByImo(imo);
      } 
      
      if (moment(fromDate).year() !== moment(toDate).year()) throw new BadRequestException("Voyages split between 2 years can only be uploaded through the UI")

      const hasDuplicateIMOAndDatesOverlap = dates.some(
        (data) =>
          data.imo === imo && ((moment(fromDate).isSameOrAfter(data.fromDate) && moment(fromDate).isSameOrBefore(data.toDate)) || 
            (moment(toDate).isSameOrAfter(data.fromDate) && moment(toDate).isSameOrBefore(data.toDate))
        ))

      if (hasDuplicateIMOAndDatesOverlap) throw new BadRequestException(`This vessel is now on a voyage. You can not have overlapping dates in 2 different voyages of one vessel. Check row ${i + 1}`)

      dates.push({
        fromDate,
        toDate,
        imo
      })

      if (await this.isVesselInUse({ ...createVesselTripsDto[i], vessel: vessel.id } as CreateVesselTripDto))
        throw new BadRequestException(`This vessel is now on a voyage. You can not have overlapping dates in 2 different voyages of one vessel. Check row ${i + 1}`)

      vesselTrips.push({
        ...createData,
        vessel,
        fromDate,
        toDate,
        originPort: fromPort,
        destinationPort: toPort,
      });
    }

    await this.vesselTripRepository.save(vesselTrips);
  }

  findOne(id: number) {
    return this.vesselTripRepository.findOne({
      where: { id },
      relations: ['originPort', 'destinationPort', 'vessel', 'grades'],
    });
  }

  getEtsByVoyage(id: number) {
    return this.vesselTripRepository.manager
      .query(
        `
        SELECT
          res.*,
          (res.co2InboundEu + res.co2OutboundEu + res.co2withinEu + res.co2EuPort) AS totalCo2Emission,
          (0.5 * (res.co2InboundEu + res.co2OutboundEu) + res.co2withinEu + res.co2EuPort) AS totalCo2Ets,
          ${
        this.etsYearRateQuery
        } * (0.5 * (res.co2InboundEu + res.co2OutboundEu) + res.co2withinEu + res.co2EuPort) AS euaCost
        FROM
          (SELECT
            2023 as year,
            SUM(${this.gradeFactorQuery} * grade.inbound_eu) AS co2InboundEu,
            SUM(${this.gradeFactorQuery} * grade.outbound_eu) AS co2OutboundEu,
            SUM(${this.gradeFactorQuery} * grade.within_eu) AS co2withinEu,
            SUM(${this.gradeFactorQuery} * grade.eu_port) AS co2EuPort
          FROM vessel_trip
          ${this.vesselsService.generateLeftJoinTable([
          'grade',
          'year_tbl_group_by',
          '',
        ])}
          WHERE
            vessel_trip.journey_type = 'ETS'
            AND vessel_trip.id = ${id}
          GROUP BY vessel_trip.id) AS res
      `,
      )
      .then((row) => row[0]);
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async updateTrips() {
    const current = new Date()

    const toPredict = await this.vesselTripRepository
      .createQueryBuilder()
      .update({ voyageType: VoyageType.PREDICTED })
      .where({ fromDate: MoreThan(current), voyageType: VoyageType.ACTUAL })
      .execute()

    const toArchive = await this.vesselTripRepository
      .createQueryBuilder()
      .update({ voyageType: VoyageType.ARCHIVED })
      .where({ toDate: LessThan(current), voyageType: VoyageType.PREDICTED })
      .execute()
  }

  async getEuaCostCharts(searchParams: SearchVesselTripDto) {
    const { fromDate, toDate, vesselId, companyId } = searchParams;
    return await this.vesselsService.getEuaCostCharts(
      +vesselId,
      null,
      GraphLevel.VOYAGE,
      fromDate,
      toDate,
    );
  }

  async getEtsCharts(searchParams: SearchVesselTripDto) {
    const { fromDate, toDate, vesselId, companyId } = searchParams;
    return await this.vesselsService.getEtsChartsPerVoyage(
      +vesselId,
      fromDate,
      toDate,
      companyId,
    );
  }

  async getEtsPercentCharts(searchParams: SearchVesselTripDto) {
    const { fromDate, toDate, vesselId, companyId } = searchParams;
    return await this.vesselsService.getEuaPercentCharts(
      +vesselId,
      null,
      GraphLevel.VOYAGE,
      fromDate,
      toDate,
      +companyId,
    );
  }

  generateTripsListQuery(journeyType: string, whereQuery: string) {
    let query: string;
    const current = new Date().toISOString();

    if (journeyType === JourneyType.CII) {
      const {
        emissionsQuery,
        ciiQuery,
        requiredQuery,
        ciiRateQuery,
        categoryQuery,
      } = this.vesselsService.generateCiiQueryString(0);

      query = `
        SELECT
          vessel_trip.id,
          vessel.name AS vesselName,
          vessel_trip.voyage_id AS voyageId,
          origin_port.name AS originPort,
          destination_port.name AS destinationPort,
          ${emissionsQuery} AS co2Emissions,
          ${ciiQuery} AS cii,
          ${requiredQuery} AS ciiRequired,
          ${ciiRateQuery} AS ciiRate,
          ${categoryQuery} AS category,
          vessel_trip.voyage_type AS status,
          vessel_trip.from_date AS fromDate,
          vessel_trip.to_date AS toDate
        FROM vessel_trip
        ${this.vesselsService.generateLeftJoinTable([
          'vessel',
          'year_tbl_group_by',
          'origin_port',
          'destination_port',
          'vessel_type',
          'company',
          'year_tbl_group_by',
        ])}
        ${whereQuery}
        GROUP BY vessel_trip.id
      `;
    } else if (journeyType === JourneyType.ETS) {
      const {
        co2InboundEu,
        co2OutboundEu,
        co2withinEu,
        co2EuPort,
        etsYearRateQuery,
      } = this.vesselsService.generateEtsQueryString();
      query = `
        SELECT
          id,
          voyageId,
          status,
          vesselName,
          SUM(_co2InboundEu) AS co2InboundEu,
          SUM(_co2OutboundEu) AS co2OutboundEu,
          SUM(_co2withinEu) AS co2withinEu,
          SUM(_co2EuPort) AS co2EuPort,
          SUM(_co2InboundEu) + SUM(_co2OutboundEu) + SUM(_co2withinEu) + SUM(_co2EuPort) AS totalCo2Emission,
          0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort) AS totalCo2Ets,
          (${etsYearRateQuery} * (0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort))) AS euaCost,
          ((${etsYearRateQuery} * (0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort))) / SUM(res.fp)) * 100 fpPercent,
          ((${etsYearRateQuery} * (0.5 * (SUM(_co2InboundEu) + SUM(_co2OutboundEu)) + SUM(_co2withinEu) + SUM(_co2EuPort))) / SUM(res.bc)) * 100 bcPercent,
          fromDate,
          toDate
        FROM (
          SELECT
            vessel_trip.id,
            vessel.id AS vesselId,
            vessel_trip.voyage_id AS voyageId,
            vessel_trip.voyage_type AS status,
            vessel.name AS vesselName,
            year_tbl.year,
            ${co2InboundEu} AS _co2InboundEu,
            ${co2OutboundEu} AS _co2OutboundEu,
            ${co2withinEu} AS _co2withinEu,
            ${co2EuPort} AS _co2EuPort,
            vessel_trip.freight_profit AS fp,
            vessel_trip.bunker_cost AS bc,
            vessel_trip.from_date AS fromDate,
            vessel_trip.to_date AS toDate
          FROM vessel_trip
          ${this.vesselsService.generateLeftJoinTable([
          'vessel',
          'year_tbl_group_by',
          'origin_port',
          'destination_port',
          'grade',
          'company',
          'year_tbl_group_by',
        ])}
          ${whereQuery}
          GROUP BY vessel_trip.id
        ) AS res
        GROUP BY res.id
      `;
    } else {
      query = `
        SELECT
          vessel_trip.id AS id,
          vessel_trip.voyage_id AS voyageId,
          vessel.name AS vesselName,
          vessel_trip.from_date AS fromDate,
          vessel_trip.to_date AS toDate,
          origin_port.name AS originPort,
          destination_port.name AS destinationPort,
          IF(
            ISNULL(
              IF (
                vessel_trip.journey_type = 'CII',
                mgo + lfo + hfo + lng + vlsfo_ad + vlsfo_xb + vlsfo_ek + lpg_pp + lpg_bt + bio_fuel,
                gt._fuelConsumption
              )
            ),
            0,
            IF (
              vessel_trip.journey_type = 'CII',
              mgo + lfo + hfo + lng + vlsfo_ad + vlsfo_xb + vlsfo_ek + lpg_pp + lpg_bt + bio_fuel,
              gt._fuelConsumption
            )
          )
          AS fuelConsumption
        FROM vessel_trip
        ${this.vesselsService.generateLeftJoinTable([
        'vessel',
        'year_tbl_group_by',
        'origin_port',
        'destination_port',
      ])}
        LEFT JOIN (
          SELECT
            id,
            journey,
            SUM(grade.inbound_eu) + SUM(grade.outbound_eu) + SUM(grade.within_eu) + SUM(grade.eu_port) AS _fuelConsumption
          from grade
          group by grade.journey
        ) as gt on gt.journey = vessel_trip.id
      ${whereQuery}
    `;
    }

    return query;
  }

  async getTripsList(
    paginationOption: PaginationParamsDto,
    sortOption: SortOrderDto,
    searchOption: SearchVesselTripDto,
  ) {
    const { page, limit } = paginationOption;
    const { sortBy, order } = sortOption;

    const whereQuery = this.generateWhereQuery(searchOption);

    const { journeyType } = searchOption;

    const query = this.generateTripsListQuery(journeyType, whereQuery);

    const totalCount = await this.vesselTripRepository.manager
      .query(`SELECT count(*) as count FROM (${query}) as content`)
      .then(([row]) => +row.count);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    paginationOption.page = Math.max(1, Math.min(totalPages, page));

    const pagination: PaginationDto = {
      ...paginationOption,
      totalCount: totalCount,
      totalPages: totalPages,
    };

    const listData = await this.vesselTripRepository.manager.query(`
      ${query}
      ORDER BY
        ${sortBy ? sortBy : 'voyageId'}
        ${order ? order : 'ASC'}
      ${limit ? `LIMIT ${limit}` : ''}
      ${page ? `OFFSET ${(pagination.page - 1) * limit}` : ''}
    `);

    return {
      listData,
      pagination,
      sortOrder: sortOption,
    };
  }

  async getVoyagesByVesselId(
    vesselId: number,
    searchParams: SearchVesselTripDto,
  ) {
    const { journeyType, voyageType, fromDate, toDate } = searchParams;

    if (journeyType === JourneyType.CII) {
      return this.vesselsService.getVesselCII(
        vesselId,
        GraphLevel.VOYAGE,
        fromDate,
        toDate,
        voyageType
      );
    } else if (journeyType === JourneyType.ETS) {
      return this.vesselsService.getEuEts(
        vesselId,
        GraphLevel.VOYAGE,
        fromDate,
        toDate,
        voyageType
      );
    }
  }

  async getVoyagePerVesselExcel(
    vesselId: number,
    searchOption: SearchVesselTripDto,
  ) {
    const { journeyType } = searchOption;
    const voyages = await this.getVoyagesByVesselId(vesselId, searchOption);

    if (voyages) {
      return await this.excelService.generateTableExcel(
        voyages.map((voyage) =>
          pick(voyage, [
            'voyageId',
            ...(journeyType === JourneyType.CII
              ? CII_HEADER.map((key) => key.key)
              : ETS_HEADER_PER_VOYAGE.map((key) => key.key)),
          ]),
        ),
        [
          { label: 'Voyage ID', key: 'voyageId' },
          ...(journeyType === JourneyType.CII
            ? CII_HEADER
            : ETS_HEADER_PER_VOYAGE),
        ],
        'Journey',
      );
    } else {
      return null;
    }
  }

  async update(id: number, updateVesselTripDto: UpdateVesselTripDto) {
    const { originPort, destinationPort, voyageType, journeyType, grades, ...createData } =
      updateVesselTripDto;
    const fromPort = await this.getPortIdByName(originPort);
    const toPort = await this.getPortIdByName(destinationPort);

    const trip: any = await this.vesselTripRepository.findOne(id);
    Object.entries(createData).forEach((field) => {
      trip[field[0]] = field[1];
    });
    trip.voyageType = voyageType;
    trip.journeyType = journeyType;
    trip.originPort = fromPort;
    trip.destinationPort = toPort;

    if (journeyType === JourneyType.ETS) {
      trip.grades = await this.gradeRepository.save(grades);

      return await this.vesselTripRepository.save(trip);
    }

    return this.vesselTripRepository.update(id, trip);
  }

  remove(id: number) {
    return this.vesselTripRepository.delete(id);
  }

  async getTripsExcel(
    searchOption: SearchVesselTripDto,
    sortOption: SortOrderDto,
  ) {
    const { journeyType } = searchOption;
    const { sortBy, order } = sortOption;
    const whereQuery = this.generateWhereQuery(searchOption);
    const query = this.generateTripsListQuery(journeyType, whereQuery);

    const trips = await this.vesselTripRepository.manager.query(`
      ${query}
      ORDER BY
        ${sortBy ? sortBy : 'voyageId'}
        ${order ? order : 'ASC'}
    `);

    if (trips) {
      return await this.excelService.generateTableExcel<VesselTripTable>(
        trips,
        journeyType === JourneyType.CII
          ? VESSEL_TRIPS_CII_HEADER
          : VESSEL_TRIPS_ETS_HEADER,
        'Journey',
      );
    } else {
      return null;
    }
  }

  async getCiiChart(searchParams: SearchVesselTripDto, user: IPayload) {
    if (user.role !== Roles.SUPER_ADMIN) {
      const me = await this.usersService.findOneById(user.id);
      searchParams.companyId = me.companyId.toString();
    }
    const { level, fromDate, toDate, voyageType, vesselId, companyId } = searchParams;

    const { ciiQuery, requiredQuery, DWTQuery, emissionsQuery, categoryQuery } =
      this.vesselsService.generateCiiQueryString(0);
    const aggregateQuery = this.vesselsService.generateAggregateCheckQueryString();
    return await this.vesselTripRepository.manager.query(`
      SELECT
        ${level === GraphLevel.TRIP ? 'vessel_trip.id,' : ''}
        vessel_trip.voyage_id AS voyageId,
        vessel_trip.distance_traveled as distance,
        ${ciiQuery} AS cii,
        ${DWTQuery} as dwt,
        ${emissionsQuery} as emissions,
        ${requiredQuery} AS requiredCII,
        ${categoryQuery} AS category,
        vessel.id as vesselId,
        IF(vessel_type.vessel_type = 'Chemical Tanker' OR vessel_type.vessel_type = 'Oil Tanker', ${ABound}, IF(vessel_type.vessel_type = 'Bulk Carrier', ${ABound_BC}, 0)) * (${requiredQuery}) AS aBound,
        IF(vessel_type.vessel_type = 'Chemical Tanker' OR vessel_type.vessel_type = 'Oil Tanker', ${BBound}, IF(vessel_type.vessel_type = 'Bulk Carrier', ${BBound_BC}, 0)) * (${requiredQuery}) AS bBound,
        IF(vessel_type.vessel_type = 'Chemical Tanker' OR vessel_type.vessel_type = 'Oil Tanker', ${CBound}, IF(vessel_type.vessel_type = 'Bulk Carrier', ${CBound_BC}, 0)) * (${requiredQuery}) AS cBound,
        IF(vessel_type.vessel_type = 'Chemical Tanker' OR vessel_type.vessel_type = 'Oil Tanker', ${DBound}, IF(vessel_type.vessel_type = 'Bulk Carrier', ${DBound_BC}, 0)) * (${requiredQuery}) AS dBound,
        vessel_trip.voyage_type AS voyageType
      FROM vessel_trip
      ${this.vesselsService.generateLeftJoinTable([
      'vessel',
      'year_tbl_group_by',
      'vessel_type',
    ])}
      WHERE
        vessel_trip.journey_type = 'CII'
        ${`AND vessel_trip.voyage_type in ('${voyageType.filter(type => type !== VoyageType.ARCHIVED).join("','")}')`}
        ${fromDate ? `AND vessel_trip.from_date >= '${fromDate}'` : ''}
        ${toDate ? `AND vessel_trip.to_date <= '${toDate}'` : ''}
        ${vesselId ? `AND vessel.id = ${vesselId}` : ''}
        ${companyId ? `AND vessel.company_id = ${companyId}` : ''}
        ${`AND ${aggregateQuery}`}
      GROUP BY vessel_trip.voyage_id
      ORDER BY vessel_trip.from_date
    `);
  }

  async getVoyagesByVesselFuelChart(
    vesselId: number,
    searchParams: SearchVesselTripDto,
  ) {
    searchParams.vesselId = null
    const whereQuery = this.generateWhereQuery(searchParams);

    return await this.vesselTripRepository.manager.query(`
      SELECT
        vessel_trip.voyage_id AS voyageId,
        bunker_cost as cost,
        mgo,
        lfo,
        hfo,
        vlsfo_ad,
        vlsfo_ek,
        vlsfo_xb,
        lpg_pp,
        lpg_bt,
        bio_fuel
      FROM vessel
      ${this.vesselsService.generateLeftJoinTable([
      'vessel_trip',
      'year_tbl_group_by',
      'vessel_type',
      'company',
    ])}
      ${whereQuery}
      ${vesselId ? `AND vessel.id = ${vesselId}` : ''}
      GROUP BY ${
      'vessel_trip.voyage_id'
      }
      ORDER BY vessel.id
    `);
  }

  async getCiiStackBarChart(searchParams: SearchVesselTripDto) {
    const { fromDate, toDate, vesselId, companyId, voyageType } = searchParams;

    return this.vesselsService.getVesselStackBarChart({
      fromDate,
      toDate,
      vesselId,
      companyId,
      voyageType
    });
  }

  async getCiiByTrip(searchOption: SearchVesselTripDto) {
    const whereQuery = this.generateWhereQuery(searchOption);

    const { emissionsQuery, ciiQuery } =
      this.vesselsService.generateCiiQueryString(0);

    const trips = await this.vesselTripRepository.manager.query(`
      SELECT
        vessel_trip.id AS id
      FROM vessel_trip
      LEFT JOIN vessel ON vessel_trip.vessel = vessel.id
      ${whereQuery}
    `);

    const data: any[] = await this.vesselTripRepository.manager.query(`
      SELECT
        vessel.name AS vessel,
        ${emissionsQuery} AS emissions,
        SUM(distance_traveled) AS distanceTraveled,
        SUM(mgo) AS mgo,
        SUM(lfo) AS lfo,
        SUM(hfo) AS hfo,
        SUM(vlsfo) AS vlsfo,
        SUM(lng) AS lng,
        ${ciiQuery} AS cii
      FROM vessel_trip
      ${this.vesselsService.generateLeftJoinTable([
      'vessel',
      'origin_port',
      'destination_port',
    ])}
      ${whereQuery}
    `);

    if (data.length > 0) {
      return {
        ...data[0],
        trips,
      };
    } else {
      return {};
    }
  }

  async getTripsPdf(
    searchOption: SearchVesselTripDto,
    sortOption: SortOrderDto,
    screenshot: string,
  ) {
    const { journeyType } = searchOption;
    const { sortBy, order } = sortOption;
    const whereQuery = this.generateWhereQuery(searchOption);
    const query = this.generateTripsListQuery(journeyType, whereQuery);

    const trips = await this.vesselTripRepository.manager.query(`
      ${query}
      ORDER BY
        ${sortBy ? sortBy : 'voyageId'}
        ${order ? order : 'ASC'}
    `);

    return this.pdfService.generateTablePdf(
      trips.map((trip) => ({
        ...trip,
        fromDate: trip.fromDate.toDateString(),
        toDate: trip.toDate.toDateString(),
      })),
      journeyType === JourneyType.CII
        ? VESSEL_TRIPS_CII_HEADER
        : VESSEL_TRIPS_ETS_HEADER,
      searchOption,
      screenshot,
    );
  }
}
