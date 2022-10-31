import { Test, TestingModule } from '@nestjs/testing';

import { VesselsService } from './vessels.service';

describe('VesselsService', () => {
  let service: VesselsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VesselsService,
      ],
    }).compile();

    service = module.get<VesselsService>(VesselsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
