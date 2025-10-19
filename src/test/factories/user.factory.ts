import { User } from '../../features/users/entities/user.entity';
import { UserResponseDto } from '../../features/users/dto/user-response.dto';

export class UserFactory {
  private static sequence = 0;

  static resetSequence(): void {
    this.sequence = 0;
  }

  static create(overrides: Partial<User> = {}): User {
    this.sequence++;
    const user = new User();

    return Object.assign(user, {
      id: this.sequence,
      login: `testuser${this.sequence}`,
      email: `test${this.sequence}@example.com`,
      password: 'hashed_password_123',
      age: 25,
      description: 'Test user description',
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      deletedAt: null,
      ...overrides,
    });
  }

  static createResponseDto(overrides: Partial<User> = {}): UserResponseDto {
    const user = this.create(overrides);
    return new UserResponseDto(user);
  }

  static createWithAge(age: number): User {
    return this.create({ age });
  }

  static createWithLogin(login: string): User {
    return this.create({ login });
  }

  static createWithEmail(email: string): User {
    return this.create({ email });
  }

  static createDeleted(): User {
    return this.create({ deletedAt: new Date('2024-06-01') });
  }

  static createWithRefreshToken(): User {
    return this.create({
      refreshTokenHash: 'hashed_refresh_token_123',
      refreshTokenExpiresAt: new Date(Date.now() + 86400000),
    });
  }

  static createWithExpiredRefreshToken(): User {
    return this.create({
      refreshTokenHash: 'hashed_refresh_token_expired',
      refreshTokenExpiresAt: new Date(Date.now() - 1000),
    });
  }

  static createMany(count: number, overridesFn?: (index: number) => Partial<User>): User[] {
    return Array.from({ length: count }, (_, i) => {
      const overrides = overridesFn ? overridesFn(i) : {};
      return this.create(overrides);
    });
  }

  static createWithMinAge(): User {
    return this.create({ age: 0 });
  }

  static createWithMaxAge(): User {
    return this.create({ age: 150 });
  }
}
