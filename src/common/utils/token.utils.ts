import { UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';

/**
 * Утилиты для работы с refresh tokens
 */

export interface RefreshTokenData {
  /** Полный токен в формате "userId.randomToken" */
  token: string;
  /** Сырой токен (для хеширования) */
  rawToken: string;
  /** Дата истечения токена */
  expiresAt: Date;
}

export interface ParsedRefreshToken {
  /** ID пользователя из токена */
  userId: number;
  /** Часть токена для валидации */
  tokenPart: string;
}

/**
 * Генерирует refresh token для пользователя
 *
 * @param userId - ID пользователя
 * @param ttlMs - Time-to-live в миллисекундах
 * @returns Объект с токеном, сырым токеном и датой истечения
 *
 * @example
 * const refreshData = generateRefreshToken(1, 30 * 24 * 60 * 60 * 1000);
 * // refreshData.token = "1.a3f2b1c4d5e6..."
 * // refreshData.rawToken = "a3f2b1c4d5e6..."
 * // refreshData.expiresAt = Date(+30 days)
 */
export function generateRefreshToken(userId: number, ttlMs: number): RefreshTokenData {
  const rawToken = randomBytes(32).toString('hex');
  const token = `${userId}.${rawToken}`;
  const expiresAt = new Date(Date.now() + ttlMs);

  return { token, rawToken, expiresAt };
}

/**
 * Парсит refresh token и извлекает userId и tokenPart
 *
 * @param refreshToken - Токен в формате "userId.randomToken"
 * @returns Объект с userId и tokenPart
 * @throws UnauthorizedException - если формат токена невалиден
 *
 * @example
 * const parsed = parseRefreshToken("1.a3f2b1c4d5e6...");
 * // parsed.userId = 1
 * // parsed.tokenPart = "a3f2b1c4d5e6..."
 */
export function parseRefreshToken(refreshToken: string): ParsedRefreshToken {
  const dotIndex = refreshToken.indexOf('.');

  if (dotIndex === -1) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  const userIdPart = refreshToken.substring(0, dotIndex);
  const tokenPart = refreshToken.substring(dotIndex + 1);

  if (!userIdPart || !tokenPart) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  const userId = Number(userIdPart);
  if (!Number.isInteger(userId)) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  return { userId, tokenPart };
}

/**
 * Проверяет, истек ли токен
 *
 * @param expiresAt - Дата истечения токена
 * @returns true если токен истек, false если еще валиден
 *
 * @example
 * const expired = isTokenExpired(new Date('2024-01-01'));
 * // expired = true (если текущая дата > 2024-01-01)
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now();
}
