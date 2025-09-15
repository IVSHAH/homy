import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SignInDto } from './dto/sign-in.dto';
import { GetUsersFilterDto } from './dto/get-users-filter.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedResponse, AuthResponse, JwtPayload } from './user.types';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService
  ) {}

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

  async signIn(signInDto: SignInDto): Promise<AuthResponse> {
    try {
      const user = await this.userRepository.findByLogin(signInDto.login);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(signInDto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const accessToken = this.jwtService.sign(this.createJwtPayload(user));
      return { accessToken, user: new UserResponseDto(user) };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to sign in');
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

  private createJwtPayload(user: User): JwtPayload {
    return {
      userId: user.id,
      login: user.login,
      email: user.email,
    };
  }

  async validateUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
