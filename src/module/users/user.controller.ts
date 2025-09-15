import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersFilterDto } from './dto/get-users-filter.dto';
import { SignInDto } from './dto/sign-in.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthResponse } from './user.types';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Пользователь уже существует' })
  async register(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.register(createUserDto);
  }

  @Post('signin')
  @ApiOperation({ summary: 'Вход в систему' })
  @ApiResponse({ status: 200, description: 'Успешный вход' })
  @ApiResponse({ status: 401, description: 'Неверные учетные данные' })
  async signIn(@Body() signInDto: SignInDto): Promise<AuthResponse> {
    return this.usersService.signIn(signInDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить всех пользователей (только для авторизованных)' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll(@Query() filterDto: GetUsersFilterDto) {
    return this.usersService.findAllUsers(filterDto);
  }

  @Get('profile/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить свой профиль' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getMyProfile(@Request() req): Promise<UserResponseDto> {
    return this.usersService.getUserProfile(req.user.userId);
  }

  @Patch('profile/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить свой профиль' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateMyProfile(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.usersService.updateUserProfile(req.user.userId, updateUserDto);
  }

  @Delete('profile/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить свой профиль' })
  @ApiResponse({ status: 200, description: 'Профиль успешно удален' })
  async deleteMyProfile(@Request() req): Promise<void> {
    return this.usersService.deleteUser(req.user.userId);
  }

  @Get('check-availability')
  @ApiOperation({ summary: 'Проверить доступность логина и email' })
  async checkAvailability(@Query('login') login: string, @Query('email') email: string) {
    return this.usersService.checkUserExists(login, email);
  }
}
