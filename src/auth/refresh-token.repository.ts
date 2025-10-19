import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repository: Repository<RefreshToken>
  ) {}

  async create(data: {
    userId: number;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<RefreshToken> {
    const refreshToken = this.repository.create(data);
    return this.repository.save(refreshToken);
  }

  async findById(id: number): Promise<RefreshToken | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUserIdAndHash(userId: number, tokenHash: string): Promise<RefreshToken | null> {
    return this.repository.findOne({ where: { userId, tokenHash } });
  }

  async revokeToken(id: number): Promise<void> {
    await this.repository.update(id, { revoked: true });
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.repository.update({ userId }, { revoked: true });
  }

  async revokeAllExceptCurrent(userId: number, currentTokenId: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revoked: true })
      .where('userId = :userId', { userId })
      .andWhere('id != :currentTokenId', { currentTokenId })
      .execute();
  }

  async deleteExpired(): Promise<void> {
    await this.repository.delete({ expiresAt: LessThan(new Date()) });
  }

  async findAllByUserId(userId: number): Promise<RefreshToken[]> {
    return this.repository.find({
      where: { userId, revoked: false },
      order: { createdAt: 'DESC' },
    });
  }

  async countActiveTokens(userId: number): Promise<number> {
    return this.repository.count({ where: { userId, revoked: false } });
  }
}
