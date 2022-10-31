import { Test, TestingModule } from '@nestjs/testing';
import { VesselOnboardingLinksController } from './vessel-onboarding-links.controller';

describe('VesselOnboardingLinksController', () => {
  let controller: VesselOnboardingLinksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VesselOnboardingLinksController],
    }).compile();

    controller = module.get<VesselOnboardingLinksController>(VesselOnboardingLinksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
