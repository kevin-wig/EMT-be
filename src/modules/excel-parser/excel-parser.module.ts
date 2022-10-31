import { Module } from '@nestjs/common';

import { ExcelParserService } from './services/excel-parser.service';
import { ExcelParserController } from './controllers/excel-parser.controller';

@Module({
  controllers: [ExcelParserController],
  providers: [ExcelParserService],
})
export class ExcelParserModule {}
