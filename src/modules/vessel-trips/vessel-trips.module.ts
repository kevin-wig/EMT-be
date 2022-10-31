import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VesselTripsService } from './services/vessel-trips.service';
import { VesselTripsController } from './controllers/vessel-trips.controller';
import { VesselTrip } from './entities/vessel-trip.entity';
import { Port } from '../vessels/entities/port.entity';
import { VesselsModule } from '../vessels/vessels.module';
import { UsersModule } from '../users/users.module';
import { VesselsService } from '../vessels/services/vessels.service';
import { Vessel } from '../vessels/entities/vessel.entity';
import { Ghg } from '../vessels/entities/ghg.entity';
import { Fuel } from '../vessels/entities/fuel.entity';
import { User } from '../users/entities/user.entity';
import { ExcelService } from '../../shared/services/excel.service';
import { PdfService } from '../../shared/services/pdf.service';
import { Grade } from './entities/grade.entity';
import { VesselType } from '../vessels/entities/vessel-type.entity';
import { YearlyAggregate } from './entities/yearly-aggregate.entity';
import { Fleet } from '../fleets/entities/fleet.entity';
import { CompaniesService } from '../companies/services/companies.service';
import { CompaniesModule } from '../companies/companies.module';
import { Company } from '../companies/entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VesselTrip,
      VesselType,
      Port,
      Vessel,
      Ghg,
      Fuel,
      Fleet,
      Port,
      Ghg,
      User,
      YearlyAggregate,
      Grade,
      Company
    ]),
    VesselsModule,
    UsersModule,
  ],
  controllers: [VesselTripsController],
  exports: [VesselTripsService],
  providers: [VesselTripsService, VesselsService, ExcelService, PdfService],
})
export class VesselTripsModule {}
