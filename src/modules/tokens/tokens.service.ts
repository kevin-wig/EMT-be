import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { Token } from './entities/token.entity';

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
  ) {}

  create(createTokenDto: CreateTokenDto): Promise<Token> {
    return this.tokenRepository.save(createTokenDto);
  }

  findByToken(token: string, used?: boolean): Promise<Token> {
    return this.tokenRepository.findOne({ token, used });
  }

  update(id: number, updateTokenDto: UpdateTokenDto) {
    return this.tokenRepository.update(id, updateTokenDto);
  }
}
