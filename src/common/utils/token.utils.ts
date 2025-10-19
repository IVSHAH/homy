import { UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';

export interface RefreshTokenData {
  token: string;
  rawToken: string;
  expiresAt: Date;
}

export interface ParsedRefreshToken {
  userId: number;
  tokenPart: string;
}

export function generateRefreshToken(userId: number, ttlMs: number): RefreshTokenData {
  const rawToken = randomBytes(32).toString('hex');
  const token = `${userId}.${rawToken}`;
  const expiresAt = new Date(Date.now() + ttlMs);

  return { token, rawToken, expiresAt };
}

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

export function isTokenExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now();
}
