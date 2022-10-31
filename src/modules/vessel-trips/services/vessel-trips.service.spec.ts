import { Test, TestingModule } from '@nestjs/testing';
import { VesselTripsService } from './vessel-trips.service';

describe('VesselTripsService', () => {
  let service: VesselTripsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VesselTripsService],
    }).compile();

    service = module.get<VesselTripsService>(VesselTripsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
