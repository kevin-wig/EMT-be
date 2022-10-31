import { BadRequestException } from '@nestjs/common';

export interface ValidationError {
  [key: string]: ValidationError | string[];
}

export class ValidationException extends BadRequestException {
  constructor(public validationErrors: ValidationError) {
    super();
  }
}
