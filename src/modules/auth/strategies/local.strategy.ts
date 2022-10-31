import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthService } from '../services/auth.service';
import { IValidatedUser } from '../auth.types';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<IValidatedUser> {
    const user = await this.authService.validateUser(email, password);
    if (user) {
      if (user.isActive) {
        return user;
      } else {
        throw new ForbiddenException({
          message: 'Your email is not verified',
          isNotActive: true,
        });
      }
    } else {
      throw new BadRequestException(
        'The email or password you entered is incorrect',
      );
    }
  }
}
