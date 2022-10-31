import { genSalt, hash } from 'bcrypt';
import { MigrationInterface, QueryRunner } from 'typeorm';

import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../modules/users/entities/user-role.entity';
import { Company } from '../../modules/companies/entities/company.entity';

export class userRole1634751802089 implements MigrationInterface {
  name = 'userRole1634751802089';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const userRoleRepository = queryRunner.connection.getRepository(UserRole);
    const userRoles: Partial<UserRole>[] = [
      {
        id: 1,
        role: 'super_admin',
      },
      {
        id: 2,
        role: 'company_editor',
      },
      {
        id: 3,
        role: 'viewer',
      },
    ];

    await userRoleRepository.save(userRoles);

    const companyRepository = queryRunner.connection.getRepository(Company);
    const companyData: Partial<Company> = {
      name: 'Test Company',
      primaryContactName: 'Test',
      primaryContactEmailAddress: 'test@gmail.com',
      packageType: 'Test package',
      country: 'UK',
    };

    const company = await companyRepository.save(companyData);

    const userRepository = queryRunner.connection.getRepository(User);
    const salt = await genSalt(parseInt(process.env.SALT_ROUNDS));
    const password = await hash('demo12345', salt);
    const smsUser: Partial<User> = {
      firstname: 'Demo',
      lastname: 'User',
      email: 'demo@email.com',
      password: password,
      userRole: 1,
      companyId: company.id,
      isActive: true,
      phoneNumber: '+35796331645',
    };

    const michalis: Partial<User> = {
      firstname: 'Michalis',
      lastname: 'Odysseos',
      email: 'm.odysseos@exeliatech.com',
      password: password,
      userRole: 2,
      companyId: company.id,
      isActive: true,
    };

    const vladimir: Partial<User> = {
      firstname: 'Vladimir',
      lastname: 'Bazarov',
      email: 'v.bazarov@exeliatech.com',
      password: password,
      userRole: 3,
      companyId: company.id,
      isActive: true,
    };

    const elena: Partial<User> = {
      firstname: 'Elena',
      lastname: 'Christoforou',
      email: 'elenach187@gmail.com',
      password: password,
      userRole: 1,
      companyId: company.id,
      isActive: true,
    };

    const mark: Partial<User> = {
      firstname: 'Mark',
      lastname: 'Yarovoi',
      email: 'm.yarovoi@exeliatech.com',
      password: password,
      userRole: 1,
      companyId: company.id,
      isActive: true,
    };

    await userRepository.save(smsUser);
    await userRepository.save(michalis);
    await userRepository.save(vladimir);
    await userRepository.save(elena);
    await userRepository.save(mark);
  }

  public async down(queryRunner: QueryRunner): Promise<void> { }
}
