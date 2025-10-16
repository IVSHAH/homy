import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'User login', example: 'john_doe' })
  @Expose()
  login: string;

  @ApiProperty({ description: 'User email', example: 'john@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'User age', example: 25 })
  @Expose()
  age: number;

  @ApiProperty({
    description: 'About user',
    example: 'I love programming',
    required: false,
  })
  @Expose()
  description?: string;

  @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2024-01-01T00:00:00.000Z' })
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
