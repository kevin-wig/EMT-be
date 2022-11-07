import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { genSalt, hash } from 'bcrypt';
import { Like, Not, Repository, SelectQueryBuilder } from 'typeorm';

import { MessagingService } from './messaging.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { CHANGE_PASSWORD_URL, EMAIL_VERIFY_URL } from '../users.constants';
import { ISearchQuery } from '../users.types';
import { IPayload } from '../../auth/auth.types';
import { Company } from '../../companies/entities/company.entity';
import { Token } from '../../tokens/entities/token.entity';
import { TokensService } from '../../tokens/tokens.service';
import {
  AuthMethod,
  Roles,
  TokenType,
} from '../../../shared/constants/global.constants';
import { SearchUserDto } from '../dto/search-user.dto';
import {
  OrderDirection,
  SortOrderDto,
} from '../../../shared/dtos/sort-order.dto';
import {
  PaginationDto,
  PaginationParamsDto,
} from '../../../shared/dtos/pagination.dto';
import { ListDto } from '../../../shared/dtos/list.dto';

@Injectable()
export class UsersService {
  constructor(
    private tokensService: TokensService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async create(user: CreateUserDto): Promise<User> {
    if (user.password) {
      const salt = await genSalt(parseInt(process.env.SALT_ROUNDS));
      user.password = await hash(user.password, salt);
    }

    const savedUser: User = await this.usersRepository.save(user);

    await this.sendEmailVerification(savedUser);

    return savedUser;
  }

  async findAll(query: ISearchQuery, user: IPayload): Promise<User[]> {
    const company = query.company;
    const name = query.name;

    let filter: any[] = [];

    if (name) {
      filter.push({ firstname: Like(`%${name}%`), id: Not(user.id) });
      filter.push({ lastname: Like(`%${name}%`), id: Not(user.id) });
    } else {
      filter.push({ id: Not(user.id) });
    }

    if (user.role === Roles.COMPANY_EDITOR || user.role === Roles.SUPER_ADMIN) {
      if (company && company !== '-1') {
        filter = filter.map((item) => ({
          ...item,
          company,
        }));
      }

      return this.usersRepository.find({
        order: { id: OrderDirection.ASC },
        ...(filter.length > 0 && { where: filter }),
        relations: ['company', 'userRole'],
      });
    } else {
      return this.usersRepository.find({
        ...(filter.length > 0 && { where: filter }),
        relations: ['company', 'userRole'],
      });
    }
  }

  async find(
    paginationOption: PaginationParamsDto,
    sortOption: SortOrderDto,
    searchOption: SearchUserDto,
    user: IPayload,
  ): Promise<ListDto<User>> {
    const { page, limit } = paginationOption;
    const { sortBy, order } = sortOption;
    if (user.role === Roles.COMPANY_EDITOR) {
      const me = await this.findOneById(user.id);
      searchOption.companyId = me.companyId;
    }
    const { search, companyId } = searchOption;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id AS id',
        'user.firstname AS firstname',
        'user.lastname AS lastname',
        'user.email AS email',
        'user.createdAt AS createdAt',
        'user_role.role AS userRole',
        'company.name AS company',
      ])
      .leftJoin('user.company', 'company')
      .leftJoin('user.userRole', 'user_role')
      .where('user.id != :me', { me: user.id });

    if (search) {
      queryBuilder
        .andWhere("(CONCAT(user.firstname, ' ', user.lastname) LIKE :search")
        .orWhere('user.email LIKE :search)')
        .setParameter('search', `%${search}%`);
    }

    if (user.role === Roles.COMPANY_EDITOR || user.role === Roles.SUPER_ADMIN) {
      if (companyId) {
        queryBuilder.andWhere('company.id = :companyId', {
          companyId,
        });
      }
    }

    const totalCount = await new SelectQueryBuilder(queryBuilder).getCount();
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    paginationOption.page = Math.max(1, Math.min(totalPages, page));

    const pagination: PaginationDto = {
      ...paginationOption,
      totalCount,
      totalPages,
    };

    queryBuilder
      .orderBy(sortBy ? sortBy : 'user.id', order ? order : OrderDirection.ASC)
      .offset((paginationOption.page - 1) * limit)
      .limit(limit);

    return {
      listData: await queryBuilder.execute(),
      sortOrder: sortOption,
      pagination,
    };
  }

  async getTotalCount(query: ISearchQuery, user: IPayload): Promise<number> {
    const { search, company } = query;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.*',
        'user_role.role AS userRole',
        'company.name AS company',
      ])
      .leftJoin('user.company', 'company')
      .leftJoin('user.userRole', 'user_role')
      .where("CONCAT(user.firstname, ' ', user.lastname) LIKE :search")
      .orWhere('user.email LIKE :search')
      .orWhere('company.name LIKE :search')
      .setParameter('search', `%${search ? search : ''}%`);

    if (user.role === Roles.COMPANY_EDITOR || user.role === Roles.SUPER_ADMIN) {
      if (company) {
        queryBuilder.andWhere('company.id = :company', { company });
      }
    }

    const data = await queryBuilder.execute();

    return data.length;
  }

  findOne(user: Partial<User>): Promise<User> {
    return this.usersRepository.findOne({
      where: { ...user },
      relations: ['company', 'userRole'],
    });
  }

  findOneById(id: number) {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['company', 'userRole'],
    });
  }

  findRoles(): Promise<UserRole[]> {
    return this.userRoleRepository.find({ order: { id: 'ASC' } });
  }

  async findOneByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { email: email },
      relations: ['company', 'userRole'],
    });
  }

  update(id: number, updateUser: UpdateUserDto, user: IPayload) {
    if (user.role === Roles.COMPANY_EDITOR || user.role === Roles.SUPER_ADMIN) {
      return this.usersRepository.update(id, updateUser);
    } else {
      if (user.id === id) {
        if (updateUser.companyId || updateUser.userRole) {
          throw new ForbiddenException();
        } else {
          return this.usersRepository.update(id, updateUser);
        }
      } else {
        throw new ForbiddenException();
      }
    }
  }

  changePassword(id: number, password: string) {
    return this.usersRepository.update(id, { password });
  }

  remove(id: number) {
    return this.usersRepository.delete(id);
  }

  async requestChangePassword(user: IPayload) {
    const existingUser: User = await this.usersRepository.findOne(
      { email: user.email },
      { relations: ['userRole'] },
    );

    const payload = {
      email: existingUser.email,
      id: existingUser.id,
      role: existingUser.userRole,
    };

    const savedToken: Token = await this.tokensService.create({
      token: this.jwtService.sign(payload),
      type: TokenType.CHANGE_PASSWORD,
    });

    const mailService = new MessagingService();
    const url = `${CHANGE_PASSWORD_URL}/${savedToken.token}`;

    if (existingUser.authenticationMethod === AuthMethod.MOBILE) {
      // TODO: need to implemented to send SMS
      await mailService.sendSMS({
        to: existingUser['phoneNumber'],
        body: `Hello,\n\nYour request to change password is accepted.\nPlease click here to change password.`,
      });
    } else {
      await mailService.sendMail({
        to: existingUser.email,
        subject: 'Change Password',
        body: `
          <p>
            Hello, ${existingUser.lastname}
            <br/><br/>
            Your request to change password is accepted.<br/>
            Please click <a href="${url}">here</a> to change password.
          </p>`,
      });
    }
  }

  async sendEmailVerification(user: User, preText?: string) {
    const payload = {
      email: user.email,
      id: user.id,
      role: user.userRole,
    };

    const savedToken: Token = await this.tokensService.create({
      token: this.jwtService.sign(payload),
      type: TokenType.EMAIL_VERIFICATION,
    });

    const mailService = new MessagingService();
    const url = `${EMAIL_VERIFY_URL}/${savedToken.token}`;

    if (user.authenticationMethod === AuthMethod.MOBILE) {
      // TODO: need to implemented to send SMS for email verification
      await mailService.sendSMS({
        to: user['phoneNumber'],
        body: `Hello,\n\nYou are invited.\nPlease verify your email by clicking here.`,
      });
    } else {
      await mailService.sendMail({
        to: user.email,
        subject: 'Email verification',
        body: `
          <p>
            Hello, ${user.lastname}
            ${
              preText === undefined
                ? '<br/><br/>You have been invited.'
                : preText
            }
            <br/>
            Please verify your email by clicking <a href="${url}">here</a>.
          </p>`,
      });
    }
  }
}
