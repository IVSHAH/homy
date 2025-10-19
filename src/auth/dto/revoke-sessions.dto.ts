import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class RevokeSessionsDto {
  @ApiProperty({
    description: 'Current session token ID to keep active',
    example: 1,
  })
  @IsNumber()
  currentTokenId: number;
}
