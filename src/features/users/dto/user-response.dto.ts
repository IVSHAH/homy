import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsString, IsEmail, IsOptional, IsDate, Min, Max } from 'class-validator';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'User login', example: 'john_doe' })
  @Expose()
  @IsString()
  login: string;

  @ApiProperty({ description: 'User email', example: 'john@example.com' })
  @Expose()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User age', example: 25 })
  @Expose()
  @IsNumber()
  @Min(0)
  @Max(150)
  age: number;

  @ApiProperty({
    description: 'About user',
    example: 'I love programming',
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  @IsDate()
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
