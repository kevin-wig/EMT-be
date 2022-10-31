import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CompaniesController } from './controllers/companies.controller';
import { Company } from './entities/company.entity';
import { CompaniesService } from './services/companies.service';
import { VesselsService } from '../vessels/services/vessels.service';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { Vessel } from '../vessels/entities/vessel.entity';
import { VesselTrip } from '../vessel-trips/entities/vessel-trip.entity';
import { Port } from '../vessels/entities/port.entity';
import { Ghg } from '../vessels/entities/ghg.entity';
import { Fuel } from '../vessels/entities/fuel.entity';
import { ExcelService } from '../../shared/services/excel.service';
import { FleetsService } from '../fleets/services/fleets.service';
import { Fleet } from '../fleets/entities/fleet.entity';
import { PdfService } from '../../shared/services/pdf.service';
import { Grade } from '../vessel-trips/entities/grade.entity';
import { VesselType } from '../vessels/entities/vessel-type.entity';
import { VesselOnboardingLinks } from '../vessel-onboarding-links/entities/vessel-onboarding-links.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      Vessel,
      VesselType,
      VesselTrip,
      Port,
      Ghg,
      Fuel,
      User,
      Fleet,
      Grade,
      VesselOnboardingLinks,
    ]),
    UsersModule,
  ],
  exports: [CompaniesService],
  controllers: [CompaniesController],
  providers: [
    PdfService,
    CompaniesService,
    VesselsService,
    FleetsService,
    ExcelService,
  ],
})
export class CompaniesModule {}
