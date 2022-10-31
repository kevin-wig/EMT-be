import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as moment from 'moment';

import { CreateTwoFactorDto } from '../dto/create-two-factor.dto';
import { UpdateTwoFactorDto } from '../dto/update-two-factor.dto';
import { TwoFactor } from '../entities/two-factor.entity';

@Injectable()
export class TwoFactorService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(TwoFactor)
    private twoFactorRepository?: Repository<TwoFactor>,
  ) {}

  create(createTwoFactorDto: CreateTwoFactorDto) {
    return this.twoFactorRepository.save(createTwoFactorDto);
  }

  findAll() {
    return `This action returns all twoFactor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} twoFactor`;
  }

  update(id: number, updateTwoFactorDto: UpdateTwoFactorDto) {
    return `This action updates a #${id} twoFactor`;
  }

  remove(id: number) {
    return `This action removes a #${id} twoFactor`;
  }

  async execute(data: CreateTwoFactorDto, action: string, user: any) {
    try {
      let entry: TwoFactor;
      let res: any = {};
      switch (action) {
        case 'validate':
          entry = await this.twoFactorRepository.findOne({
            where: { accessCode: data.accessCode, user: user.id },
          });
          if (entry) {
            // check if the code has expired
            const diff = moment().diff(moment(entry.createdAt), 'minutes');
            if (diff > 5)
              throw Error(
                'The provided code has expired. Please resend the OTP',
              );
            // create JWT token
            else
              res = { access_token: this.jwtService.sign(user), isValid: true };
          } else {
            throw Error('Incorrect code provided. Please try again');
          }
          break;

        default:
          break;
      }
      return res;
    } catch (error) {
      return {
        message: error.message,
        isValid: false,
      };
    }
  }
}
