import { Test, TestingModule } from '@nestjs/testing';

import { VesselsController } from './vessels.controller';
import { VesselsService } from '../services/vessels.service';

describe('VesselsController', () => {
  let controller: VesselsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VesselsController],
      providers: [VesselsService],
    }).compile();

    controller = module.get<VesselsController>(VesselsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
