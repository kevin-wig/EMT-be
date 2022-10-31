import { Injectable } from '@nestjs/common';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

import {
  FilterDto,
  TableBodyCellDto,
  TableHeaderCellDto,
} from '../dtos/excel.dto';
import { camelToTitle } from '../utils/cameToTitle';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake');

const getFontSettings = () => ({
  MetricWeb: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
});

const getTableLayouts = () => ({
  resultTable: {
    hLineWidth: () => 1,
    vLineWidth: () => 1,
    hLineColor: () => '#B7B7B7',
    vLineColor: () => '#B7B7B7',
    paddingTop: () => 5,
    paddingBottom: () => 5,
  },
});

const getDocDefinition = (
  header: TableHeaderCellDto[],
  content: TableBodyCellDto[],
  filters: { key: string; value: string | number }[],
  screenshot: string,
) => {
  const headerRow = header.map((data) => ({
    text: data.label,
    alignment: 'center',
  }));

  const contentRows = content.map((data) => [
    ...header.map((dt) => {
      return {
        text:
          typeof data[dt.key] === 'number'
            ? Number(data[dt.key]).toFixed(2)
            : data[dt.key],
        alignment: 'center',
      };
    }),
  ]);

  return {
    pageSize: 'A4',
    content: [
      {
        stack: [
          {
            image: `upload/${screenshot}`,
            width: 480,
          },
        ],
        margin: [0, 0, 20, 0],
        width: '100%',
        fillColor: '#e2e2e2',
      },
      {
        stack: filters.map((filter) => ({
          text: filter.key + ': ' + filter.value,
          fontSize: 10,
          lineHeight: 1.5,
        })),
        alignment: 'left',
        margin: [10, 5, 0, 0],
        style: ['black'],
        fillColor: '#e2e2e2',
      },
      {
        layout: 'resultTable',
        table: {
          widths: header.map(() => 400 / header.length),
          body: [headerRow, ...contentRows],
        },
        margin: [10, 0, 0, 0],
        fontSize: 8,
        alignment: 'center',
      },
    ],
    styles: {
      'gray-text': {
        color: '#666666',
      },
      black: {
        color: '#000000',
      },
      footer: {
        fontSize: 8,
        lineHeight: 1.4,
        width: 500,
        font: 'MetricWeb',
        alignment: 'center',
      },
    },
    defaultStyle: {
      color: '#000',
      font: 'MetricWeb',
    },
  } as TDocumentDefinitions;
};

@Injectable()
export class PdfService {
  constructor() {}

  generateTablePdf<T>(
    rawData: T[],
    header: TableHeaderCellDto[],
    filters: FilterDto,
    screenshot?: string,
  ): PDFKit.PDFDocument {
    const content = rawData.map(
      (row) =>
        ({
          ...row,
        } as unknown as TableBodyCellDto),
    );

    const fonts = getFontSettings();
    const tableLayouts = getTableLayouts();
    const printer = new PdfPrinter(fonts);

    const filterParams = Object.entries(filters)
      .filter((filter) => !!filter[1])
      .map((item) => ({
        key: camelToTitle(item[0]),
        value: item[1],
      }));

    const docDefinition = getDocDefinition(
      header,
      content,
      filterParams,
      screenshot,
    );

    return printer.createPdfKitDocument(docDefinition, { tableLayouts });
  }
}
