import { Controller, Post, Body, Get, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Context } from '../common/decorators/context.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';
import { User } from '../common/decorators/user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SignInDto } from '../features/users/dto/sign-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { RevokeSessionsDto } from './dto/revoke-sessions.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() signInDto: SignInDto,
    @Context() context: RequestContext
  ): Promise<LoginResponseDto> {
    return this.authService.login(signInDto, context);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Context() context: RequestContext
  ): Promise<LoginResponseDto> {
    return this.authService.refresh(refreshTokenDto.refreshToken, context);
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active sessions for current user' })
  @ApiResponse({ status: 200, type: [SessionResponseDto] })
  async getSessions(@User('userId') userId: number): Promise<SessionResponseDto[]> {
    return this.authService.getUserSessions(userId);
  }

  @Delete('sessions/:sessionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  @ApiResponse({ status: 403, description: 'Cannot revoke this session' })
  async revokeSession(
    @User('userId') userId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number
  ): Promise<void> {
    return this.authService.revokeSession(userId, sessionId);
  }

  @Delete('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions except current' })
  @ApiResponse({ status: 200, description: 'All sessions except current revoked successfully' })
  async revokeAllSessions(
    @User('userId') userId: number,
    @Body() dto: RevokeSessionsDto
  ): Promise<void> {
    return this.authService.revokeAllSessions(userId, dto.currentTokenId);
  }

  @Post('verify-email')
  @Public()
  @ApiOperation({ summary: 'Verify email address with OTP code' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification code' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    return this.authService.verifyEmail(dto.email, dto.code);
  }

  @Post('resend-verification')
  @Public()
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resendVerification(@Body() dto: ResendVerificationDto): Promise<{ message: string }> {
    return this.authService.resendVerification(dto.email);
  }
}
