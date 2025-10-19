import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEmail, IsInt, Min, Max, IsOptional, IsString, Length } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    description: 'User login',
    example: 'new_login',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  login?: string;

  @ApiProperty({
    description: 'User email',
    example: 'new_email@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'User password',
    example: 'newSecurePassword123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(6, 100)
  password?: string;

  @ApiProperty({ description: 'User age', example: 26, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  age?: number;

  @ApiProperty({
    description: 'About user',
    example: 'Updated about me',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;
}
