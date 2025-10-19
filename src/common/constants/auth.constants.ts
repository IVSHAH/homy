/**
 * Константы для authentication и authorization
 */

/**
 * TTL для refresh token в миллисекундах
 * По умолчанию: 30 дней
 */
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * TTL для access token в секундах (используется в JwtModule.register)
 * По умолчанию: 15 минут
 */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

/**
 * Rounds для bcrypt hashing
 */
export const BCRYPT_ROUNDS = 10;
