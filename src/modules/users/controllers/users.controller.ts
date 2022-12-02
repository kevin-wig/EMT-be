import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  Query,
  Req, UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UpdateUserDto } from '../dto/update-user.dto';
import { CreateUserDto, EmailDto } from '../dto/create-user.dto';
import { HasRole } from '../decorators/user-role.decorator';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../shared/constants/global.constants';
import { IRequest } from '../../auth/auth.types';
import { PaginationParamsDto } from '../../../shared/dtos/pagination.dto';
import { SortOrderDto } from '../../../shared/dtos/sort-order.dto';
import { SearchUserDto } from '../dto/search-user.dto';
import { FailedResponseDto } from '../../../shared/dtos/failed-response.dto';
import {
  SuccessUserResponseDto,
  UserRolesDto,
  UsersListDto,
} from '../dto/user-response.dto';
import { SUCCESS } from '../../../shared/constants/message.constants';
import { User } from '../entities/user.entity';
import { SuccessResponseDto } from '../../../shared/dtos/success-response.dto';

@ApiTags('user')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('list')
  @ApiOperation({
    description: 'The route used by user to retrieve users data',
  })
  @ApiResponse({ status: 200, type: UsersListDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  async getUsersList(
    @Query() paginationParams: PaginationParamsDto,
    @Query() sortParams: SortOrderDto,
    @Query() searchParams: SearchUserDto,
    @Req() req: IRequest,
  ) {
    const user = req.user;
    const res = await this.usersService.find(
      paginationParams,
      sortParams,
      searchParams,
      user,
    );

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Get('me')
  @ApiOperation({
    description: 'The route used by user to get detail of current user',
  })
  @ApiResponse({ status: 200, type: User })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  findMe(@Req() req: IRequest) {
    const { id } = req.user;
    return this.usersService.findOneById(+id, true);
  }

  @Get('roles')
  @ApiOperation({
    description: 'The route used by user to get user roles',
  })
  @ApiResponse({ status: 200, type: UserRolesDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async getRoles() {
    const res = await this.usersService.findRoles();

    return {
      message: SUCCESS,
      data: res,
    };
  }

  @Post('request-change-password')
  @ApiOperation({
    description: 'The route used to send request to change password',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN)
  // TODO: implement change password logic
  async requestChangePassword(@Body() { email }: EmailDto, @Req() req: IRequest) {
    const user = req.user;
    await this.usersService.requestChangePassword(email);

    return {
      message: SUCCESS,
    };
  }

  @Get(':id')
  @ApiOperation({
    description: 'The route used to get specific user by ID',
  })
  @ApiResponse({ status: 200, type: SuccessUserResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  async findOne(@Param('id') id: string, @Req() req: IRequest) {
    const me = req.user;
    const res = await this.usersService.findOneById(+id);
    if (me.role !== Roles.SUPER_ADMIN) {
      const meDetail = await this.usersService.findOneById(+me.id);
      if (meDetail?.companyId !== res?.companyId) {
        throw new UnauthorizedException('You are not authorized to get this user');
      }
    }

    if (res) {
      return {
        message: SUCCESS,
        data: res,
      };
    } else {
      throw new BadRequestException('User not found');
    }
  }

  @Post()
  @ApiOperation({
    description: 'The route used to create new user',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 200, type: SuccessUserResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN, Roles.COMPANY_EDITOR)
  async create(@Body() createUser: CreateUserDto, @Req() req: IRequest) {
    const me = req.user;
    if (me.role === Roles.COMPANY_EDITOR) {
      const meDetail = await this.usersService.findOneById(me.id);
      if (createUser.companyId !== meDetail.companyId) {
        throw new UnauthorizedException('You cannot create user for other companies!')
      }
    }
    return this.usersService
      .create(createUser)
      .then((res) => ({
        message: SUCCESS,
        data: res,
      }))
      .catch((err) => {
        throw new BadRequestException(err.sqlMessage);
      });
  }

  @Put(':id')
  @ApiOperation({
    description: 'The route used to update user',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, type: SuccessUserResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateUser: UpdateUserDto,
    @Req() req: IRequest,
  ) {
    const user = req.user;
    return this.usersService
      .update(+id, updateUser, user)
      .then((res) => ({
        message: SUCCESS,
        data: res,
      }))
      .catch((err) => {
        throw new BadRequestException(err.sqlMessage);
      });
  }

  @Delete(':id')
  @ApiOperation({
    description: 'The route used to update user',
  })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 400, type: FailedResponseDto })
  @HasRole(Roles.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(+id);

    return {
      message: SUCCESS,
    };
  }
}
