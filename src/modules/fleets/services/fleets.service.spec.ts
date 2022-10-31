import { Test, TestingModule } from '@nestjs/testing';
import { FleetsService } from './fleets.service';

describe('FleetsService', () => {
  let service: FleetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FleetsService],
    }).compile();

    service = module.get<FleetsService>(FleetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
