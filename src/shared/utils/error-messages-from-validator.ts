import { ValidationError } from '@nestjs/common';

import { ValidationError as CustomValidationError } from '../../exceptions/validation.exception';

export const errorMessagesFromValidator = (
  messages: CustomValidationError,
  error: ValidationError,
): CustomValidationError => ({
  ...messages,
  [error.property]:
    error.constraints || !error.children || error.children.length === 0
      ? Object.values(error.constraints || [])
      : error.children.reduce(errorMessagesFromValidator, {}),
});
