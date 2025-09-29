import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/user.service';
import { SignInDto } from '../users/dto/sign-in.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AccessTokenPayload, JwtPayload, ValidateUserPayload } from './auth.types';

@Injectable()
export class AuthService {
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

        const payload: AccessTokenPayload = {
            userId: user.id,
            login: user.login,
            email: user.email,
        };

        const accessToken = this.jwtService.sign(payload, { expiresIn: '14d' });

        return new LoginResponseDto(accessToken, new UserResponseDto(user));
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

}
