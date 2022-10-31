import { Test, TestingModule } from '@nestjs/testing';

import { ExcelParserController } from './excel-parser.controller';
import { ExcelParserService } from '../services/excel-parser.service';

describe('ExcelParserController', () => {
  let controller: ExcelParserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExcelParserController],
      providers: [ExcelParserService],
    }).compile();

    controller = module.get<ExcelParserController>(ExcelParserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
