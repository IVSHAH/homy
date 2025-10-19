import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../features/users/user.service';
import { SignInDto } from '../features/users/dto/sign-in.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserResponseDto } from '../features/users/dto/user-response.dto';
import { JwtPayload, ValidateUserPayload } from './auth.types';
import { User } from '../features/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import {
  generateRefreshToken,
  parseRefreshToken,
  isTokenExpired,
} from '../common/utils/token.utils';
import { createAccessTokenPayload } from '../common/utils/payload.utils';
import { REFRESH_TOKEN_TTL_MS, BCRYPT_ROUNDS } from '../common/constants';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async login(signInDto: SignInDto): Promise<LoginResponseDto> {
    const user = await this.usersService.validateCredentials(signInDto.login, signInDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async validateUser(payload: JwtPayload): Promise<ValidateUserPayload | null> {
    try {
      const user = await this.usersService.validateUserById(payload.userId);

      if (!user) {
        return null;
      }

      return {
        userId: user.id,
        login: user.login,
        email: user.email,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      throw error;
    }
  }

  async refresh(refreshToken: string): Promise<LoginResponseDto> {
    const { userId, tokenPart } = parseRefreshToken(refreshToken);

    let user: User;
    try {
      user = await this.usersService.validateUserById(userId);
    } catch (_error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!user.refreshTokenHash || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await bcrypt.compare(tokenPart, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (isTokenExpired(user.refreshTokenExpiresAt)) {
      await this.usersService.updateRefreshToken(user.id, null, null);
      throw new UnauthorizedException('Refresh token expired');
    }

    return this.generateTokens(user);
  }

  async generateTokensForUser(user: User): Promise<LoginResponseDto> {
    return this.generateTokens(user);
  }

  private async generateTokens(user: User): Promise<LoginResponseDto> {
    const payload = createAccessTokenPayload(user);
    const accessToken = this.jwtService.sign(payload);

    const { token, rawToken, expiresAt } = generateRefreshToken(user.id, REFRESH_TOKEN_TTL_MS);
    await this.persistRefreshToken(user.id, rawToken, expiresAt);

    return new LoginResponseDto(accessToken, token, new UserResponseDto(user));
  }

  private async persistRefreshToken(
    userId: number,
    rawToken: string,
    expiresAt: Date
  ): Promise<void> {
    const hash = await bcrypt.hash(rawToken, BCRYPT_ROUNDS);
    await this.usersService.updateRefreshToken(userId, hash, expiresAt);
  }
}
