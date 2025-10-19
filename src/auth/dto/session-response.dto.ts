import { ApiProperty } from '@nestjs/swagger';
import { RefreshToken } from '../entities/refresh-token.entity';

export class SessionResponseDto {
  @ApiProperty({
    description: 'Session ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'IP address of the session',
    example: '192.168.1.1',
    required: false,
  })
  ipAddress?: string;

  @ApiProperty({
    description: 'User agent (browser/device info)',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
    required: false,
  })
  userAgent?: string;

  @ApiProperty({
    description: 'Session creation timestamp',
    example: '2025-10-20T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Session expiration timestamp',
    example: '2025-10-27T00:00:00.000Z',
  })
  expiresAt: Date;

  constructor(token: RefreshToken) {
    this.id = token.id;
    this.ipAddress = token.ipAddress;
    this.userAgent = token.userAgent;
    this.createdAt = token.createdAt;
    this.expiresAt = token.expiresAt;
  }
}
