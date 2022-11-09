import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController } from './controllers/users.controller';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { UsersService } from './services/users.service';
import { jwtConstants } from '../auth/constants';
import { TokensModule } from '../tokens/tokens.module';
import { Company } from '../companies/entities/company.entity';
import { Vessel } from '../vessels/entities/vessel.entity';
import { Fleet } from '../fleets/entities/fleet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRole, Company, Vessel, Fleet]),
    TokensModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiresIn },
    }),
  ],
  exports: [UsersService],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
