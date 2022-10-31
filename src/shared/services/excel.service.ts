import { Injectable } from '@nestjs/common';
import { Column, Workbook, Worksheet } from 'exceljs';

import { BasicColumn, GraphLevel } from '../constants/global.constants';
import { getSpreadsheet } from '../utils/helpers';
import {
  FilterDto,
  TableBodyCellDto,
  TableHeaderCellDto,
} from '../dtos/excel.dto';
import { camelToTitle } from '../utils/cameToTitle';
import {
  CII_REPORT_HEADER,
  DEFAULT_WORKSHEET_NAME,
  ETS_REPORT_KPI,
  ETS_REPORT_HEADER,
  FLEET_HEADER,
} from '../constants/excel.constants';
import {
  CIIReportResponse,
  ETSReportResponse,
  GHGReportResponse,
} from '../../modules/vessels/dto/vessel-response.dto';

@Injectable()
export class ExcelService {
  generateTableExcel<T>(
    rawData: T[],
    header: TableHeaderCellDto[],
    sheetName?: string,
  ): Promise<Workbook> {
    const headers = header.map((data) => {
      const longest = rawData.reduce(
        (max, raw) =>
          raw[data.key] ? Math.max(raw[data.key].toString().length, max) : max,
        0,
      );

      return {
        key: data.key,
        header: data.label,
        width: Math.max(longest, data.label.toString().length) * 1.5,
      } as BasicColumn;
    });

    const content = rawData.map(
      (row) =>
        ({
          ...row,
        } as unknown as TableBodyCellDto),
    );

    return getSpreadsheet(headers, content, sheetName);
  }

  addFilterTableSheet(book: Workbook, filters: FilterDto) {
    const workbook = book;
    const worksheet = workbook.addWorksheet();
    worksheet.name = 'Filters';
    worksheet.columns = FLEET_HEADER as BasicColumn[] as Column[];

    const rows = Object.entries(filters).map((item) => ({
      key: camelToTitle(item[0]),
      value: item[1],
    }));

    worksheet.addRows(rows);

    return workbook;
  }

  generateCIIReportSheet(
    book: Workbook,
    reportData: CIIReportResponse,
    sheetName?: string,
  ): Workbook {
    const workbook = book;
    const worksheet: Worksheet = workbook.addWorksheet();

    worksheet.name = sheetName || DEFAULT_WORKSHEET_NAME;

    worksheet.addRow([
      `Total Emission (${reportData.year})`,
      '',
      String(reportData.totalEmissions),
    ]);
    worksheet.mergeCells('A1:B1');
    worksheet.addRow([]);

    worksheet.addRow(
      CII_REPORT_HEADER.map((header) => {
        if (header.key === 'key') {
          if (reportData.chartLevel === GraphLevel.YEAR) {
            return 'Year';
          } else if (reportData.chartLevel === GraphLevel.MONTH) {
            return 'Month';
          }
        } else {
          return header.label;
        }
      }),
    );

    reportData.chartData.forEach((item) => {
      let firstRowNumber;
      item.data.forEach((row, index, charts) => {
        const excelRow = worksheet.addRow([
          item.name,
          reportData.chartLevel === GraphLevel.MONTH
            ? `${item.year}-${row.key}`
            : row.key,
          row.cii,
        ]);
        if (index === 0) {
          firstRowNumber = excelRow.number;
        }

        if (index === charts.length - 1) {
          worksheet.mergeCells(firstRowNumber, 0, firstRowNumber + index, 0);
          worksheet.getCell(`A${firstRowNumber}`).style = {
            alignment: {
              horizontal: 'center',
              vertical: 'middle',
            },
          };
        }
      });
    });

    return workbook;
  }

  generateCommonReportSheet(
    book: Workbook,
    reportData: ETSReportResponse,
    headers: { label: string; key: string }[],
    kpis: { label: string; key: string }[],
    sheetName?: string,
  ): Workbook {
    const workbook = book;
    const worksheet: Worksheet = workbook.addWorksheet();

    worksheet.name = sheetName || DEFAULT_WORKSHEET_NAME;

    kpis.forEach((kpi, index) => {
      worksheet.addRow([
        `${kpi.label} (${reportData.year})`,
        '',
        String(reportData[kpi.key]),
      ]);
      worksheet.mergeCells(`A${index + 1}:B${index + 1}`);
    });

    worksheet.addRow([]);

    worksheet.addRow(
      headers.map((header) => {
        return header.label;
      }),
    );

    reportData.chartData.forEach((item) => {
      worksheet.addRow(headers.map((header) => item[header.key]));
    });

    return workbook;
  }
}
