import {
  ListSuccessResponseDto,
  SuccessResponseDto,
} from '../../../shared/dtos/success-response.dto';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';

export class SuccessUserResponseDto extends SuccessResponseDto<User> {}

export class AllUsersDto extends SuccessResponseDto<User> {}

export class UsersListDto extends ListSuccessResponseDto<User[]> {}

export class UserRolesDto extends SuccessResponseDto<UserRole[]> {}
