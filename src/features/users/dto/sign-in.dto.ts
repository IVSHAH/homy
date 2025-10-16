import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SignInDto {
  @ApiProperty({ description: 'User login', example: 'john_doe' })
  @IsString()
  login: string;

  @ApiProperty({ description: 'User password', example: 'securePassword123' })
  @IsString()
  password: string;
}
