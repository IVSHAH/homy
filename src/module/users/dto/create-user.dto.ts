import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsInt, Min, Max, IsOptional, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Логин пользователя', example: 'john_doe' })
  @IsString()
  @Length(3, 50)
  login: string;

  @ApiProperty({ description: 'Email пользователя', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Пароль пользователя', example: 'securePassword123' })
  @IsString()
  @Length(6, 100)
  password: string;

  @ApiProperty({ description: 'Возраст пользователя', example: 25 })
  @IsInt()
  @Min(0)
  @Max(150)
  age: number;

  @ApiProperty({
    description: 'Описание о себе',
    example: 'Люблю программирование и путешествия',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;
}
