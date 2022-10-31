import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IPayload } from '../auth.types';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  roles: string[];

  constructor(private reflector: Reflector) {
    super(reflector);
  }

  handleRequest(
    err: Error,
    payload: IPayload,
    info,
    context: ExecutionContext,
  ): any {
    //Get user role and store it in request property
    const request = context.switchToHttp().getRequest();
    request.role = payload?.role;

    this.roles = this.reflector.get<string[]>('roles', context.getHandler());

    if (err || !payload) {
      throw err || new ForbiddenException();
    }

    if (this.roles) {
      if (!this.roles.find((role) => payload?.role === role)) {
        throw new ForbiddenException();
      }
    }

    return payload;
  }
}
