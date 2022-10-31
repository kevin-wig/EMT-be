import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { UsersModule } from '../users/users.module';
import { FleetsModule } from '../fleets/fleets.module';
import { VesselsModule } from '../vessels/vessels.module';
import { VesselTripsModule } from '../vessel-trips/vessel-trips.module';
import { ExcelParserModule } from '../excel-parser/excel-parser.module';
import { TwoFactorModule } from '../two-factor/two-factor.module';
import { TokensModule } from '../tokens/tokens.module';
import config from '../../database/config/local';
import { LoggerMiddleware } from '../../middlewares/logger.middleware';
import { SwaggerService } from '../../swagger/swagger.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiKeyModule } from '../third-party/api-key.module';
import { VesselOnboardingLinksModule } from '../vessel-onboarding-links/vessel-onboarding-links.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(config as TypeOrmModuleOptions),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    CompaniesModule,
    AuthModule,
    FleetsModule,
    VesselsModule,
    VesselTripsModule,
    TwoFactorModule,
    ExcelParserModule,
    TokensModule,
    ApiKeyModule,
    VesselOnboardingLinksModule,
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AppService, SwaggerService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
