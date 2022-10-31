import { genSalt, hash } from 'bcrypt';
import { MigrationInterface, QueryRunner } from 'typeorm';

import { User } from '../../modules/users/entities/user.entity';
import { VesselType } from '../../modules/vessels/entities/vessel-type.entity';
import { Company } from '../../modules/companies/entities/company.entity';

export class vesselType1652054123221 implements MigrationInterface {
  name = 'vesselType1652054123221';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const vesselTypeRepository = queryRunner.connection.getRepository(VesselType);
    const vesselTypes: Partial<VesselType>[] = [
      {
        id: 1,
        vessel_type: 'Tanker',
      },
      {
        id: 2,
        vessel_type: 'Bulk Carrier',
      }
    ];

    await vesselTypeRepository.save(vesselTypes);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
