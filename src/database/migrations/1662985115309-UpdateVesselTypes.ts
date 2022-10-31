import {MigrationInterface, QueryRunner} from "typeorm";

export class UpdateVesselTypes1662985115309 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.query(
            `UPDATE vessel_type set vessel_type = 'Chemical Tanker' WHERE id = '1'`
        );

        await queryRunner.manager.query(
            `UPDATE vessel_type set vessel_type = 'Oil Tanker' WHERE id = '2'`
        );

        await queryRunner.manager.query(
            `INSERT INTO vessel_type (id, vessel_type) VALUES ('3', 'Bulk Carrier')`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
