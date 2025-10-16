import { Controller, Get, Post, Body, Patch, Delete, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersFilterDto } from './dto/get-users-filter.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { LoginResponseDto } from '../../auth/dto/login-response.dto';

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
  async findAll(@Query() filterDto: GetUsersFilterDto) {
    return this.usersService.findAllUsers(filterDto);
  }

  @Get('profile/my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getMyProfile(@Request() req): Promise<UserResponseDto> {
    return this.usersService.getUserProfile(req.user.userId);
  }

  @Patch('profile/my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateMyProfile(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.usersService.updateUserProfile(req.user.userId, updateUserDto);
  }

  @Delete('profile/my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own profile' })
  @ApiResponse({ status: 200, description: 'Profile removed successfully' })
  async deleteMyProfile(@Request() req): Promise<void> {
    return this.usersService.deleteUser(req.user.userId);
  }

  @Get('check-availability')
  @Public()
  @ApiOperation({ summary: 'Check login/email availability' })
  async checkAvailability(@Query('login') login: string, @Query('email') email: string) {
    return this.usersService.checkUserExists(login, email);
  }
}
