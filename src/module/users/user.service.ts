import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersFilterDto } from './dto/get-users-filter.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedResponse } from './user.types';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private userRepository: UserRepository) {}

  async register(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      await this.checkUserUnique(createUserDto.login, createUserDto.email);

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = await this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
      });

      return new UserResponseDto(user);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findAllUsers(filterDto: GetUsersFilterDto): Promise<PaginatedResponse<UserResponseDto>> {
    try {
      const { page = 1, limit = 10, loginFilter } = filterDto;

      const { users, total } = await this.userRepository.findWithPagination(
        page,
        limit,
        loginFilter
      );

      return {
        data: users.map((user) => new UserResponseDto(user)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async getUserProfile(userId: number): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return new UserResponseDto(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user profile');
    }
  }

  async updateUserProfile(userId: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const emailExists = await this.userRepository.checkEmailExists(updateUserDto.email);
        if (emailExists) {
          throw new ConflictException('User with this email already exists');
        }
      }

      await this.userRepository.update(userId, updateUserDto);
      const updatedUser = await this.userRepository.findById(userId);

      return new UserResponseDto(updatedUser!);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update user profile');
    }
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      await this.userRepository.updateRefreshToken(userId, null, null);
      await this.userRepository.softDelete(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async checkUserExists(
    login: string,
    email: string
  ): Promise<{ loginExists: boolean; emailExists: boolean }> {
    try {
      const loginExists = await this.userRepository.checkLoginExists(login);
      const emailExists = await this.userRepository.checkEmailExists(email);

      return { loginExists, emailExists };
    } catch {
      throw new InternalServerErrorException('Failed to check user existence');
    }
  }

  private async checkUserUnique(login: string, email: string): Promise<void> {
    const { loginExists, emailExists } = await this.checkUserExists(login, email);

    if (loginExists) {
      throw new ConflictException('User with this login already exists');
    }
    if (emailExists) {
      throw new ConflictException('User with this email already exists');
    }
  }

  async validateUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async validateCredentials(login: string, password: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findByLogin(login);
      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      return isPasswordValid ? user : null;
    } catch {
      return null;
    }
  }

  async updateRefreshToken(
    userId: number,
    refreshTokenHash: string | null,
    refreshTokenExpiresAt: Date | null
  ): Promise<void> {
    await this.userRepository.updateRefreshToken(userId, refreshTokenHash, refreshTokenExpiresAt);
  }

}
