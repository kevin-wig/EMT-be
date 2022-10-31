import { AuthMethod } from '../../shared/constants/global.constants';
import { Company } from '../companies/entities/company.entity';
import { UserRole } from '../users/entities/user-role.entity';

export interface IValidatedUser {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phoneNumber: string;
  createdAt: Date;
  isActive: boolean;
  userRole: number;
  authenticationMethod: AuthMethod;
  companyId: number;
  company: Company;
}

export interface IVerifiedUser {
  id: number;
  email: string;
  userRole: UserRole;
}

export interface IPayload {
  id: number;
  email: string;
  role: string;
  sub: string;
}

export interface IRequest extends Request {
  user: IPayload;
}

export interface IAuthGuardRequest extends Request {
  user: IVerifiedUser;
}
