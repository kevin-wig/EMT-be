import { Module } from '@nestjs/common';
import { VesselOnboardingLinksService } from './services/vessel-onboarding-links.service';
import { VesselOnboardingLinksController } from './controllers/vessel-onboarding-links.controller';
import { UsersModule } from '../users/users.module';
import { Company } from '../companies/entities/company.entity';
import { Vessel } from '../vessels/entities/vessel.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VesselOnboardingLinks } from './entities/vessel-onboarding-links.entity';
import { VesselsModule } from '../vessels/vessels.module';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Vessel, VesselOnboardingLinks]),
    UsersModule,
    CompaniesModule,
    VesselsModule,
  ],
  exports: [VesselOnboardingLinksService],
  controllers: [VesselOnboardingLinksController],
  providers: [VesselOnboardingLinksService],
})
export class VesselOnboardingLinksModule {}
