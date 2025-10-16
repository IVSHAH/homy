import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/user.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: { validateUserById: jest.Mock };

  beforeEach(() => {
    usersService = {
      validateUserById: jest.fn(),
    };

    const configService = {
      getOrThrow: jest.fn().mockReturnValue('secret'),
    } as unknown as ConfigService;

    strategy = new JwtStrategy(usersService as unknown as UsersService, configService);
  });

  it('should validate payload and return user data', async () => {
    usersService.validateUserById.mockResolvedValue({
      id: 1,
      login: 'john',
      email: 'john@example.com',
    });

    const result = await strategy.validate({ userId: 1, login: 'john', email: 'john@example.com' });

    expect(usersService.validateUserById).toHaveBeenCalledWith(1);
    expect(result).toEqual({ userId: 1, login: 'john', email: 'john@example.com' });
  });

  it('should throw UnauthorizedException when user not found', async () => {
    usersService.validateUserById.mockResolvedValue(null);

    await expect(
      strategy.validate({ userId: 1, login: 'john', email: 'john@example.com' })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
