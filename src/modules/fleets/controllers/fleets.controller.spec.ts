import { Test, TestingModule } from '@nestjs/testing';

import { FleetsController } from './fleets.controller';
import { FleetsService } from '../services/fleets.service';

describe('FleetsController', () => {
  let controller: FleetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FleetsController],
      providers: [FleetsService],
    }).compile();

    controller = module.get<FleetsController>(FleetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
