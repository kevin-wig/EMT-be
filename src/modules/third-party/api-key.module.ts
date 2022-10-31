import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ApiKeyService } from './services/api-key.service';
import { ApiKeyController } from './controllers/api-key.controller';
import { UsersModule } from '../users/users.module';
import { TwoFactorModule } from '../two-factor/two-factor.module';
import { TokensModule } from '../tokens/tokens.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vessel } from '../vessels/entities/vessel.entity';
import { VesselType } from '../vessels/entities/vessel-type.entity';
import { VesselTrip } from '../vessel-trips/entities/vessel-trip.entity';
import { ApiKey } from './entities/api-key.entity';
import { VesselsService } from '../vessels/services/vessels.service';
import { VesselsModule } from '../vessels/vessels.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
        ApiKey,
        Vessel,
        VesselTrip
    ]),
    UsersModule,
    VesselsModule
  ],
  exports: [ApiKeyService],
  controllers: [ApiKeyController],
  providers: [ApiKeyService],
})
export class ApiKeyModule {}
