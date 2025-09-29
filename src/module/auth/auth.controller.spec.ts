import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignInDto } from '../users/dto/sign-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: jest.Mock;
    refresh: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      refresh: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('should delegate to authService.login', async () => {
      const dto: SignInDto = { login: 'john', password: 'secret' };
      const response = new LoginResponseDto('access', 'refresh', {} as UserResponseDto);
      authService.login.mockResolvedValue(response);

      await expect(controller.login(dto)).resolves.toBe(response);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('refresh', () => {
    it('should delegate to authService.refresh', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'token' };
      const response = new LoginResponseDto('access2', 'refresh2', {} as UserResponseDto);
      authService.refresh.mockResolvedValue(response);

      await expect(controller.refresh(dto)).resolves.toBe(response);
      expect(authService.refresh).toHaveBeenCalledWith('token');
    });
  });
});
