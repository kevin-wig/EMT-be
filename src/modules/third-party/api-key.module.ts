import { Module } from '@nestjs/common';

import { ApiKeyService } from './services/api-key.service';
import { ApiKeyController } from './controllers/api-key.controller';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vessel } from '../vessels/entities/vessel.entity';
import { VesselTrip } from '../vessel-trips/entities/vessel-trip.entity';
import { ApiKey } from './entities/api-key.entity';
import { VesselsModule } from '../vessels/vessels.module';
import { VesselOnboardingLinks } from '../vessel-onboarding-links/entities/vessel-onboarding-links.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApiKey,
      Vessel,
      VesselTrip,
      VesselOnboardingLinks,
    ]),
    UsersModule,
    VesselsModule,
  ],
  exports: [ApiKeyService],
  controllers: [ApiKeyController],
  providers: [ApiKeyService],
})
export class ApiKeyModule {
}
