import { Column } from 'exceljs';
import { OrderDirection } from '../dtos/sort-order.dto';

export enum Roles {
  SUPER_ADMIN = 'super_admin',
  COMPANY_EDITOR = 'company_editor',
  VIEWER = 'viewer',
}

export enum AuthMethod {
  MOBILE = 'mobile',
  EMAIL = 'email',
}

export enum TokenType {
  DEFAULT = 'default',
  EMAIL_VERIFICATION = 'email_verification',
  CHANGE_PASSWORD = 'change_password',
  RESET_PASSWORD = 'reset_password',
}

export enum FuelType {
  MGO = 'MGO',
  LFO = 'LFO',
  HFO = 'HFO',
  LNG = 'LNG',
  VLSFO_AD = 'VLSFO_AD',
  VLSFO_EK = 'VLSFO_EK',
  VLSFO_XB = 'VLSFO_XB',
  LPG_PP = 'LPG_PP',
  LPG_BT = 'LPG_BT',
  BIO_FUEL = 'BIO_FUEL',
}

export enum GraphLevel {
  YEAR = 'YEAR',
  MONTH = 'MONTH',
  VOYAGE = 'VOYAGE',
  TRIP = 'TRIP',
}

export const FuelFactors = {
  MGO: 3.206,
  LFO: 3.151,
  HFO: 3.114,
  LNG: 2.75,
  VLSFO: 3.0, // Added for test
  VLSFO_AD: 3.151,
  VLSFO_EK: 3.114,
  VLSFO_XB: 3.206,
  LPG_PP: 3,
  LPG_BT: 3.03,
  BIO_FUEL: 2.8,
};

export const RESET_PASSWORD_URL =
  (process.env.WEB_APP_HOST || 'http://localhost:3001') +
  `/auth/reset-password`;

export const DEFAULT_PAGE_LIMIT = 10;
export const MAX_PAGE_LIMIT = 1000;

export const DEFAULT_SORT_BY = 'id';
export const DEFAULT_ORDER = OrderDirection.DESC;

export type BasicColumn = Pick<Column, 'header' | 'key' | 'width'>;

export enum JourneyType {
  CII = 'CII',
  ETS = 'ETS',
}

export enum VoyageType {
  ACTUAL = 'ACTUAL',
  PREDICTED = 'PREDICTED',
  ARCHIVED = 'ARCHIVED'
}

export const ABound = 0.82;
export const BBound = 0.93;
export const CBound = 1.08;
export const DBound = 1.28;
export const ABound_BC = 0.86;
export const BBound_BC = 0.94;
export const CBound_BC = 1.06;
export const DBound_BC = 1.18;
