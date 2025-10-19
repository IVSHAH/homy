import { UnauthorizedException } from '@nestjs/common';
import { generateRefreshToken, parseRefreshToken, isTokenExpired } from './token.utils';

describe('Token Utils', () => {
  describe('generateRefreshToken', () => {
    it('should generate refresh token with correct format', () => {
      const userId = 123;
      const ttlMs = 30 * 24 * 60 * 60 * 1000;

      const result = generateRefreshToken(userId, ttlMs);

      expect(result.token).toMatch(/^123\.[a-f0-9]{64}$/);
      expect(result.rawToken).toMatch(/^[a-f0-9]{64}$/);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should generate unique tokens for same user', () => {
      const userId = 1;
      const ttlMs = 1000;

      const token1 = generateRefreshToken(userId, ttlMs);
      const token2 = generateRefreshToken(userId, ttlMs);

      expect(token1.token).not.toBe(token2.token);
      expect(token1.rawToken).not.toBe(token2.rawToken);
    });

    it('should set correct expiration date', () => {
      const userId = 1;
      const ttlMs = 5000;
      const beforeGeneration = Date.now();

      const result = generateRefreshToken(userId, ttlMs);

      const afterGeneration = Date.now();
      const expectedMin = beforeGeneration + ttlMs;
      const expectedMax = afterGeneration + ttlMs;

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe('parseRefreshToken', () => {
    it('should parse valid refresh token', () => {
      const refreshToken = '123.abc123def456';

      const result = parseRefreshToken(refreshToken);

      expect(result.userId).toBe(123);
      expect(result.tokenPart).toBe('abc123def456');
    });

    it('should throw UnauthorizedException for token without dot', () => {
      const invalidToken = '123abc123def456';

      expect(() => parseRefreshToken(invalidToken)).toThrow(UnauthorizedException);
      expect(() => parseRefreshToken(invalidToken)).toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedException for token without userId', () => {
      const invalidToken = '.abc123def456';

      expect(() => parseRefreshToken(invalidToken)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for token without tokenPart', () => {
      const invalidToken = '123.';

      expect(() => parseRefreshToken(invalidToken)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-integer userId', () => {
      const invalidToken = 'abc.tokenpart';

      expect(() => parseRefreshToken(invalidToken)).toThrow(UnauthorizedException);
    });

    it('should parse token with multiple dots correctly', () => {
      const token = '123.45.tokenpart';

      const result = parseRefreshToken(token);

      expect(result.userId).toBe(123);
      expect(result.tokenPart).toBe('45.tokenpart');
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      const expiredDate = new Date(Date.now() - 1000);

      const result = isTokenExpired(expiredDate);

      expect(result).toBe(true);
    });

    it('should return false for valid token', () => {
      const validDate = new Date(Date.now() + 1000);

      const result = isTokenExpired(validDate);

      expect(result).toBe(false);
    });

    it('should return true for token expiring right now', () => {
      const nowDate = new Date(Date.now() - 1);

      const result = isTokenExpired(nowDate);

      expect(result).toBe(true);
    });
  });
});
