import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VesselsService } from './services/vessels.service';
import { VesselsController } from './controllers/vessels.controller';
import { Vessel } from './entities/vessel.entity';
import { Fuel } from './entities/fuel.entity';
import { Port } from './entities/port.entity';
import { Ghg } from './entities/ghg.entity';
import { VesselTrip } from '../vessel-trips/entities/vessel-trip.entity';
import { User } from '../users/entities/user.entity';
import { Fleet } from '../fleets/entities/fleet.entity';
import { UsersModule } from '../users/users.module';
import { ExcelService } from '../../shared/services/excel.service';
import { PdfService } from '../../shared/services/pdf.service';
import { Grade } from '../vessel-trips/entities/grade.entity';
import { VesselType } from './entities/vessel-type.entity';
import { CompaniesService } from '../companies/services/companies.service';
import { Company } from '../companies/entities/company.entity';
import { FleetsService } from '../fleets/services/fleets.service';
import { VesselOnboardingLinks } from '../vessel-onboarding-links/entities/vessel-onboarding-links.entity';
import { VesselOnboardingLinksModule } from '../vessel-onboarding-links/vessel-onboarding-links.module';
import { VesselOnboardingLinksService } from '../vessel-onboarding-links/services/vessel-onboarding-links.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vessel,
      VesselType,
      VesselTrip,
      Fleet,
      Fuel,
      Port,
      Ghg,
      User,
      Grade,
      Company,
      VesselOnboardingLinks,
    ]),
    UsersModule,
  ],
  exports: [VesselsService],
  controllers: [VesselsController],
  providers: [
    VesselsService,
    ExcelService,
    PdfService,
    CompaniesService,
    FleetsService,
    VesselOnboardingLinksService,
  ],
})
export class VesselsModule {}
