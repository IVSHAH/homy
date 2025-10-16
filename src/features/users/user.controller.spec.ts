import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersFilterDto } from './dto/get-users-filter.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { LoginResponseDto } from '../../auth/dto/login-response.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    register: jest.Mock;
    findAllUsers: jest.Mock;
    getUserProfile: jest.Mock;
    updateUserProfile: jest.Mock;
    deleteUser: jest.Mock;
    checkUserExists: jest.Mock;
  };

  const mockGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
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
      providers: [{ provide: UsersService, useValue: usersService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('register', () => {
    it('should delegate to service and return tokens', async () => {
      const dto: CreateUserDto = {
        login: 'john',
        email: 'john@example.com',
        password: '123456',
        age: 25,
        description: 'about',
      };

      const response = new LoginResponseDto('access', 'refresh', {} as UserResponseDto);
      usersService.register.mockResolvedValue(response);

      await expect(controller.register(dto)).resolves.toBe(response);
      expect(usersService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const filter: GetUsersFilterDto = { page: 1, limit: 10, loginFilter: 'john' };
      const paginated = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };

      usersService.findAllUsers.mockResolvedValue(paginated);

      await expect(controller.findAll(filter)).resolves.toBe(paginated);
      expect(usersService.findAllUsers).toHaveBeenCalledWith(filter);
    });
  });

  describe('getMyProfile', () => {
    it('should return profile for current user', async () => {
      const profile = new UserResponseDto({
        id: 42,
        login: 'john',
        email: 'john@example.com',
        password: 'hashed',
        age: 25,
        description: 'about',
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null as unknown as Date,
      });

      usersService.getUserProfile.mockResolvedValue(profile);

      const result = await controller.getMyProfile({ user: { userId: 42 } });
      expect(result).toBe(profile);
      expect(usersService.getUserProfile).toHaveBeenCalledWith(42);
    });
  });

  describe('updateMyProfile', () => {
    it('should update profile for current user', async () => {
      const dto: UpdateUserDto = { description: 'new' };
      const updatedProfile = {} as UserResponseDto;
      usersService.updateUserProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateMyProfile({ user: { userId: 42 } }, dto);

      expect(result).toBe(updatedProfile);
      expect(usersService.updateUserProfile).toHaveBeenCalledWith(42, dto);
    });
  });

  describe('deleteMyProfile', () => {
    it('should delete current user profile', async () => {
      usersService.deleteUser.mockResolvedValue(undefined);

      await controller.deleteMyProfile({ user: { userId: 42 } });

      expect(usersService.deleteUser).toHaveBeenCalledWith(42);
    });
  });

  describe('checkAvailability', () => {
    it('should pass query params to service', async () => {
      usersService.checkUserExists.mockResolvedValue({ loginExists: false, emailExists: false });

      const result = await controller.checkAvailability('john', 'john@example.com');

      expect(result).toEqual({ loginExists: false, emailExists: false });
      expect(usersService.checkUserExists).toHaveBeenCalledWith('john', 'john@example.com');
    });
  });
});
