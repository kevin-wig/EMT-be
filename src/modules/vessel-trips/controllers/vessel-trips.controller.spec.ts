import { Test, TestingModule } from '@nestjs/testing';
import { VesselTripsController } from './vessel-trips.controller';
import { VesselTripsService } from '../services/vessel-trips.service';

describe('VesselTripsController', () => {
  let controller: VesselTripsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VesselTripsController],
      providers: [VesselTripsService],
    }).compile();

    controller = module.get<VesselTripsController>(VesselTripsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
