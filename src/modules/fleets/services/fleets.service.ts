import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, SelectQueryBuilder } from 'typeorm';

import { CreateFleetDto } from '../dto/create-fleet.dto';
import { UpdateFleetDto } from '../dto/update-fleet.dto';
import { Fleet } from '../entities/fleet.entity';
import { Vessel } from '../../vessels/entities/vessel.entity';
import { IFleetsFilterQuery } from '../fleets.types';
import {
  PaginationDto,
  PaginationParamsDto,
} from '../../../shared/dtos/pagination.dto';
import { SortOrderDto } from '../../../shared/dtos/sort-order.dto';
import { SearchUserDto } from '../../users/dto/search-user.dto';
import { Roles } from '../../../shared/constants/global.constants';
import { IPayload } from '../../auth/auth.types';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class FleetsService {
  constructor(
    @InjectRepository(Fleet)
    private fleetsRepository: Repository<Fleet>,
    @InjectRepository(Vessel)
    private vesselRepository: Repository<Vessel>,
    private readonly usersService: UsersService,
  ) {}

  async create(createFleetDto: CreateFleetDto) {
    const { vessels: vesselIds, ...fleet } = createFleetDto;
    const vessels = vesselIds.length
      ? await this.vesselRepository.find({
          where: [...vesselIds.map((vessel) => ({ id: vessel }))],
        })
      : [];
    return this.fleetsRepository.save({ ...fleet, vessels });
  }

  async findAll(user: IPayload) {
    if (user.role !== Roles.SUPER_ADMIN) {
      const authUser = await this.usersService.findOneById(user.id);
      return this.fleetsRepository.find({
        where: { company: authUser.companyId },
      });
    }

    return this.fleetsRepository.find();
  }

  async find(
    paginationOption: PaginationParamsDto,
    sortOption: SortOrderDto,
    searchOption: SearchUserDto,
  ) {
    const { page, limit } = paginationOption;
    const { sortBy, order } = sortOption;
    const { search, companyId, companyIds } = searchOption;

    const queryBuilder = this.fleetsRepository
      .createQueryBuilder('fleet')
      .select([
        'fleet.id AS id',
        'fleet.name AS name',
        'company.name AS company',
        'COUNT(vessel.id) AS vesselCount',
      ])
      .leftJoin('fleet.company', 'company')
      .leftJoin('fleet.vessels', 'vessel', 'vessel.fleet = fleet.id');

    if (search) {
      queryBuilder
        .where('fleet.name LIKE :search', {
          search: `%${search ? search : ''}%`,
        })
        .setParameter('search', `%${search}%`);
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
      .groupBy('fleet.id')
      .orderBy(sortBy ? sortBy : 'fleet.id', order ? order : 'ASC')
      .limit(limit)
      .offset((paginationOption.page - 1) * limit);

    if (companyIds) {
      queryBuilder.andWhere('company.id = :companyIds', { companyIds });
    } else if (companyId) {
      queryBuilder.andWhere('company.id = :companyId', { companyId });
    }

    return {
      listData: await queryBuilder.execute(),
      sortOrder: sortOption,
      pagination,
    };
  }

  async getTotalCount(query: IFleetsFilterQuery) {
    const { company, search } = query;

    let filter = {};
    if (search) {
      filter = { name: ILike(`%${search}%`) };
    }

    if (company) {
      filter = { ...filter, company: company };
    }

    const data = await this.fleetsRepository.find({
      where: filter,
    });

    return data.length;
  }

  findOne(id: number) {
    return this.fleetsRepository.findOne(
      { id },
      { relations: ['company', 'vessels'] },
    );
  }

  async update(id: number, updateFleetDto: UpdateFleetDto) {
    const { vessels: vesselIds } = updateFleetDto;
    const vessels = await this.vesselRepository.find({
      where: [...vesselIds.map((vessel) => ({ id: vessel }))],
    });

    const fleet = await this.fleetsRepository.findOne(id);
    fleet.name = updateFleetDto.name;
    fleet.company = updateFleetDto.company;
    fleet.vessels = vessels;
    return this.fleetsRepository.save(fleet);
  }

  async remove(id: number) {
    const fleet = await this.fleetsRepository.findOne(id);
    fleet.vessels = [];
    await this.fleetsRepository.save(fleet);
    return this.fleetsRepository.delete(id);
  }
}
