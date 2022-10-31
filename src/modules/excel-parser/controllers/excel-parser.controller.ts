import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  StreamableFile,
  Response,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'fs';
import { join } from 'path';

import { ExcelParserService } from '../services/excel-parser.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SuccessResponseDto } from '../../../shared/dtos/success-response.dto';
import { FailedResponseDto } from '../../../shared/dtos/failed-response.dto';
import { JourneyType, Roles } from 'src/shared/constants/global.constants';
import { HasRole } from 'src/modules/users/decorators/user-role.decorator';

@UseGuards(JwtAuthGuard)
@ApiTags('excel-parser')
@Controller('excel-parser')
export class ExcelParserController {
  constructor(private readonly excelParserService: ExcelParserService) { }

  @Post('vessel')
  @ApiOperation({
    description: 'Parse excel file of vessel data',
  })
  @ApiResponse({ status: 201, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  @UseInterceptors(FileInterceptor('excel', { dest: './upload' }))
  async parseVessel(@UploadedFile() excel: Express.Multer.File): Promise<any> {
    const data = await this.excelParserService.vesselParser(excel);
    return {
      message: 'Ship particulars are extracted successfully',
      data,
    };
  }

  @Post('vessel-trip')
  @ApiOperation({
    description: 'Parse excel file of vessel trip data',
  })
  @ApiResponse({ status: 201, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  @UseInterceptors(FileInterceptor('excel', { dest: './upload' }))
  async parseVesselTrip(
    @UploadedFile() excel: Express.Multer.File,
  ): Promise<any> {
    const data = await this.excelParserService.vesselTripParser(excel);
    return {
      message: `${data.length} trips are extracted`,
      data,
    };
  }

  @Post('journey')
  @ApiOperation({
    description: 'Parse excel file of vessel journey data',
  })
  @ApiResponse({ status: 201, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  @UseInterceptors(FileInterceptor('excel', { dest: './upload' }))
  async parseVesselJourney(
    @UploadedFile() excel: Express.Multer.File,
  ): Promise<any> {
    const ciiData = await this.excelParserService.vesselJourneyParser(excel, 0)
    const etsData = await this.excelParserService.vesselJourneyParser(excel, 1)
    return {
      message: 'Vessel journey extracted successfully',
      data: [...ciiData,...etsData],
    };
  }

  @Get('vessel')
  @ApiOperation({
    description: 'Download sample excel file of vessel data',
  })
  @ApiResponse({ status: 200 })
  getVessel(@Response({ passthrough: true }) res): StreamableFile {
    const file = createReadStream(
      join(process.cwd(), 'templates/sample_vessel.xlsx'),
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="sample_vessel.xlsx"',
    });
    return new StreamableFile(file);
  }

  @Get('vessel-trip')
  @ApiOperation({
    description: 'Download sample excel file of vessel journey data',
  })
  @ApiResponse({ status: 200 })
  getVesselJourney(@Response({ passthrough: true }) res): StreamableFile {
    const file = createReadStream(
      join(process.cwd(), 'templates/sample_voyage.xlsx'),
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="sample_voyage.xlsx"',
    });
    return new StreamableFile(file);
  }
}
