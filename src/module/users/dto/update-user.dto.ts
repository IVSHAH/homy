import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEmail, IsInt, Min, Max, IsOptional, IsString, Length } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'new_email@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Возраст пользователя', example: 26, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  age?: number;

  @ApiProperty({
    description: 'Описание о себе',
    example: 'Новое описание о себе',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;
}
