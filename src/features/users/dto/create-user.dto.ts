import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsInt,
  Min,
  Max,
  IsOptional,
  Length,
  IsNotEmpty,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User login', example: 'john_doe' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  login: string;

  @ApiProperty({ description: 'User email', example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User password', example: 'securePassword123' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 100)
  password: string;

  @ApiProperty({ description: 'User age', example: 25 })
  @IsInt()
  @Min(0)
  @Max(150)
  age: number;

  @ApiProperty({
    description: 'About user',
    example: 'Love programming and traveling',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;
}
