import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/user.service';
import { SignInDto } from '../users/dto/sign-in.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AccessTokenPayload, JwtPayload, ValidateUserPayload } from './auth.types';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
    private readonly refreshTokenTtlMs = 30 * 24 * 60 * 60 * 1000;

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    async login(signInDto: SignInDto): Promise<LoginResponseDto> {
        const user = await this.usersService.validateCredentials(
            signInDto.login,
            signInDto.password,
        );

        if (!user) {
            throw new UnauthorizedException('Invalid credentials')
        }

        return this.issueTokens(user);
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
        const { userId, tokenPart } = this.parseRefreshToken(refreshToken);

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

        if (user.refreshTokenExpiresAt.getTime() < Date.now()) {
            await this.usersService.updateRefreshToken(user.id, null, null);
            throw new UnauthorizedException('Refresh token expired');
        }

        return this.issueTokens(user);
    }

    private async issueTokens(user: User): Promise<LoginResponseDto> {
        const payload = this.createAccessPayload(user);
        const accessToken = this.jwtService.sign(payload);

        const { token, rawToken, expiresAt } = this.generateRefreshToken(user);
        await this.persistRefreshToken(user.id, rawToken, expiresAt);

        return new LoginResponseDto(accessToken, token, new UserResponseDto(user));
    }

    private createAccessPayload(user: User): AccessTokenPayload {
        return {
            userId: user.id,
            login: user.login,
            email: user.email,
        };
    }

    private generateRefreshToken(user: User): { token: string; rawToken: string; expiresAt: Date } {
        const rawToken = randomBytes(32).toString('hex');
        const token = `${user.id}.${rawToken}`;
        const expiresAt = new Date(Date.now() + this.refreshTokenTtlMs);
        return { token, rawToken, expiresAt };
    }

    private async persistRefreshToken(userId: number, rawToken: string, expiresAt: Date): Promise<void> {
        const hash = await bcrypt.hash(rawToken, 10);
        await this.usersService.updateRefreshToken(userId, hash, expiresAt);
    }

    private parseRefreshToken(refreshToken: string): { userId: number; tokenPart: string } {
        const [userIdPart, tokenPart] = refreshToken.split('.');
        if (!userIdPart || !tokenPart) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const userId = Number(userIdPart);
        if (!Number.isInteger(userId)) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        return { userId, tokenPart };
    }

}
