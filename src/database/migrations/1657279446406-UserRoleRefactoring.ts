import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserRoleRefactoring1657279446406 implements MigrationInterface {
  name = 'UserRoleRefactoring1657279446406';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.query(
      `UPDATE user_role SET role = 'super_admin' WHERE role = 'superuser'`,
    );
    await queryRunner.manager.query(
      `UPDATE user_role SET role = 'company_editor' WHERE role = 'company_admin'`,
    );
    await queryRunner.manager.query(
      `UPDATE user_role SET role = 'viewer' WHERE role = 'manager'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.query(
      `UPDATE user_role SET role = 'manager' WHERE role = 'viewer'`,
    );
    await queryRunner.manager.query(
      `UPDATE user_role SET role = 'company_admin' WHERE role = 'company_editor'`,
    );
    await queryRunner.manager.query(
      `UPDATE user_role SET role = 'superuser' WHERE role = 'super_admin'`,
    );
  }
}
