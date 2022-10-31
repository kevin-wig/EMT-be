import { compare, genSalt, hash } from 'bcrypt';
import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { TwoFactor } from 'src/modules/two-factor/entities/two-factor.entity';
import { TwoFactorService } from 'src/modules/two-factor/services/two-factor.service';
import { MessagingService } from 'src/modules/users/services/messaging.service';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { IValidatedUser, IVerifiedUser } from '../auth.types';
import { TokensService } from '../../tokens/tokens.service';
import { Token } from '../../tokens/entities/token.entity';
import {
  AuthMethod,
  RESET_PASSWORD_URL,
  TokenType,
} from '../../../shared/constants/global.constants';
import { UserPayload } from '../../users/users.types';
import {
  INVALID_TOKEN,
  USER_NOT_EXIST,
} from '../../../shared/constants/message.constants';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private twoFactorService: TwoFactorService,
    private tokensService: TokensService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<IValidatedUser | null> {
    const user = await this.usersService.findOneByEmail(email);

    if (user) {
      if (!user.isActive) {
        await this.usersService.sendEmailVerification(user);
        return user;
      } else if (user.password && (await compare(pass, user.password))) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: IVerifiedUser) {
    const res = {};
    await this.sendOTP(user)
      .then(({ OTP, response }) => {
        const payload = {
          email: user.email,
          sub: user.id,
          role: user.userRole.role,
        };
        Object.assign(res, {
          message: `Kindly check your mailbox or phone for an OTP`,
          access_token: this.jwtService.sign(payload),
          otp_sent: OTP !== null,
        });
      })
      .catch((error) => {
        return error;
      });

    return res;
  }

  async register(user: User) {
    const salt = await genSalt(parseInt(process.env.SALT_ROUNDS));
    user.password = await hash(user.password, salt);
    const res = await this.usersService.create(user);

    const payload = { email: res.email, sub: res.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new BadRequestException("The user doesn't exist");
    }

    const payload = {
      email: user.email,
      id: user.id,
      role: user.userRole,
    };

    const savedToken: Token = await this.tokensService.create({
      token: this.jwtService.sign(payload),
      type: TokenType.RESET_PASSWORD,
    });

    const url = `${RESET_PASSWORD_URL}/${savedToken.token}`;

    const mailService = new MessagingService();

    if (user.authenticationMethod === AuthMethod.MOBILE) {
      // TODO: need to implemented to send SMS for reset password
      await mailService.sendSMS({
        to: user['phoneNumber'],
        body: `Hello,\n\nPlease reset your password by clicking here.`,
      });
    } else {
      await mailService.sendMail({
        to: user.email,
        subject: 'Forgot Password',
        body: `
          <p>
            Hello, ${user.lastname}
            <br/>
            Please change your password by clicking <a href="${url}">here</a>.
          </p>`,
      });
    }
  }

  async changePassword(password: string, token: string) {
    try {
      const existingToken: Token = await this.tokensService.findByToken(
        token,
        false,
      );

      if (!existingToken) {
        throw new BadRequestException(INVALID_TOKEN);
      } else {
        const { email, id }: UserPayload = this.jwtService.decode(
          token,
        ) as UserPayload;
        const user = await this.usersService.findOne({ email, id });

        if (user) {
          const salt = await genSalt(parseInt(process.env.SALT_ROUNDS));
          user.password = await hash(password, salt);
          await this.usersService.changePassword(id, user.password);
          await this.tokensService.update(existingToken.id, { used: false });
          return user;
        } else {
          throw new BadRequestException(USER_NOT_EXIST);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async validateEmailVerifyToken(token: string): Promise<User | undefined> {
    try {
      const existingToken: Token = await this.tokensService.findByToken(
        token,
        false,
      );

      if (existingToken) {
        const { email, id }: UserPayload = this.jwtService.decode(
          token,
        ) as UserPayload;

        return await this.usersService.findOne({ email, id });
      }
    } catch (error) {
      throw error;
    }
  }

  async createPassword(
    token: string,
    password: string,
  ): Promise<User | undefined> {
    try {
      const existingToken: Token = await this.tokensService.findByToken(
        token,
        false,
      );

      if (existingToken) {
        const { email, id, role }: UserPayload = this.jwtService.decode(
          token,
        ) as UserPayload;

        const user = await this.usersService.findOne({ email, id });

        if (user) {
          const userPayload = { id, email, role, sub: '' };
          const salt = await genSalt(parseInt(process.env.SALT_ROUNDS));
          user.isActive = true;
          user.password = await hash(password, salt);
          await this.usersService.update(
            id,
            { isActive: true, password: user.password },
            userPayload,
          );
          await this.tokensService.update(existingToken.id, { used: true });
        }

        return user;
      }
    } catch (error) {
      throw error;
    }
  }

  async resendEmailVerify(email): Promise<User | undefined> {
    try {
      const user = await this.usersService.findOneByEmail(email);

      if (user) {
        await this.usersService.sendEmailVerification(user, '');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async sendOTP(user: IVerifiedUser) {
    return new Promise((resolve, reject) => {
      try {
        const mailService = new MessagingService();
        const OTP = mailService.genOTP(5);
        // persist the OTP
        this.twoFactorService
          .create({
            accessCode: OTP,
            accessType: 'OTP_VER',
            user: user.id,
          })
          .then(async (res: TwoFactor) => {
            let response: any;
            if (user['phoneNumber']) {
              // send OTP via phone
              response = await mailService.sendSMS({
                to: user['phoneNumber'],
                body: `Hello,\n\nYour Two-Factor Authentication code is:${OTP}\nThis code will expire in 5 minutes.`,
              });
            } else {
              /* send OTP via email */
              response = await mailService.sendMail({
                to: user.email,
                subject: '2FA AUTHENTICATION',
                body: `<p>Hello,<br/><br/>Your Two-Factor Authentication code is<br/><br/><h3>${OTP}</h3>This code will expire in 5 minutes.</p>`,
              });
            }
            resolve({ OTP, response });
          })
          .catch((error) => {
            console.log('SEND OTP ERROR =>', error.message);
            reject(error);
          });
      } catch (error) {
        reject(error);
      }
    });
  }
}
