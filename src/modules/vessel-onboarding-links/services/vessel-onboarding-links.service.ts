import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VesselsService } from 'src/modules/vessels/services/vessels.service';
import { Repository } from 'typeorm';
import { VesselOnboardingLinksDto } from '../dto/vessel-onboarding-links.dto';
import { VesselOnboardingLinks } from '../entities/vessel-onboarding-links.entity';

@Injectable()
export class VesselOnboardingLinksService {
  constructor(
    @InjectRepository(VesselOnboardingLinks)
    private vesselOnboardingLinkRepository: Repository<VesselOnboardingLinks>,
    private vesselsService: VesselsService,
  ) {}

  async findAll() {
    return await this.vesselOnboardingLinkRepository.find();
  }

  async findByCompanyId(company_id: number) {
    return await this.vesselOnboardingLinkRepository.find({
      where: { company_id },
    });
  }

  async findBy(searchParam: object) {
    const key = Object.keys(searchParam)[0];
    const value = Object.values(searchParam)[0];

    return this.vesselOnboardingLinkRepository.find({
      where: { [key]: value },
    });
  }

  async findByCompany(company_id: number) {
    const imoArray = [];
    const links = await this.vesselOnboardingLinkRepository.find({
      company_id,
    });
    links.forEach((link) => {
      imoArray.push(link.imo);
    });
    return imoArray;
  }

  async createOnboardingLink(
    vesselOnboardingLinksDto: VesselOnboardingLinksDto,
  ) {
    return this.vesselOnboardingLinkRepository.save(vesselOnboardingLinksDto);
  }

  async removeByImo(imo: string) {
    const onboardingLink = await this.vesselOnboardingLinkRepository.findOne({
      imo,
    });
    return await this.vesselOnboardingLinkRepository.delete(
      onboardingLink.link_id,
    );
  }
  async getImoList() {
    const rawImoList = [];
    const imoList = [];
    (await this.findAll()).forEach((link) => rawImoList.push(link.imo));
    (await this.vesselsService.findAll()).forEach((vessel) => {
      const imoListObj = {
        vesselId: vessel.id,
        vesselName: vessel.name,
        imo: vessel.imo,
        linked: rawImoList.includes(vessel.imo),
      };
      imoList.push(imoListObj);
    });
    return imoList;
  }
}
