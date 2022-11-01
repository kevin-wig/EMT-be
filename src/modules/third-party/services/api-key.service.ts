import { ForbiddenException, Injectable, Req, UnauthorizedException, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateApiKeyDto } from '../dto/create-apikey.dto';
import { RefreshApiKeyDto } from '../dto/refresh-apikey.dto';
import { ApiKey } from '../entities/api-key.entity';
import * as moment from "moment";
import { Vessel } from 'src/modules/vessels/entities/vessel.entity';
import { ABound, ABound_BC, BBound, BBound_BC, CBound, CBound_BC, DBound, DBound_BC, FuelFactors, GraphLevel } from 'src/shared/constants/global.constants';
import { VesselTrip } from 'src/modules/vessel-trips/entities/vessel-trip.entity';
import { GetCIIDataDto } from '../dto/get-cii-data.dto';
import { VesselsService } from 'src/modules/vessels/services/vessels.service';
import { UsersService } from 'src/modules/users/services/users.service';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(Vessel)
    private vesselRepository: Repository<Vessel>,
    @InjectRepository(VesselTrip)
    private vesselTripRepository: Repository<VesselTrip>,
    private usersService: UsersService,
    private vesselService: VesselsService
  ) { }

  public create(createApiKeyDto) {
    const apikey = this.generateApikey(30); 

    createApiKeyDto.apiKey = apikey;
    createApiKeyDto.expiresAt = moment().add("5", "hours").toISOString(); // Time just for testing purposes

    return this.apiKeyRepository.save(createApiKeyDto);
  }

  public async refresh(refreshApiKeyDto: RefreshApiKeyDto) {
    const apiKeyObject = await this.getApiKey(refreshApiKeyDto.apiKey);

    if (!apiKeyObject) {
      throw new ForbiddenException("Invalid Api key passed")
    } else {
      await this.apiKeyRepository.createQueryBuilder()
      .update({
        expiresAt: moment().add(5, "hours").toISOString()
      })
      .where("id = :id", { id: apiKeyObject.id })
      .execute()
    }
  }

  public async delete(id) {
    this.apiKeyRepository.createQueryBuilder()
    .delete()
    .where("id = :id", { id: id })
    .execute()
  }

  private async getApiKey (apiKey: string) {
    return await this.apiKeyRepository.findOne({ apiKey })
  }

  private generateApikey(length: Number) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;

    for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

   return result;
  }

  public async isApiKeyValid(apiKey: string) {
    let apiKeyObject = await this.getApiKey(apiKey);

    if (apiKeyObject) {
      if (moment().isAfter(apiKeyObject.expiresAt)) {
        throw new UnauthorizedException("Kindly refresh your API Key")
      }
    }

    return false;
  }


  public async getVesselCIIData(@Req() request: Request, data: GetCIIDataDto) {
    const { ciiQuery, categoryQuery, requiredQuery } = this.vesselService.generateCiiQueryString(0);

    const { dwt } = data;

    const apiKey = request.headers["x-api-key"];
    
    const apiKeyObject = await this.getApiKey(apiKey);

    console.log(apiKeyObject);
    
    const vessel = await this.vesselRepository.findOne({ where: { email: apiKeyObject.email} })

    const vesselId = vessel?.id;

    return vesselId ? await this.vesselTripRepository.manager.query(`
        SELECT
          ${ciiQuery} AS cii,
          ${categoryQuery} AS category,
          ${ABound} * (${requiredQuery}) AS aBound,
          ${BBound} * (${requiredQuery}) AS bBound,
          ${CBound} * (${requiredQuery}) AS cBound,
          ${DBound} * (${requiredQuery}) AS dBound,
          from_date as fromDate,
          to_date as toDate
        FROM vessel_trip
        ${this.vesselService.generateLeftJoinTable([
          'vessel',
          'vessel_type',
          'year_tbl'
        ])}
        WHERE
          vessel_trip.journey_type = 'CII'
          AND vessel = ${vesselId}
          AND vessel_type_id = '${data.vesselType}'
          ${data.mgo ? `AND mgo = ${data.mgo}` : ""}
          ${data.lfo ? `AND lfo = ${data.lfo}` : ""}
          ${data.hfo ? `AND hfo = ${data.hfo}` : ""}
          ${data.vlsfo_ad ? `AND vlsfo_ad = ${data.vlsfo_ad}` : ""}
          ${data.vlsfo_xb ? `AND vlsfo_xb = ${data.vlsfo_xb}` : ""}
          ${data.vlsfo_ek ? `AND vlsfo_ek = ${data.vlsfo_ek}` : ""}
          ${data.lpg_pp ? `AND lpg_pp = ${data.lpg_pp}` : ""}
          ${data.lpg_bt ? `AND lpg_bt = ${data.lpg_bt}` : ""}
          ${data.bio_fuel ? `AND bio_fuel = ${data.bio_fuel}` : ""}
          ${
            dwt && dwt.length > 0
              ? `${dwt[0] ? `AND vessel.dwt >= ${dwt[0]}` : ''}
                  ${dwt[1] > 0 ? `AND vessel.dwt <= ${dwt[1]}` : ''}`
              : ''
            }
          AND vessel_trip.distance_traveled >= '${data.distanceTravelled}' 
      `)
      :
      {
        message: "No data for this user"
      }
      ;
  }

}


