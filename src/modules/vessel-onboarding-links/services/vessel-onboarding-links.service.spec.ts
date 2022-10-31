import { Test, TestingModule } from '@nestjs/testing';
import { VesselsService } from 'src/modules/vessels/services/vessels.service';
import { VesselOnboardingLinksService } from './vessel-onboarding-links.service';

describe('VesselOnboardingLinksService', () => {
  let service: VesselOnboardingLinksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VesselOnboardingLinksService],
    }).compile();

    service = module.get<VesselOnboardingLinksService>(
      VesselOnboardingLinksService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
