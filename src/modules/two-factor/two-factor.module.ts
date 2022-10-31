import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { jwtConstants } from '../auth/constants';
import { TwoFactor } from './entities/two-factor.entity';
import { TwoFactorController } from './controller/two-factor.controller';
import { TwoFactorService } from './services/two-factor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TwoFactor]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiresIn },
    }),
  ],
  exports: [TwoFactorService],
  controllers: [TwoFactorController],
  providers: [TwoFactorService],
})
export class TwoFactorModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply()
      .forRoutes({ path: 'two-factor', method: RequestMethod.POST });
    consumer
      .apply()
      .forRoutes({ path: 'two-factor/:id', method: RequestMethod.GET });
  }
}
