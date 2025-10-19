import { User } from '../../features/users/entities/user.entity';
import { AccessTokenPayload } from '../../auth/auth.types';

/**
 * Утилиты для создания JWT payloads
 */

/**
 * Создает payload для access token из User entity
 *
 * @param user - User entity
 * @returns AccessTokenPayload для подписи JWT
 *
 * @example
 * const user = await userRepository.findById(1);
 * const payload = createAccessTokenPayload(user);
 * const accessToken = jwtService.sign(payload);
 */
export function createAccessTokenPayload(user: User): AccessTokenPayload {
  return {
    userId: user.id,
    login: user.login,
    email: user.email,
  };
}

/**
 * Создает минимальный payload для access token
 * Используется когда нужен токен без полных данных пользователя
 *
 * @param userId - ID пользователя
 * @param login - Логин пользователя
 * @param email - Email пользователя
 * @returns AccessTokenPayload для подписи JWT
 *
 * @example
 * const payload = createMinimalAccessTokenPayload(1, 'john', 'john@example.com');
 */
export function createMinimalAccessTokenPayload(
  userId: number,
  login: string,
  email: string
): AccessTokenPayload {
  return { userId, login, email };
}
