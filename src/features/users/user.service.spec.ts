import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UsersService } from './user.service';
import { UserRepository } from './user.repository';
import { AuthService } from '../../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginResponseDto } from '../../auth/dto/login-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { GetUsersFilterDto } from './dto/get-users-filter.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFactory } from '../../test/factories';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findByLogin: jest.Mock;
    findByEmail: jest.Mock;
    findWithPagination: jest.Mock;
    update: jest.Mock;
    updateRefreshToken: jest.Mock;
    softDelete: jest.Mock;
    restore: jest.Mock;
    checkLoginExists: jest.Mock;
    checkEmailExists: jest.Mock;
  };
  let authService: { generateTokensForUser: jest.Mock };

  // Используем UserFactory вместо локального mockUser

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByLogin: jest.fn(),
      findByEmail: jest.fn(),
      findWithPagination: jest.fn(),
      update: jest.fn(),
      updateRefreshToken: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      checkLoginExists: jest.fn(),
      checkEmailExists: jest.fn(),
    };

    authService = {
      generateTokensForUser: jest.fn(),
    };

    service = new UsersService(
      userRepository as unknown as UserRepository,
      authService as unknown as AuthService
    );

    (bcrypt.hash as jest.Mock).mockReset();
    (bcrypt.compare as jest.Mock).mockReset();
  });

  describe('register', () => {
    it('should create user, hash password and return tokens', async () => {
      const dto: CreateUserDto = {
        login: 'john',
        email: 'john@example.com',
        password: 'plain',
        age: 30,
        description: 'about',
      };
      const createdUser = UserFactory.create({ login: 'john', email: 'john@example.com', age: 30 });
      const response = new LoginResponseDto('access', 'refresh', new UserResponseDto(createdUser));

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      userRepository.checkLoginExists.mockResolvedValue(false);
      userRepository.checkEmailExists.mockResolvedValue(false);
      userRepository.create.mockResolvedValue(createdUser);
      authService.generateTokensForUser.mockResolvedValue(response);

      const result = await service.register(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...dto,
        password: 'hashedPassword',
      });
      expect(authService.generateTokensForUser).toHaveBeenCalledWith(createdUser);
      expect(result).toBe(response);
    });

    it('should throw ConflictException when login already exists', async () => {
      userRepository.checkLoginExists.mockResolvedValue(true);
      userRepository.checkEmailExists.mockResolvedValue(false);

      await expect(
        service.register({
          login: 'john',
          email: 'john@example.com',
          password: 'plain',
          age: 25,
          description: 'about',
        })
      ).rejects.toBeInstanceOf(ConflictException);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should wrap unexpected errors into InternalServerErrorException', async () => {
      userRepository.checkLoginExists.mockResolvedValue(false);
      userRepository.checkEmailExists.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('hash error'));

      await expect(
        service.register({
          login: 'john',
          email: 'john@example.com',
          password: 'plain',
          age: 20,
          description: 'desc',
        })
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('findAllUsers', () => {
    it('should return paginated users', async () => {
      const user = UserFactory.create();
      const filter: GetUsersFilterDto = { page: 2, limit: 5, loginFilter: 'jo' };

      userRepository.findWithPagination.mockResolvedValue({ users: [user], total: 6 });

      const result = await service.findAllUsers(filter);

      expect(userRepository.findWithPagination).toHaveBeenCalledWith(2, 5, 'jo');
      expect(result).toEqual({
        data: [new UserResponseDto(user)],
        total: 6,
        page: 2,
        limit: 5,
        totalPages: Math.ceil(6 / 5),
      });
    });

    it('should throw InternalServerErrorException when repository fails', async () => {
      userRepository.findWithPagination.mockRejectedValue(new Error('db'));

      await expect(service.findAllUsers({})).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile when found', async () => {
      const user = UserFactory.create();
      userRepository.findById.mockResolvedValue(user);

      const result = await service.getUserProfile(1);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(new UserResponseDto(user));
    });

    it('should throw NotFoundException when user missing', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.getUserProfile(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateUserProfile', () => {
    it('should update profile and hash password when provided', async () => {
      const existingUser = UserFactory.create();
      const updatedUser = UserFactory.create({ password: 'new-hash', email: 'new@example.com' });
      const dto: UpdateUserDto = {
        email: 'new@example.com',
        password: 'newPassword',
      };

      userRepository.findById
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);
      userRepository.checkLoginExists.mockResolvedValue(false);
      userRepository.checkEmailExists.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHash');

      const result = await service.updateUserProfile(existingUser.id, dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
      expect(userRepository.update).toHaveBeenCalledWith(existingUser.id, {
        email: 'new@example.com',
        password: 'newHash',
      });
      expect(result).toEqual(new UserResponseDto(updatedUser));
    });

    it('should throw ConflictException if new login already exists', async () => {
      const existingUser = UserFactory.create();
      userRepository.findById.mockResolvedValue(existingUser);
      userRepository.checkLoginExists.mockResolvedValue(true);

      await expect(
        service.updateUserProfile(existingUser.id, { login: 'taken' })
      ).rejects.toBeInstanceOf(ConflictException);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user missing', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateUserProfile(1, { email: 'test@example.com' })
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('should nullify refresh token and soft delete user', async () => {
      const user = UserFactory.create();
      userRepository.findById.mockResolvedValue(user);

      await service.deleteUser(user.id);

      expect(userRepository.updateRefreshToken).toHaveBeenCalledWith(user.id, null, null);
      expect(userRepository.softDelete).toHaveBeenCalledWith(user.id);
    });

    it('should throw NotFoundException when user missing', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.deleteUser(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('validateCredentials', () => {
    it('should return user when password matches', async () => {
      const user = UserFactory.create({ login: 'john' });
      userRepository.findByLogin.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateCredentials('john', 'plain');

      expect(userRepository.findByLogin).toHaveBeenCalledWith('john');
      expect(result).toBe(user);
    });

    it('should return null when password mismatch', async () => {
      const user = UserFactory.create();
      userRepository.findByLogin.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateCredentials('john', 'plain');

      expect(result).toBeNull();
    });

    it('should return null when user not found', async () => {
      userRepository.findByLogin.mockResolvedValue(null);

      const result = await service.validateCredentials('john', 'plain');

      expect(result).toBeNull();
    });
  });

  describe('updateRefreshToken', () => {
    it('should delegate to repository', async () => {
      await service.updateRefreshToken(1, 'hash', new Date());

      expect(userRepository.updateRefreshToken).toHaveBeenCalledTimes(1);
    });
  });
});
