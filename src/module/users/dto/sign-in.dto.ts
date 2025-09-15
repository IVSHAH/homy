import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SignInDto {
  @ApiProperty({ description: 'Логин пользователя', example: 'john_doe' })
  @IsString()
  login: string;

  @ApiProperty({ description: 'Пароль пользователя', example: 'securePassword123' })
  @IsString()
  password: string;
}
