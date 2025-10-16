import { User } from '../../features/users/entities/user.entity';
import { UserResponseDto } from '../../features/users/dto/user-response.dto';

export class UserFactory {
  static create(overrides: Partial<User> = {}): User {
    const user = new User();

    return Object.assign(user, {
      id: 1,
      login: 'testuser',
      email: 'test@example.com',
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

  static createDeleted(): User {
    return this.create({ deletedAt: new Date() });
  }
}
