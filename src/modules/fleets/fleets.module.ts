import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FleetsService } from './services/fleets.service';
import { FleetsController } from './controllers/fleets.controller';
import { Fleet } from './entities/fleet.entity';
import { Vessel } from '../vessels/entities/vessel.entity';
import { UsersModule } from '../users/users.module';
import { VesselsModule } from '../vessels/vessels.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Fleet, Vessel]),
    UsersModule,
    VesselsModule,
  ],
  exports: [FleetsService],
  controllers: [FleetsController],
  providers: [FleetsService],
})
export class FleetsModule {}
