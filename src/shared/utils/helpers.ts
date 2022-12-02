import { Column, Workbook } from 'exceljs';

import {
  BasicColumn, OPERATOR_BIGGER,
  OPERATOR_BIGGER_OR_EQUAL,
  OPERATOR_EQUAL, OPERATOR_IN, OPERATOR_INSENSITIVE_LIKE,
  OPERATOR_IS, OPERATOR_LIKE,
  OPERATOR_LITTLE, OPERATOR_LITTLE_OR_EQUAL, OPERATOR_NOT_EQUAL, OPERATOR_NOT_IN,
} from '../constants/global.constants';
import {
  BASIC_VESSEL_HEADER,
  DEFAULT_WORKSHEET_NAME,
} from '../constants/excel.constants';
import { TableBodyCellDto, TableHeaderCellDto } from '../dtos/excel.dto';
import { EntitySchema, getConnection, ObjectType } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';
import { WhereDto } from '../dtos/where.dto';

export const getSpreadsheet = async <T>(
  headers: BasicColumn[],
  data: T[],
  sheetName?: string,
): Promise<Workbook> => {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet();

  worksheet.name = sheetName || DEFAULT_WORKSHEET_NAME;

  worksheet.columns = headers as Column[];

  const headersKeys = headers.map((header) => header.key);

  const rows = data.map((item) => {
    const row = {};

    headersKeys.forEach((key) => (row[key] = item[key]));

    return row;
  });

  worksheet.addRows(rows);

  return workbook;
};

export const getHeaderAndContent = <T>(
  data: T[],
): {
  header: TableHeaderCellDto[];
  content: TableBodyCellDto[];
} => {
  const header =
    data.length > 0
      ? Object.keys(data[0]).map(
          (key) => ({ key, label: key } as TableHeaderCellDto),
        )
      : [];
  const content = data.map(
    (row) =>
      ({
        ...row,
      } as unknown as TableBodyCellDto),
  );

  return { header, content };
};

export const prepareWhere = (
  field: string,
  value: string | number | number[],
  operator = OPERATOR_EQUAL,
  alias = '',
): WhereDto => {
  const result = {
    whereCondition: '',
    whereParams: {},
  };

  switch (operator) {
    case OPERATOR_LITTLE:
    case OPERATOR_LITTLE_OR_EQUAL:
    case OPERATOR_BIGGER:
    case OPERATOR_BIGGER_OR_EQUAL:
    case OPERATOR_EQUAL:
    case OPERATOR_NOT_EQUAL:
    case OPERATOR_IS:
    case OPERATOR_LIKE:
    case OPERATOR_INSENSITIVE_LIKE:
      result.whereCondition = `${alias ? alias + '.' : ''}${field} ${operator} :${field}`;
      result.whereParams[`${field}`] = value;
      break;

    case OPERATOR_IN:
    case OPERATOR_NOT_IN:
      if (value && Array.isArray(value)) {
        let condition = '';

        value.forEach((val, index) => {
          condition += `:${field}${index + 1}`;
          result.whereParams[`${field}${index + 1}`] = val;

          if (index < value.length - 1) {
            condition += ', ';
          }
        });

        result.whereCondition = `${alias ? alias + '.' : ''}${field} ${operator} (${condition})`;
      }
      break;
    default:
      result.whereCondition = `${alias ? alias + '.' : ''}${field} = ${!Array.isArray(value) ? value : ''}`;
      break;
  }

  return result;
};

export const caseInsensitiveCount = async <T>(
  fieldName: string,
  fieldValue: string,
  entity: ObjectType<T> | EntitySchema<T> | string,
): Promise<number> => {
  const where = prepareWhere(
    snakeCase(fieldName),
    `${fieldValue}`,
    OPERATOR_EQUAL,
  );

  return await getConnection()
    .getRepository(entity)
    .createQueryBuilder()
    .where(where.whereCondition, where.whereParams)
    .getCount();
};

export const getCIITableHeader = (year: number) => [
  ...BASIC_VESSEL_HEADER,
  { label: `CO2 Emissions (${year})`, key: 'emissions' },
  { label: `CII (${year})`, key: 'cii' },
  { label: `CII Required (${year})`, key: 'requiredCII' },
  { label: 'CII 2019', key: 'cii2019' },
  { label: 'Category', key: 'category' },
];

export const getEtsTableHeader = (year: number) => [
  ...BASIC_VESSEL_HEADER,
  { label: `CO2 Emissions (${year})`, key: 'totalCo2Emission' },
  { label: 'EUA Cost', key: 'euaCost' },
  { label: 'EUA Cost as % of Bunker Cost', key: 'bcPercent' },
  { label: "EUA Cost as % of Company's Fares", key: 'fpPercent' },
];

export const getGHGTableHeader = (year: number) => [
  ...BASIC_VESSEL_HEADER,
  { label: `GHGs Attained (${year})`, key: 'attained' },
  { label: `GHGs Required (${year})`, key: 'required' },
  { label: `Excess GHGs credits (${year})`, key: 'excess' },
  { label: 'Penalties', key: 'penalties' },
];
