import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersFilterDto } from './dto/get-users-filter.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginResponseDto } from '../../auth/dto/login-response.dto';
import { UserFactory } from '../../test/factories/user.factory';

describe('UsersController', () => {
  let controller: UsersController;
  let reflector: Reflector;

  let usersService: {
    register: jest.Mock;
    findAllUsers: jest.Mock;
    getUserProfile: jest.Mock;
    updateUserProfile: jest.Mock;
    deleteUser: jest.Mock;
    checkUserExists: jest.Mock;
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      const reflector = new Reflector();
      const isPublic = reflector.get<boolean>('isPublic', context.getHandler());

      if (isPublic) {
        return true;
      }

      request.user = { userId: 42 };
      return true;
    }),
  };

  beforeEach(async () => {
    usersService = {
      register: jest.fn(),
      findAllUsers: jest.fn(),
      getUserProfile: jest.fn(),
      updateUserProfile: jest.fn(),
      deleteUser: jest.fn(),
      checkUserExists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }, Reflector],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('register', () => {
    it('should be public and delegate to service', async () => {
      const dto: CreateUserDto = {
        login: 'john',
        email: 'john@example.com',
        password: '123456',
        age: 25,
        description: 'about',
      };

      const response = new LoginResponseDto(
        'access_token_123',
        'refresh_token_456',
        UserFactory.createResponseDto({ login: 'john' })
      );

      usersService.register.mockResolvedValue(response);

      const isPublic = reflector.get('isPublic', controller.register);
      expect(isPublic).toBe(true);

      await expect(controller.register(dto)).resolves.toBe(response);
      expect(usersService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('checkAvailability', () => {
    it('should be public and return availability result', async () => {
      const availability = { loginExists: false, emailExists: false };
      usersService.checkUserExists.mockResolvedValue(availability);

      const isPublic = reflector.get('isPublic', controller.checkAvailability);
      expect(isPublic).toBe(true);

      const result = await controller.checkAvailability('newuser', 'new@example.com');

      expect(result).toEqual(availability);
      expect(usersService.checkUserExists).toHaveBeenCalledWith('newuser', 'new@example.com');
    });
  });

  describe('findAll', () => {
    it('should require auth and return paginated users', async () => {
      const filter: GetUsersFilterDto = { page: 1, limit: 10, loginFilter: 'john' };

      const users = [
        UserFactory.createResponseDto({ id: 1, login: 'john' }),
        UserFactory.createResponseDto({ id: 2, login: 'johnny' }),
      ];

      const paginated = {
        data: users,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      usersService.findAllUsers.mockResolvedValue(paginated);

      const isPublic = reflector.get('isPublic', controller.findAll);
      expect(isPublic).toBeUndefined();

      const result = await controller.findAll(filter);

      expect(result).toBe(paginated);
      expect(usersService.findAllUsers).toHaveBeenCalledWith(filter);
    });
  });

  describe('getMyProfile', () => {
    it('should require auth and return profile for current user', async () => {
      const profile = UserFactory.createResponseDto({
        id: 42,
        login: 'john',
        email: 'john@example.com',
      });

      usersService.getUserProfile.mockResolvedValue(profile);

      const isPublic = reflector.get('isPublic', controller.getMyProfile);
      expect(isPublic).toBeUndefined();

      const result = await controller.getMyProfile(42);

      expect(result).toBe(profile);
      expect(usersService.getUserProfile).toHaveBeenCalledWith(42);
    });
  });

  describe('updateMyProfile', () => {
    it('should require auth and update profile', async () => {
      const dto: UpdateUserDto = {
        description: 'Updated bio',
        age: 26,
      };

      const updatedProfile = UserFactory.createResponseDto({
        id: 42,
        description: 'Updated bio',
        age: 26,
      });

      usersService.updateUserProfile.mockResolvedValue(updatedProfile);

      const isPublic = reflector.get('isPublic', controller.updateMyProfile);
      expect(isPublic).toBeUndefined();

      const result = await controller.updateMyProfile(42, dto);

      expect(result).toBe(updatedProfile);
      expect(usersService.updateUserProfile).toHaveBeenCalledWith(42, dto);
    });
  });

  describe('deleteMyProfile', () => {
    it('should require auth and delete profile', async () => {
      usersService.deleteUser.mockResolvedValue(undefined);

      const isPublic = reflector.get('isPublic', controller.deleteMyProfile);
      expect(isPublic).toBeUndefined();

      await controller.deleteMyProfile(42);

      expect(usersService.deleteUser).toHaveBeenCalledWith(42);
    });
  });

  describe('security', () => {
    it('should protect all methods by default', () => {
      const publicMethods = ['register', 'checkAvailability'];
      const protectedMethods = ['findAll', 'getMyProfile', 'updateMyProfile', 'deleteMyProfile'];

      publicMethods.forEach((method) => {
        const isPublic = reflector.get('isPublic', controller[method]);
        expect(isPublic).toBe(true);
      });

      protectedMethods.forEach((method) => {
        const isPublic = reflector.get('isPublic', controller[method]);
        expect(isPublic).toBeUndefined();
      });
    });
  });
});
