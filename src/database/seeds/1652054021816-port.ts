import { MigrationInterface, QueryRunner } from 'typeorm';
import { readFileSync } from 'fs';
import { Port } from '../../modules/vessels/entities/port.entity';

export class port1652054021816 implements MigrationInterface {
  name = 'port1652054021816';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const data = readFileSync('ports.json', { encoding: 'utf-8' });

    const json = JSON.parse(data);
    const portRepository = queryRunner.connection.getRepository(Port);
    const ports: Partial<Port>[] = json.map((port: any) => ({
      name: port,
    }));

    await portRepository.save(ports);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
