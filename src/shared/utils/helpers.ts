import { Column, Workbook } from 'exceljs';

import { BasicColumn } from '../constants/global.constants';
import {
  BASIC_VESSEL_HEADER,
  DEFAULT_WORKSHEET_NAME,
} from '../constants/excel.constants';
import { TableBodyCellDto, TableHeaderCellDto } from '../dtos/excel.dto';

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
