import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ description: 'ID пользователя', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Логин пользователя', example: 'john_doe' })
  @Expose()
  login: string;

  @ApiProperty({ description: 'Email пользователя', example: 'john@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Возраст пользователя', example: 25 })
  @Expose()
  age: number;

  @ApiProperty({
    description: 'Описание о себе',
    example: 'Люблю программирование',
    required: false,
  })
  @Expose()
  description?: string;

  @ApiProperty({ description: 'Дата создания', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.login = user.login;
    this.email = user.email;
    this.age = user.age;
    this.description = user.description;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
