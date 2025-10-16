import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { AuthService } from './auth.service';
import { UsersService } from '../users/user.service';
import { User } from '../users/entities/user.entity';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    validateCredentials: jest.Mock;
    validateUserById: jest.Mock;
    updateRefreshToken: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };
  let randomBytesSpy: jest.SpyInstance;

  const createUser = (overrides: Partial<User> = {}): User => ({
    id: 1,
    login: 'john',
    email: 'john@example.com',
    password: 'hashed-password',
    age: 30,
    description: 'about me',
    refreshTokenHash: null,
    refreshTokenExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as unknown as Date,
    ...overrides,
  });

  beforeEach(() => {
    usersService = {
      validateCredentials: jest.fn(),
      validateUserById: jest.fn(),
      updateRefreshToken: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
    };

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService
    );

    randomBytesSpy = jest.spyOn(crypto, 'randomBytes').mockImplementation(((
      size: number
    ): Buffer => {
      void size;
      return Buffer.from('new_refresh_token');
    }) as unknown as typeof crypto.randomBytes);
  });

  afterEach(() => {
    jest.clearAllMocks();
    randomBytesSpy.mockRestore();
  });

  const mockHash = bcrypt.hash as jest.Mock;
  const mockCompare = bcrypt.compare as jest.Mock;

  describe('login', () => {
    it('should authenticate user and return tokens', async () => {
      const user = createUser();
      const expected = new LoginResponseDto('access', 'refresh', new UserResponseDto(user));

      usersService.validateCredentials.mockResolvedValue(user);
      const generateSpy = jest
        .spyOn<any, any>(service, 'generateTokens')
        .mockResolvedValue(expected);

      const result = await service.login({ login: 'john', password: 'secret' });

      expect(usersService.validateCredentials).toHaveBeenCalledWith('john', 'secret');
      expect(generateSpy).toHaveBeenCalledWith(user);
      expect(result).toBe(expected);
    });

    it('should throw UnauthorizedException when credentials invalid', async () => {
      usersService.validateCredentials.mockResolvedValue(null);

      await expect(service.login({ login: 'john', password: 'wrong' })).rejects.toBeInstanceOf(
        UnauthorizedException
      );
    });
  });

  describe('validateUser', () => {
    it('should return payload when user found', async () => {
      const user = createUser();
      usersService.validateUserById.mockResolvedValue(user);

      const result = await service.validateUser({
        userId: 1,
        login: 'john',
        email: 'john@example.com',
      });

      expect(usersService.validateUserById).toHaveBeenCalledWith(1);
      expect(result).toEqual({ userId: 1, login: 'john', email: 'john@example.com' });
    });

    it('should return null when user not found', async () => {
      usersService.validateUserById.mockRejectedValue(new NotFoundException());

      const result = await service.validateUser({
        userId: 1,
        login: 'john',
        email: 'john@example.com',
      });

      expect(result).toBeNull();
    });

    it('should rethrow unexpected errors', async () => {
      usersService.validateUserById.mockRejectedValue(new Error('db error'));

      await expect(
        service.validateUser({ userId: 1, login: 'john', email: 'john@example.com' })
      ).rejects.toThrow('db error');
    });
  });

  describe('refresh', () => {
    const futureDate = (): Date => new Date(Date.now() + 1000 * 60 * 60);

    it('should generate new tokens when refresh token valid', async () => {
      const user = createUser({
        refreshTokenHash: 'stored-hash',
        refreshTokenExpiresAt: futureDate(),
      });
      usersService.validateUserById.mockResolvedValue(user);
      mockCompare.mockResolvedValue(true);
      mockHash.mockResolvedValue('new-hash');
      jwtService.sign.mockReturnValue('signed-access');
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.refresh('1.validtoken');

      expect(usersService.validateUserById).toHaveBeenCalledWith(1);
      expect(mockCompare).toHaveBeenCalledWith('validtoken', 'stored-hash');
      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: 1,
        login: 'john',
        email: 'john@example.com',
      });
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(1, 'new-hash', expect.any(Date));
      expect(result).toBeInstanceOf(LoginResponseDto);
      expect(result.accessToken).toBe('signed-access');
      expect(result.refreshToken).toMatch(/^1\./);
    });

    it('should throw UnauthorizedException when format invalid', async () => {
      await expect(service.refresh('invalid')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user missing refresh data', async () => {
      const user = createUser();
      usersService.validateUserById.mockResolvedValue(user);

      await expect(service.refresh('1.token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw UnauthorizedException when refresh token mismatched', async () => {
      const user = createUser({
        refreshTokenHash: 'stored-hash',
        refreshTokenExpiresAt: futureDate(),
      });
      usersService.validateUserById.mockResolvedValue(user);
      mockCompare.mockResolvedValue(false);

      await expect(service.refresh('1.token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should invalidate expired refresh token and throw UnauthorizedException', async () => {
      const user = createUser({
        refreshTokenHash: 'stored-hash',
        refreshTokenExpiresAt: new Date(Date.now() - 1000),
      });
      usersService.validateUserById.mockResolvedValue(user);
      mockCompare.mockResolvedValue(true);

      await expect(service.refresh('1.token')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(1, null, null);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.validateUserById.mockRejectedValue(new NotFoundException());

      await expect(service.refresh('1.token')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('generateTokensForUser', () => {
    it('should delegate to generateTokens', async () => {
      const user = createUser();
      const expected = new LoginResponseDto('access', 'refresh', new UserResponseDto(user));
      const spy = jest.spyOn<any, any>(service, 'generateTokens').mockResolvedValue(expected);

      const result = await service.generateTokensForUser(user);

      expect(spy).toHaveBeenCalledWith(user);
      expect(result).toBe(expected);
    });
  });
});
