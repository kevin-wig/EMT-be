import { BadRequestException, Injectable } from '@nestjs/common';
import { Row, Workbook, Worksheet } from 'exceljs';
import * as moment from 'moment';
import { JourneyType } from 'src/shared/constants/global.constants';
import {
  VESSEL_JOURNEY_STRUCTURE_SAMPLE,
  VESSEL_STRUCTURE_SAMPLE,
  VESSEL_TRIP_STRUCTURE_SAMPLE,
  VESSEL_VOYAGE_STRUCTURE_SAMPLE,
} from '../../../shared/constants/excel.constants';

@Injectable()
export class ExcelParserService {
  extractValue(key: string, text: string) {
    return text.replace(key, '').trim();
  }

  private async isValidateExcel(
    worksheet: Worksheet,
    structure: { label: string; key: string; position?: any }[],
  ) {
    return !structure.find(
      (item) =>
        !worksheet
          .getRow(item.position[0])
          .findCell(item.position[1])
          ?.text.includes(item.label),
    );
  }

  async vesselParser(file) {
    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(file.path);
      const workSheet: Worksheet = workbook['worksheets'][0];
      const vessels = [];

      const isValid = await this.isValidateExcel(
        workSheet,
        VESSEL_STRUCTURE_SAMPLE,
      );

      if (!isValid) {
        throw new BadRequestException('Invalid Excel file structure');
      }

      const rowCount = workSheet?.rowCount;

      for (let i = 2; i <= rowCount; i++) {
        const row: Row = workSheet.getRow(i);
        const data = VESSEL_STRUCTURE_SAMPLE.reduce(
          (vessel, item, key) => {
            let data;
            if (!row.findCell(key + 1)) {
              data =
                item.type === 'float'
                  ? 0
                  : item.type === 'date'
                    ? new Date()
                    : '';
            } else {
              data = row.findCell(key + 1).text;
            }

            return {
              ...vessel,
              [item.key]: data,
            };
          },
          {},
        );

        vessels.push({
          ...data
        });
      }

      return vessels.filter(vessel => vessel.name && vessel.imo);
    } catch (e) {
      throw new BadRequestException(
        'Invalid Excel file structure for ship particulars',
      );
    }
  }

  async vesselTripParser(file) {
    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(file.path);
      const workSheet: Worksheet = workbook['worksheets'][0];

      const vesselTrips = [];
      const rowCount = workSheet?.rowCount;

      const isValid = await this.isValidateExcel(
        workSheet,
        VESSEL_TRIP_STRUCTURE_SAMPLE,
      );

      if (!isValid) {
        throw new BadRequestException('Invalid Excel file structure');
      }

      for (let i = 3; i < rowCount; i++) {
        const row: Row = workSheet.getRow(i);

        const data = VESSEL_TRIP_STRUCTURE_SAMPLE.reduce((trip, item, key) => {
          return {
            ...trip,
            [item.key]: row.findCell(key + 1) ? row.findCell(key + 1).text : '',
          };
        }, {});

        vesselTrips.push(data);
      }

      return vesselTrips;
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Invalid trip excel file');
    }
  }

  async vesselJourneyParser(file, tab = 0) {
    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(file.path);
      const workSheet: Worksheet = workbook['worksheets'][tab];

      const isValid = await this.isValidateExcel(
        workSheet,
        VESSEL_VOYAGE_STRUCTURE_SAMPLE,
      );

      if (!isValid) {
        throw new BadRequestException('Invalid Excel file structure');
      }
      let vesselTrips = [];
      const rowCount = workSheet?.rowCount;

      for (let i = 2; i <= rowCount; i++) {
        const row: Row = workSheet.getRow(i);
        const data = VESSEL_VOYAGE_STRUCTURE_SAMPLE.reduce(
          (trip, item, key) => {
            let data;

            if (!row.findCell(key + 1)) {
              data =
                item.type === 'float'
                  ? 0
                  : item.type === 'date'
                    ? new Date()
                    : '';
            } else if (item.type === 'date') {
              const date = moment(row.findCell(key + 1).text, 'DD/MM/YYYY');

              // if (date > moment()) {
              //   throw new BadRequestException('All dates should be past dates');
              // }
              data = date.isValid() ? date : moment()
            } else if (item.type === 'float') {
              data =
                row.findCell(key + 1).text == ''
                  ? 0
                  : parseFloat(row.findCell(key + 1).text);
            } else if (item.key === "voyageId" && row.findCell(key + 1).text !== '' && row.findCell(key + 1).text.length > 12) {
              throw new BadRequestException('Voyage Id should be up to 12 characters');
            } else {
              data = row.findCell(key + 1).text;
            }

            return {
              ...trip,
              [item.key]: data,
            };
          },
          {},
        );

        vesselTrips.push({
          ...data,
          journeyType: tab !== 0 ? JourneyType.ETS : JourneyType.CII,
          vesselName: '',
        });
      }

      vesselTrips = vesselTrips.map(trip => {
        let voyageType;

        // if (trip.fromDate.format('YYYY-MM-DD') > moment().format('YYYY-MM-DD') && trip.toDate.format('YYYY-MM-DD') > moment().format('YYYY-MM-DD')) {
        //   voyageType = 'PREDICTED';
        // } else {
        //   voyageType = 'ACTUAL';
        // }

        voyageType = 'ACTUAL';

        return {
          ...trip,
          voyageType,
        }
      })

      return vesselTrips;
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Invalid Excel file');
    }
  }
}
