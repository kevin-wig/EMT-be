import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

import { FailedResponseDto } from '../shared/dtos/failed-response.dto';

import { ValidationException } from './validation.exception';

@Catch(ValidationException)
export class ValidationFilter implements ExceptionFilter {
  catch(exception: ValidationException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    const resp: FailedResponseDto = {
      status: 'ERROR',
      message: exception.message,
      errors: exception.validationErrors,
    };

    response.status(status).json(resp);
  }
}
