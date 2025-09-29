import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsInt, Min, Max, IsOptional, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User login', example: 'john_doe' })
  @IsString()
  @Length(3, 50)
  login: string;

  @ApiProperty({ description: 'User email', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', example: 'securePassword123' })
  @IsString()
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
