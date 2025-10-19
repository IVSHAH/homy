import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../features/users/user.service';
import { SignInDto } from '../features/users/dto/sign-in.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserResponseDto } from '../features/users/dto/user-response.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { JwtPayload, ValidateUserPayload } from './auth.types';
import { User } from '../features/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { generateRefreshToken, parseRefreshToken } from '../common/utils/token.utils';
import { createAccessTokenPayload } from '../common/utils/payload.utils';
import { REFRESH_TOKEN_TTL_MS, BCRYPT_ROUNDS } from '../common/constants';
import { RequestContext } from '../common/interfaces/request-context.interface';
import { RefreshTokenRepository } from './refresh-token.repository';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private refreshTokenRepository: RefreshTokenRepository
  ) {}

  async login(signInDto: SignInDto, context: RequestContext): Promise<LoginResponseDto> {
    const user = await this.usersService.validateCredentials(signInDto.login, signInDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user, context);
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

  async refresh(refreshToken: string, context: RequestContext): Promise<LoginResponseDto> {
    const { userId } = parseRefreshToken(refreshToken);

    let user: User;
    try {
      user = await this.usersService.validateUserById(userId);
    } catch (_error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateTokens(user, context);
  }

  async generateTokensForUser(user: User, context?: RequestContext): Promise<LoginResponseDto> {
    return this.generateTokens(user, context || {});
  }

  private async generateTokens(user: User, context: RequestContext): Promise<LoginResponseDto> {
    const payload = createAccessTokenPayload(user);
    const accessToken = this.jwtService.sign(payload);

    const { token, rawToken, expiresAt } = generateRefreshToken(user.id, REFRESH_TOKEN_TTL_MS);
    await this.persistRefreshToken(user.id, rawToken, expiresAt, context);

    return new LoginResponseDto(accessToken, token, new UserResponseDto(user));
  }

  private async persistRefreshToken(
    userId: number,
    rawToken: string,
    expiresAt: Date,
    context: RequestContext
  ): Promise<void> {
    const hash = await bcrypt.hash(rawToken, BCRYPT_ROUNDS);
    await this.usersService.updateRefreshToken(userId, hash, expiresAt, context);
  }

  async getUserSessions(userId: number): Promise<SessionResponseDto[]> {
    const tokens = await this.refreshTokenRepository.findAllByUserId(userId);
    return tokens.map((token) => new SessionResponseDto(token));
  }

  async revokeSession(userId: number, sessionId: number): Promise<void> {
    const token = await this.refreshTokenRepository.findById(sessionId);
    if (!token || token.userId !== userId) {
      throw new ForbiddenException('Cannot revoke this session');
    }
    await this.refreshTokenRepository.revokeToken(sessionId);
  }

  async revokeAllSessions(userId: number, currentTokenId: number): Promise<void> {
    await this.refreshTokenRepository.revokeAllExceptCurrent(userId, currentTokenId);
  }
}
