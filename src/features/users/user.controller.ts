import { Controller, Get, Post, Body, Patch, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersFilterDto } from './dto/get-users-filter.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { LoginResponseDto } from '../../auth/dto/login-response.dto';
import { User } from 'src/common/decorators/user.decorator';
import { PaginatedResponse } from './user.types';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CheckAvailabilityResponseDto } from './dto/check-availability-response.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register user' })
  @ApiResponse({ status: 201, type: LoginResponseDto })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() createUserDto: CreateUserDto): Promise<LoginResponseDto> {
    return this.usersService.register(createUserDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (authorized only)' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll(
    @Query() filterDto: GetUsersFilterDto
  ): Promise<PaginatedResponse<UserResponseDto>> {
    return this.usersService.findAllUsers(filterDto);
  }

  @Get('profile/my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getMyProfile(@User('userId') userId: number): Promise<UserResponseDto> {
    return this.usersService.getUserProfile(userId);
  }

  @Patch('profile/my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateMyProfile(
    @User('userId') userId: number,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.usersService.updateUserProfile(userId, updateUserDto);
  }

  @Delete('profile/my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own profile' })
  @ApiResponse({ status: 200, description: 'Profile removed successfully' })
  async deleteMyProfile(@User('userId') userId: number): Promise<void> {
    return this.usersService.deleteUser(userId);
  }

  @Get('check-availability')
  @Public()
  @ApiOperation({ summary: 'Check login/email availability' })
  @ApiResponse({ status: 200, type: CheckAvailabilityResponseDto })
  async checkAvailability(
    @Query() dto: CheckAvailabilityDto
  ): Promise<CheckAvailabilityResponseDto> {
    return this.usersService.checkUserExists(dto.login, dto.email);
  }
}
