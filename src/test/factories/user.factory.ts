import { User } from '../../features/users/entities/user.entity';
import { UserResponseDto } from '../../features/users/dto/user-response.dto';

/**
 * Factory для создания тестовых User объектов
 *
 * Использует паттерн Factory + Sequences для генерации валидных тестовых данных.
 * Все дефолтные значения соответствуют валидационным правилам из DTOs.
 *
 * @example
 * // Создание с дефолтными значениями
 * const user = UserFactory.create();
 *
 * @example
 * // Создание с переопределением полей
 * const admin = UserFactory.create({ login: 'admin', age: 40 });
 *
 * @example
 * // Создание специфических состояний
 * const deletedUser = UserFactory.createDeleted();
 * const userWithToken = UserFactory.createWithRefreshToken();
 */
export class UserFactory {
  private static sequence = 0;

  /**
   * Сбрасывает счетчик последовательности
   * Вызывайте в beforeEach() для изоляции тестов
   */
  static resetSequence(): void {
    this.sequence = 0;
  }

  /**
   * Создает User с валидными дефолтными значениями
   * Использует sequence для уникальности id, login, email
   */
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

  /**
   * Создает UserResponseDto из User entity
   * Полезно для тестирования контроллеров и сервисов, возвращающих DTO
   */
  static createResponseDto(overrides: Partial<User> = {}): UserResponseDto {
    const user = this.create(overrides);
    return new UserResponseDto(user);
  }

  /**
   * Создает User с определенным возрастом
   * Удобно для тестирования валидации age (0-150)
   */
  static createWithAge(age: number): User {
    return this.create({ age });
  }

  /**
   * Создает User с определенным login
   * Удобно для тестирования проверки уникальности login
   */
  static createWithLogin(login: string): User {
    return this.create({ login });
  }

  /**
   * Создает User с определенным email
   * Удобно для тестирования проверки уникальности email
   */
  static createWithEmail(email: string): User {
    return this.create({ email });
  }

  /**
   * Создает soft-deleted User
   * Используется для тестирования восстановления и фильтрации удаленных
   */
  static createDeleted(): User {
    return this.create({ deletedAt: new Date('2024-06-01') });
  }

  /**
   * Создает User с валидным refresh token (не истек)
   * Используется для тестирования refresh token flow
   */
  static createWithRefreshToken(): User {
    return this.create({
      refreshTokenHash: 'hashed_refresh_token_123',
      refreshTokenExpiresAt: new Date(Date.now() + 86400000), // +1 день
    });
  }

  /**
   * Создает User с истекшим refresh token
   * Используется для тестирования обработки истекших токенов
   */
  static createWithExpiredRefreshToken(): User {
    return this.create({
      refreshTokenHash: 'hashed_refresh_token_expired',
      refreshTokenExpiresAt: new Date(Date.now() - 1000), // -1 секунда
    });
  }

  /**
   * Создает несколько User с уникальными данными
   * Используется для тестирования пагинации и списков
   *
   * @param count - количество пользователей для создания
   * @param overridesFn - функция для кастомизации каждого пользователя (получает индекс)
   *
   * @example
   * const users = UserFactory.createMany(5);
   * const customUsers = UserFactory.createMany(3, (i) => ({ age: 20 + i }));
   */
  static createMany(count: number, overridesFn?: (index: number) => Partial<User>): User[] {
    return Array.from({ length: count }, (_, i) => {
      const overrides = overridesFn ? overridesFn(i) : {};
      return this.create(overrides);
    });
  }

  /**
   * Создает User с минимальным возрастом (0)
   * Граничное значение для тестирования валидации
   */
  static createWithMinAge(): User {
    return this.create({ age: 0 });
  }

  /**
   * Создает User с максимальным возрастом (150)
   * Граничное значение для тестирования валидации
   */
  static createWithMaxAge(): User {
    return this.create({ age: 150 });
  }
}
